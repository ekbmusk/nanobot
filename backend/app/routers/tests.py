from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
import random

from app.database.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.models.progress import Progress as ProgressModel
from app.models.admin_test import AdminTestQuestion
from app.schemas.test_result import TestSet, TestQuestion, TestSubmit, TestResultOut

router = APIRouter()

TOPIC_META = {
    "mechanics": "Механика",
    "thermodynamics": "Термодинамика",
    "electromagnetism": "Электромагнетизм",
    "optics": "Оптика",
    "quantum": "Кванттық физика",
    "nuclear": "Ядролық физика",
}

OPTION_TO_IDX = {"A": 0, "B": 1, "C": 2, "D": 3}

# Keep TEST_BANK only for initial seed (used by database.py seeder)
TEST_BANK = [
    {"id": 1, "topic": "mechanics", "question": "Ньютонның бірінші заңын тұжырымдаңыз.", "options": ["Дене тыныштықта немесе бірқалыпты қозғалыста болады, егер оған күш әсер етпесе", "F = ma", "Екі дене өзара тең және қарама-қарсы күштермен әрекеттеседі", "Жылдамдық уақытқа пропорционал"], "correct_answer": 0, "explanation": "Инерция заңы: сыртқы күш болмаса, дене өз қозғалыс күйін сақтайды."},
    {"id": 2, "topic": "mechanics", "question": "Кинетикалық энергия формуласы қандай?", "options": ["E = mgh", "E = mv²/2", "E = Fs", "E = QT"], "correct_answer": 1, "explanation": "Eₖ = mv²/2, мұнда m — масса, v — жылдамдық."},
    {"id": 3, "topic": "electromagnetism", "question": "Омның заңы бойынша ток күші неге тең?", "options": ["I = UR", "I = U/R", "I = R/U", "I = U + R"], "correct_answer": 1, "explanation": "I = U/R — Омның заңы: ток кернеуге тура, кедергіге кері пропорционал."},
    {"id": 4, "topic": "optics", "question": "Жарық жылдамдығы вакуумда нешеге тең?", "options": ["3·10⁸ м/с", "3·10⁶ м/с", "1.5·10⁸ м/с", "6·10⁸ м/с"], "correct_answer": 0, "explanation": "c ≈ 3·10⁸ м/с — жарықтың вакуумдағы жылдамдығы."},
    {"id": 5, "topic": "thermodynamics", "question": "Термодинамиканың бірінші бастамасы нені білдіреді?", "options": ["Жылу пайдасыз жоғалады", "Q = ΔU + A", "Энтропия азаяды", "Жылу тек бір бағытта өтеді"], "correct_answer": 1, "explanation": "Q = ΔU + A: берілген жылу ішкі энергияны өсіруге және жұмыс жасауға жұмсалады."},
    {"id": 6, "topic": "electromagnetism", "question": "Кулон заңындағы k тұрақтысының мәні?", "options": ["9·10⁹ Н·м²/Кл²", "6.67·10⁻¹¹ Н·м²/кг²", "1.6·10⁻¹⁹ Кл", "8.85·10⁻¹² Ф/м"], "correct_answer": 0, "explanation": "k = 9·10⁹ Н·м²/Кл² — электростатикалық тұрақты."},
    {"id": 7, "topic": "mechanics", "question": "Бос түсу үдеуі g нешеге тең?", "options": ["9.8 м/с²", "10 м/с", "9.8 м/с", "9.8 км/с²"], "correct_answer": 0, "explanation": "g ≈ 9.8 м/с² — Жер бетіндегі бос түсу үдеуі."},
    {"id": 8, "topic": "quantum", "question": "Фотоэффект теориясын кім ашты?", "options": ["Ньютон", "Эйнштейн", "Планк", "Бор"], "correct_answer": 1, "explanation": "Эйнштейн 1905 жылы фотоэффектті кванттық теория арқылы түсіндірді."},
    {"id": 9, "topic": "nuclear", "question": "Жарты ыдырау кезеңі дегеніміз не?", "options": ["Барлық ядролардың ыдырауы", "Жартысы ыдырайтын уақыт", "Бір ядроның ыдырауы", "Радиация тоқтайтын уақыт"], "correct_answer": 1, "explanation": "T₁/₂ — бастапқы ядролар санының жартысы ыдырайтын уақыт."},
    {"id": 10, "topic": "nuclear", "question": "Қандай формула массаны энергияға байланыстырады?", "options": ["F = ma", "E = mc²", "E = hν", "p = mv"], "correct_answer": 1, "explanation": "E = mc² — Эйнштейннің массаның эквиваленттік формуласы."},
    {"id": 11, "topic": "mechanics", "question": "Потенциалдық энергия формуласы (биіктіктегі)?", "options": ["E = mv²/2", "E = mgh", "E = kx²/2", "E = qU"], "correct_answer": 1, "explanation": "Ep = mgh, мұнда h — биіктік, g — бос түсу үдеуі."},
    {"id": 12, "topic": "mechanics", "question": "Тербеліс периоды T дегеніміз не?", "options": ["Бір тербелістің ұзақтығы", "Секундтағы тербелістер саны", "Амплитуданың квадраты", "Жиілік"], "correct_answer": 0, "explanation": "T — толық бір тербеліс жасалатын уақыт (с)."},
]


def _db_to_question(q: AdminTestQuestion) -> TestQuestion:
    return TestQuestion(
        id=q.id,
        question=q.question,
        options=[q.option_a, q.option_b, q.option_c, q.option_d],
        correct_answer=OPTION_TO_IDX.get(q.correct_option, 0),
        explanation=q.explanation,
    )


