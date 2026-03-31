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
from app.services.analytics_service import update_topic_mastery
from app.services.achievement_service import check_and_award
from app.services.progress_service import update_streak

router = APIRouter()

TOPIC_META = {
    "atomic_structure": "Атом құрылысы",
    "quantum_basics": "Кванттық физика негіздері",
    "nanomaterials": "Наноматериалдар",
    "nano_applications": "Нанотехнология қолданыстары",
}

OPTION_TO_IDX = {"A": 0, "B": 1, "C": 2, "D": 3}

# Keep TEST_BANK only for initial seed (used by database.py seeder)
TEST_BANK = [
    {"id": 1, "topic": "atomic_structure", "question": "1 нанометр неге тең?", "options": ["$10^{-6}$ м", "$10^{-9}$ м", "$10^{-12}$ м", "$10^{-3}$ м"], "correct_answer": 1, "explanation": "1 нм = 10⁻⁹ м — бұл миллиметрдің миллиондан бір бөлігі."},
    {"id": 2, "topic": "atomic_structure", "question": "Сутегі атомында n=2 деңгейіндегі электронның энергиясы қанша?", "options": ["-13,6 эВ", "-3,4 эВ", "-1,51 эВ", "-0,85 эВ"], "correct_answer": 1, "explanation": "$E_2 = -13{,}6/2^2 = -13{,}6/4 = -3{,}4$ эВ."},
    {"id": 3, "topic": "atomic_structure", "question": "n = 2 қабатында ең көп қанша электрон болады?", "options": ["2", "4", "8", "16"], "correct_answer": 2, "explanation": "$N_{max} = 2n^2 = 2 \\times 4 = 8$ электрон."},
    {"id": 4, "topic": "quantum_basics", "question": "Фотоэлектрлік эффектте не бақыланады?", "options": ["Жарықтың шашырауы", "Электрондардың бетінен шығуы", "Ядроның ыдырауы", "Рентген сәулесі"], "correct_answer": 1, "explanation": "Фотоэффект — жарық әсерінен электрондардың металл бетінен шығу құбылысы."},
    {"id": 5, "topic": "quantum_basics", "question": "Планк тұрақтысы $h$ нені сипаттайды?", "options": ["Гравитацияны", "Энергия кванттауын", "Электр зарядын", "Жарық жылдамдығын"], "correct_answer": 1, "explanation": "h = 6,63×10⁻³⁴ Дж·с — энергияның үзік-үзік (кванттық) берілуін сипаттайтын тұрақты."},
    {"id": 6, "topic": "quantum_basics", "question": "Гейзенберг анықсыздық принципі бойынша бір мезгілде дәл анықтауға болмайтын шамалар:", "options": ["Масса мен заряд", "Координата мен импульс", "Температура мен қысым", "Энергия мен масса"], "correct_answer": 1, "explanation": "$\\Delta x \\cdot \\Delta p \\geq \\hbar/2$ — координата мен импульсты бір уақытта дәл білу мүмкін емес."},
    {"id": 7, "topic": "nanomaterials", "question": "Фуллерен C₆₀ қанша көміртек атомынан тұрады?", "options": ["12", "24", "60", "100"], "correct_answer": 2, "explanation": "C₆₀ — 60 көміртек атомынан тұратын сфералық молекула (футбол добына ұқсас)."},
    {"id": 8, "topic": "nanomaterials", "question": "Наночастик мөлшері кішірейгенде бет ауданы/көлем қатынасы қалай өзгереді?", "options": ["Кемиді", "Артады", "Өзгермейді", "Алдымен артады, содан кейін кемиді"], "correct_answer": 1, "explanation": "S/V = 6/d: диаметр кішірейген сайын бұл қатынас артады."},
    {"id": 9, "topic": "nanomaterials", "question": "Графен — бұл не?", "options": ["Көміртектің 3D құрылымы", "Көміртектің бір атомдық қалыңдықтағы 2D қабаты", "Кремнийдің нанобөлшегі", "Алтынның жұқа қабаты"], "correct_answer": 1, "explanation": "Графен — алтыбұрышты торда орналасқан көміртек атомдарының бір атомдық қалыңдықтағы жазық қабаты."},
    {"id": 10, "topic": "nano_applications", "question": "Сканерлеуші туннельдік микроскоп (СТМ) қандай құбылысқа негізделген?", "options": ["Жарық шағылуы", "Туннельдік эффект", "Магнитті резонанс", "Ультрадыбыс"], "correct_answer": 1, "explanation": "СТМ кванттық туннельдік эффектке негізделген — электрон потенциалдық тосқауылдан өтеді."},
    {"id": 11, "topic": "nano_applications", "question": "Кванттық нүктелер медицинада не үшін қолданылады?", "options": ["Дәрі өндіру", "Флуоресцентті белгілеу", "Хирургиялық кесу", "Рентген түсіру"], "correct_answer": 1, "explanation": "Кванттық нүктелер белгілі бір түсте жарқырайды — биологиялық бейнелеуде белгілегіш ретінде қолданылады."},
    {"id": 12, "topic": "nano_applications", "question": "Нанотехнологияның негізгі артықшылығы нені пайдалануда?", "options": ["Макро-масштабтағы қасиеттер", "Беттік эффектілер мен кванттық қасиеттер", "Тек механикалық беріктік", "Тек электр өткізгіштік"], "correct_answer": 1, "explanation": "Нанодеңгейде беттік эффектілер мен кванттық құбылыстар басым болады, бұл жаңа ерекше қасиеттер береді."},
    {"id": 13, "topic": "atomic_structure", "question": "Радиоактивті ыдырау заңы бойынша уақыт өткен сайын ядролар саны қалай өзгереді?", "options": ["Сызықтық артады", "Экспоненциалды кемиді", "Тұрақты қалады", "Квадраттық артады"], "correct_answer": 1, "explanation": "$N(t) = N_0 e^{-\\lambda t}$ — ядролар саны уақыт өткен сайын экспоненциалды түрде кемиді."},
    {"id": 14, "topic": "atomic_structure", "question": "Бор радиусы (a₀) шамамен нешеге тең?", "options": ["0,053 нм", "0,53 нм", "5,3 нм", "0,0053 нм"], "correct_answer": 0, "explanation": "Бор радиусы $a_0 = 0{,}053$ нм — сутегі атомының негізгі күйдегі орбита радиусы."},
    {"id": 15, "topic": "quantum_basics", "question": "Шрёдингер теңдеуіндегі $\\Psi$ функциясы нені сипаттайды?", "options": ["Бөлшектің жылдамдығын", "Бөлшектің кванттық күйін", "Электрлік потенциалды", "Температура өзгерісін"], "correct_answer": 1, "explanation": "Толқындық функция Ψ — кванттық жүйенің толық ақпаратын қамтитын математикалық объект."},
    {"id": 16, "topic": "quantum_basics", "question": "Де Бройль бойынша электронның толқын ұзындығы неге тәуелді?", "options": ["Зарядына", "Импульсіне (массасы мен жылдамдығына)", "Температурасына", "Ядро мөлшеріне"], "correct_answer": 1, "explanation": "$\\lambda = h/(mv)$ — толқын ұзындығы бөлшектің импульсіне кері пропорционал."},
    {"id": 17, "topic": "nanomaterials", "question": "Холл-Петч заңы бойынша түйір мөлшерін кішірейткенде не болады?", "options": ["Материал жұмсарады", "Материал берігірек болады", "Электр өткізгіштігі артады", "Балқу температурасы өседі"], "correct_answer": 1, "explanation": "$\\sigma_y = \\sigma_0 + k/\\sqrt{d}$ — түйір мөлшері (d) кішірейген сайын аққыштық шегі артады."},
    {"id": 18, "topic": "nanomaterials", "question": "Көміртекті нанотүтіктердің (КНТ) ерекше қасиеті:", "options": ["Электр өткізбейді", "Болаттан 100 есе берік", "Тек сұйық күйде тұрақты", "Көрінетін жарықты жұтпайды"], "correct_answer": 1, "explanation": "КНТ — өте жоғары механикалық беріктікке ие (100 ГПа+), болаттан 100 есе берік, алюминийден 6 есе жеңіл."},
    {"id": 19, "topic": "nano_applications", "question": "EPR эффекті наномедицинада не үшін маңызды?", "options": ["Дәрілерді ауыз арқылы жеткізу", "Наночастиктердің ісікте жиналуы", "Рентген бейнелеу", "Қан анализі"], "correct_answer": 1, "explanation": "EPR (Enhanced Permeability and Retention) — ісік тамырларының тесіктері арқылы наночастиктер ісікте жиналады."},
    {"id": 20, "topic": "nano_applications", "question": "Мур заңы бойынша транзисторлар саны қанша уақытта екі есе артады?", "options": ["6 ай", "1 жыл", "2 жыл", "5 жыл"], "correct_answer": 2, "explanation": "Мур заңы: микросхемадағы транзисторлар саны шамамен әр 2 жылда екі есе артады."},
]


