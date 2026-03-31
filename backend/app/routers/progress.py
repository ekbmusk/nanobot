from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.models.progress import Progress as ProgressModel
from app.schemas.progress import ProgressOut, ProgressUpdate, TopicProgress, RecentTest
from app.services.analytics_service import get_analytics
from app.services.gemini_service import get_ai_answer

router = APIRouter()

TOPIC_META = {
    "atomic_structure": ("Атом құрылысы", "⚛️"),
    "quantum_basics": ("Кванттық физика негіздері", "〰️"),
    "nanomaterials": ("Наноматериалдар", "🔬"),
    "nano_applications": ("Нанотехнология қолданыстары", "💡"),
}


@router.get("/{telegram_id}", response_model=ProgressOut)
async def get_user_progress(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return ProgressOut(
            tests_taken=0,
            avg_score=0.0,
            problems_solved=0,
            streak=0,
            total_score=0,
            topics=[],
            recent_tests=[],
        )
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")

    tests = db.query(TestResult).filter(TestResult.user_id == user.id).all()
    tests_taken = len(tests)
    avg_score = round(sum(t.percentage for t in tests) / tests_taken, 1) if tests_taken else 0.0

    progress_records = db.query(ProgressModel).filter(ProgressModel.user_id == user.id).all()
    progress_map = {p.topic_id: p for p in progress_records}

    topics = []
    for topic_id, (name, icon) in TOPIC_META.items():
        rec = progress_map.get(topic_id)
        topics.append(TopicProgress(
            topic_id=topic_id,
            name=name,
            icon=icon,
            percent=rec.completion_percent if rec else 0.0,
            problems_solved=rec.problems_solved if rec else 0,
        ))

    recent = (
        db.query(TestResult)
        .filter(TestResult.user_id == user.id)
        .order_by(TestResult.created_at.desc())
        .limit(5)
        .all()
    )
    recent_tests = [
        RecentTest(
            id=t.id,
            date=t.created_at.strftime("%d.%m"),
            score=t.percentage,
            correct=t.correct_answers,
            total=t.total_questions,
        )
        for t in recent
    ]

    return ProgressOut(
        tests_taken=tests_taken,
        avg_score=avg_score,
        problems_solved=sum(t.problems_solved for t in progress_records),
        streak=user.streak or 0,
        total_score=user.score or 0,
        topics=topics,
        recent_tests=recent_tests,
    )


@router.post("/update")
async def update_progress(body: ProgressUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")

    meta = TOPIC_META.get(body.topic_id)
    if not meta:
        raise HTTPException(status_code=400, detail="Белгісіз тақырып")

    record = (
        db.query(ProgressModel)
        .filter(ProgressModel.user_id == user.id, ProgressModel.topic_id == body.topic_id)
        .first()
    )

    if record:
        record.completion_percent = min(100.0, max(record.completion_percent, body.score))
        record.problems_solved += 1
        record.last_updated = datetime.now(timezone.utc)
    else:
        record = ProgressModel(
            user_id=user.id,
            topic_id=body.topic_id,
            topic_name=meta[0],
            completion_percent=body.score,
            problems_solved=1,
        )
        db.add(record)

    db.commit()
    return {"status": "updated"}


@router.get("/{telegram_id}/analytics")
async def get_user_analytics(telegram_id: int, db: Session = Depends(get_db)):
    data = get_analytics(db, telegram_id)
    if data is None:
        return {
            "topic_mastery": [],
            "weak_topics": [],
            "recommendations": [],
            "overall_trend": "new",
        }
    return data


@router.get("/{telegram_id}/ai-summary")
async def get_ai_summary(telegram_id: int, db: Session = Depends(get_db)):
    """AI tutor generates personalized progress summary and suggestions."""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return {"summary": "Деректер жоқ. Алдымен тест тапсырыңыз!"}

    analytics = get_analytics(db, telegram_id)
    if not analytics or not analytics.get("topic_mastery"):
        return {"summary": "Әлі жеткілікті деректер жоқ. Бірнеше тест тапсырып, AI талдау алыңыз!"}

    # Build context for AI
    lines = [f"Оқушы: {user.first_name or 'белгісіз'}"]
    lines.append(f"XP: {user.score or 0}, Streak: {user.streak or 0} күн")

    tests = db.query(TestResult).filter(TestResult.user_id == user.id).all()
    lines.append(f"Тесттер: {len(tests)}, Орташа балл: {round(sum(t.percentage for t in tests)/len(tests),1) if tests else 0}%")

    for t in analytics["topic_mastery"]:
        trend_label = {"improving":"жақсаруда","declining":"нашарлауда","stable":"тұрақты","new":"жаңа"}.get(t["trend"],"")
        lines.append(f"- {t['name']}: {t['accuracy']}% (соңғы 5: {t['last_5_accuracy']}%, тренд: {trend_label}, деңгей: {t['estimated_level']}/6)")

    weak = analytics.get("weak_topics", [])
    if weak:
        lines.append(f"Әлсіз тақырыптар: {', '.join(weak)}")

    student_name = user.first_name or "дос"
    prompt = (
        "You are a friendly, experienced math tutor talking DIRECTLY to a student. "
        "Write everything IN KAZAKH. Use 'сен' (informal you), address the student by name.\n\n"
        "TONE: Like a cool older brother/sister who is also a math teacher. "
        "Talk TO the student, not ABOUT the student. Say 'Сен мынасын жақсы білесің', "
        "'Саған мына тақырыпты қайталау керек', 'Сенің күшті жағың — ...'. "
        "Be specific, warm, honest. Don't be generic.\n\n"
        f"Student's name: {student_name}\n\n"
        "Write in this format:\n\n"
        "📊 ЖАЛПЫ БАҒАЛАУ:\n"
        f"[Address {student_name} directly. Tell them their level honestly but kindly. "
        "Compare their avg score to passing (70%). Be specific with numbers.]\n\n"
        "💪 КҮШТІ ЖАҚТАРЫ:\n"
        "[Tell them what they're good at. 'Сен ... тақырыбында жақсы нәтиже көрсетіп жатырсың!' "
        "If everything is low, find something positive — effort, streak, number of tests taken.]\n\n"
        "⚠️ ЖҰМЫС ІСТЕЙТІН ТАҚЫРЫПТАР:\n"
        "[Be specific: 'Саған ... тақырыбын қайталау керек. Әсіресе ... формулаларына назар аудар.' "
        "Name specific math concepts, not just topic names.]\n\n"
        "📋 СЕНІҢ ЖОСПАРЫҢ:\n"
        "1. Бүгін: [specific task, e.g. 'Пайыз тақырыбынан 5 есеп шеш']\n"
        "2. Осы аптада: [e.g. 'Геометрия формулаларын қайтала, 3 тест тапсыр']\n"
        "3. Мақсат: [e.g. 'Орташа баллды 70%-ға дейін көтер']\n\n"
        "🔥 МОТИВАЦИЯ:\n"
        f"[Talk to {student_name} warmly. Mention their XP and streak. "
        "'Сен X XP жинадың — бұл жаман емес!' or 'Сенің streak-ің X күн — керемет!'. "
        "End with something like 'Сен бәрін жасай аласың! 💪']\n\n"
        "RULES: Write in Kazakh only. Use natural spoken Kazakh, not textbook style. "
        "No formulas. Use emojis. Each section 2-4 sentences max.\n\n"
        "--- STUDENT DATA ---\n"
        + "\n".join(lines)
    )

    try:
        answer = await get_ai_answer(prompt, max_tokens=2000)
        return {"summary": answer}
    except Exception:
        return {"summary": "AI талдау қазір қолжетімсіз. Кейінірек қайта көріңіз."}