@router.get("/topics")
def get_topics(db: Session = Depends(get_db)):
    rows = db.query(AdminTestQuestion.topic).distinct().all()
    topics = []
    for (topic_id,) in rows:
        count = db.query(AdminTestQuestion).filter(AdminTestQuestion.topic == topic_id).count()
        topics.append({
            "id": topic_id,
            "name": TOPIC_META.get(topic_id, topic_id),
            "count": count,
        })
    return topics


@router.get("/daily", response_model=TestSet)
def get_daily_test(db: Session = Depends(get_db)):
    seed = int(date.today().strftime("%Y%m%d"))
    all_qs = db.query(AdminTestQuestion).all()
    if not all_qs:
        return TestSet(questions=[])
    rng = random.Random(seed)
    selected = rng.sample(all_qs, min(10, len(all_qs)))
    return TestSet(questions=[_db_to_question(q) for q in selected])


@router.get("/daily/status/{telegram_id}")
def get_daily_status(telegram_id: int, db: Session = Depends(get_db)):
    today = date.today().isoformat()
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    completed = bool(user and user.last_daily_date == today)
    return {"completed": completed, "bonus_xp": 50}


@router.get("/random", response_model=TestSet)
def get_random_test(count: int = 10, topic: str = None, db: Session = Depends(get_db)):
    query = db.query(AdminTestQuestion)
    if topic:
        query = query.filter(AdminTestQuestion.topic == topic)
    all_qs = query.all()
    if not all_qs:
        return TestSet(questions=[])
    selected = random.sample(all_qs, min(count, len(all_qs)))
    return TestSet(questions=[_db_to_question(q) for q in selected])


@router.post("/submit", response_model=TestResultOut)
async def submit_test(body: TestSubmit, db: Session = Depends(get_db)):
    question_ids = [a.question_id for a in body.answers]
    db_questions = db.query(AdminTestQuestion).filter(AdminTestQuestion.id.in_(question_ids)).all()
    question_map = {q.id: q for q in db_questions}

    correct = 0
    total = len(body.answers)
    detailed_answers = []
    topic_correct: dict[str, int] = {}
    topic_total: dict[str, int] = {}

    for answer_item in body.answers:
        q = question_map.get(answer_item.question_id)
        if not q:
            continue
        correct_idx = OPTION_TO_IDX.get(q.correct_option, 0)
        is_correct = answer_item.answer == correct_idx
        if is_correct:
            correct += 1
        detailed_answers.append({
            "question_id": answer_item.question_id,
            "answer": answer_item.answer,
            "correct": is_correct,
        })
        topic_total[q.topic] = topic_total.get(q.topic, 0) + 1
        if is_correct:
            topic_correct[q.topic] = topic_correct.get(q.topic, 0) + 1

    percentage = round((correct / total * 100) if total > 0 else 0, 1)
    actual_bonus_xp = 0

    if body.telegram_id:
        user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
        if not user:
            user = User(telegram_id=body.telegram_id)
            db.add(user)
            db.flush()
        elif user.is_banned:
            raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")

        base_xp = int(percentage)
        bonus_xp = 0
        today_str = date.today().isoformat()

        if body.is_daily and user.last_daily_date != today_str:
            actual_bonus_xp = 50
            user.last_daily_date = today_str

        user.score = (user.score or 0) + base_xp + actual_bonus_xp

        # Fix streak
        now = datetime.now(timezone.utc)
        last = user.last_activity
        if last:
            last_aware = last.replace(tzinfo=timezone.utc) if last.tzinfo is None else last
            diff_days = (now.date() - last_aware.date()).days
            if diff_days == 1:
                user.streak = (user.streak or 0) + 1
            elif diff_days == 0:
                pass  # already active today
            else:
                user.streak = 1
        else:
            user.streak = 1
        user.last_activity = now

        result = TestResult(
            user_id=user.id,
            total_questions=total,
            correct_answers=correct,
            percentage=percentage,
            answers=detailed_answers,
        )
        db.add(result)

        now = datetime.now(timezone.utc)
        for topic_id, t_total in topic_total.items():
            t_score = round((topic_correct.get(topic_id, 0) / t_total) * 100, 1)
            rec = (
                db.query(ProgressModel)
                .filter(ProgressModel.user_id == user.id, ProgressModel.topic_id == topic_id)
                .first()
            )
            if rec:
                rec.completion_percent = min(100.0, max(rec.completion_percent, t_score))
                rec.problems_solved += 1
                rec.last_updated = now
            else:
                db.add(ProgressModel(
                    user_id=user.id,
                    topic_id=topic_id,
                    topic_name=TOPIC_META.get(topic_id, topic_id),
                    completion_percent=t_score,
                    problems_solved=1,
                    last_updated=now,
                ))

        db.commit()

    return TestResultOut(
        correct=correct,
        total=total,
        percentage=percentage,
        passed=percentage >= 70,
        xp_earned=int(percentage) if body.telegram_id else 0,
        bonus_xp=actual_bonus_xp,
    )


@router.get("/history/{telegram_id}")
async def get_test_history(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return []
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == user.id)
        .order_by(TestResult.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": r.id,
            "correct": r.correct_answers,
            "total": r.total_questions,
            "percentage": r.percentage,
            "date": r.created_at.strftime("%d.%m.%Y"),
        }
        for r in results
    ]