def _db_to_question(q: AdminTestQuestion) -> TestQuestion:
    return TestQuestion(
        id=q.id,
        question=q.question,
        options=[q.option_a, q.option_b, q.option_c, q.option_d],
        correct_answer=OPTION_TO_IDX.get(q.correct_option, 0),
        explanation=q.explanation,
        image_url=q.image_url,
        table_data=q.table_data,
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
    new_achievements = []
    result = None

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
            user.last_daily_date = today_str
            db.flush()  # Prevent race condition on concurrent submissions
            actual_bonus_xp = 50

        user.score = (user.score or 0) + base_xp + actual_bonus_xp
        update_streak(db, user)

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

        # Update topic mastery with per-question results
        mastery_results: dict[str, list[bool]] = {}
        for answer_item in body.answers:
            q = question_map.get(answer_item.question_id)
            if not q:
                continue
            correct_idx = OPTION_TO_IDX.get(q.correct_option, 0)
            is_correct_item = answer_item.answer == correct_idx
            mastery_results.setdefault(q.topic, []).append(is_correct_item)
        if mastery_results:
            update_topic_mastery(db, user.id, mastery_results)

        new_achievements = check_and_award(db, user)
        db.commit()

    result_id = result.id if body.telegram_id and result else None
    return TestResultOut(
        result_id=result_id,
        correct=correct,
        total=total,
        percentage=percentage,
        passed=percentage >= 70,
        xp_earned=int(percentage) if body.telegram_id else 0,
        bonus_xp=actual_bonus_xp,
        new_achievements=new_achievements if body.telegram_id else [],
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


@router.get("/review/{result_id}")
async def review_test(result_id: int, db: Session = Depends(get_db)):
    """Return full question details for reviewing a completed test."""
    test_result = db.query(TestResult).filter(TestResult.id == result_id).first()
    if not test_result:
        raise HTTPException(status_code=404, detail="Тест нәтижесі табылмады")

    answers_data = test_result.answers or []
    question_ids = [a.get("question_id") for a in answers_data if a.get("question_id")]
    db_questions = db.query(AdminTestQuestion).filter(AdminTestQuestion.id.in_(question_ids)).all()
    q_map = {q.id: q for q in db_questions}

    questions = []
    for a in answers_data:
        q = q_map.get(a.get("question_id"))
        if not q:
            continue
        correct_idx = OPTION_TO_IDX.get(q.correct_option, 0)
        questions.append({
            "question": q.question,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d],
            "your_answer": a.get("answer"),
            "correct_answer": correct_idx,
            "correct": a.get("correct", False),
            "explanation": q.explanation,
            "topic": TOPIC_META.get(q.topic, q.topic),
            "image_url": q.image_url,
            "table_data": q.table_data,
        })

    return {
        "percentage": test_result.percentage,
        "correct": test_result.correct_answers,
        "total": test_result.total_questions,
        "questions": questions,
    }
