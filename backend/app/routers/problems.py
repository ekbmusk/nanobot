from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.database import get_db
from app.models.problem import Problem
from app.models.user import User
from app.schemas.problem import ProblemOut, AnswerCheck, AnswerResult
from app.services.progress_service import update_streak

router = APIRouter()

# Seed problems if DB is empty
SEED_PROBLEMS = [
    {
        "topic": "atomic_structure",
        "question": "Сутегі атомында электрон n=3 деңгейінде. Оның энергиясын эВ-пен табыңыз.",
        "formula": "E_n = -\\frac{13{,}6}{n^2}",
        "correct_answer": "-1.51",
        "solution": "E₃ = -13,6 / 3² = -13,6 / 9 = -1,51 эВ.",
        "difficulty": "1",
        "tags": ["Бор моделі", "энергия деңгейі"],
    },
    {
        "topic": "atomic_structure",
        "question": "Электронның массасы $9{,}1 \\times 10^{-31}$ кг, жылдамдығы $10^6$ м/с. Де Бройль толқын ұзындығын нм-мен табыңыз. ($h = 6{,}63 \\times 10^{-34}$ Дж·с)",
        "formula": "\\lambda = \\frac{h}{mv}",
        "correct_answer": "0.73",
        "solution": "λ = 6,63×10⁻³⁴ / (9,1×10⁻³¹ × 10⁶) = 6,63×10⁻³⁴ / 9,1×10⁻²⁵ = 7,3×10⁻¹⁰ м = 0,73 нм.",
        "difficulty": "2",
        "tags": ["де Бройль", "толқын ұзындығы"],
    },
    {
        "topic": "atomic_structure",
        "question": "Көміртек-12 изотопында 6 протон бар. Нейтрон саны қанша?",
        "formula": "A = Z + N",
        "correct_answer": "6",
        "solution": "A = 12, Z = 6. N = A - Z = 12 - 6 = 6 нейтрон.",
        "difficulty": "1",
        "tags": ["атом құрылысы", "изотоп"],
    },
    {
        "topic": "atomic_structure",
        "question": "n = 3 қабатында ең көп қанша электрон бола алады?",
        "formula": "N_{max} = 2n^2",
        "correct_answer": "18",
        "solution": "Nmax = 2 × 3² = 2 × 9 = 18 электрон.",
        "difficulty": "1",
        "tags": ["электрон конфигурациясы"],
    },
    {
        "topic": "quantum_basics",
        "question": "Толқын ұзындығы $\\lambda = 500$ нм фотонның энергиясын эВ-пен табыңыз. ($h = 6{,}63 \\times 10^{-34}$ Дж·с, $c = 3 \\times 10^8$ м/с, 1 эВ = $1{,}6 \\times 10^{-19}$ Дж)",
        "formula": "E = \\frac{hc}{\\lambda}",
        "correct_answer": "2.48",
        "solution": "E = (6,63×10⁻³⁴ × 3×10⁸) / (500×10⁻⁹) = 3,978×10⁻¹⁹ Дж. E(эВ) = 3,978×10⁻¹⁹ / 1,6×10⁻¹⁹ ≈ 2,48 эВ.",
        "difficulty": "2",
        "tags": ["фотон", "энергия"],
    },
    {
        "topic": "quantum_basics",
        "question": "Металдың шығу жұмысы $A = 2{,}0$ эВ. Фотон энергиясы $E = 4{,}5$ эВ болса, шыққан электронның кинетикалық энергиясын табыңыз.",
        "formula": "E_k = h\\nu - A",
        "correct_answer": "2.5",
        "solution": "Eₖ = E - A = 4,5 - 2,0 = 2,5 эВ.",
        "difficulty": "2",
        "tags": ["фотоэффект"],
    },
    {
        "topic": "quantum_basics",
        "question": "Координата анықсыздығы $\\Delta x = 0{,}1$ нм. Электронның импульс анықсыздығын табыңыз. ($\\hbar = 1{,}055 \\times 10^{-34}$ Дж·с)",
        "formula": "\\Delta p \\geq \\frac{\\hbar}{2 \\Delta x}",
        "correct_answer": "5.275e-25",
        "solution": "Δp ≥ ℏ/(2Δx) = 1,055×10⁻³⁴ / (2 × 0,1×10⁻⁹) = 1,055×10⁻³⁴ / 2×10⁻¹⁰ = 5,275×10⁻²⁵ кг·м/с.",
        "difficulty": "3",
        "tags": ["анықсыздық принципі", "Гейзенберг"],
    },
    {
        "topic": "quantum_basics",
        "question": "Электрон $n = 4$ деңгейінен $n = 2$ деңгейіне ауысқанда шығатын фотонның энергиясын табыңыз.",
        "formula": "\\Delta E = 13{,}6\\left(\\frac{1}{n_f^2} - \\frac{1}{n_i^2}\\right)",
        "correct_answer": "2.55",
        "solution": "ΔE = 13,6 × (1/2² - 1/4²) = 13,6 × (1/4 - 1/16) = 13,6 × (4/16 - 1/16) = 13,6 × 3/16 = 2,55 эВ.",
        "difficulty": "3",
        "tags": ["сутегі спектрі", "Бальмер сериясы"],
    },
    {
        "topic": "nanomaterials",
        "question": "Диаметрі $d = 10$ нм наночастиктің бет ауданы/көлем қатынасын табыңыз (нм⁻¹).",
        "formula": "\\frac{S}{V} = \\frac{6}{d}",
        "correct_answer": "0.6",
        "solution": "S/V = 6/d = 6/10 = 0,6 нм⁻¹.",
        "difficulty": "1",
        "tags": ["бет ауданы", "наночастик"],
    },
    {
        "topic": "nanomaterials",
        "question": "Фуллерен C₆₀ молекуласының молярлық массасы қанша г/моль? (C атомның массасы = 12 г/моль)",
        "formula": "M = n \\cdot M_{\\text{атом}}",
        "correct_answer": "720",
        "solution": "M(C₆₀) = 60 × 12 = 720 г/моль.",
        "difficulty": "1",
        "tags": ["фуллерен", "молярлық масса"],
    },
    {
        "topic": "nanomaterials",
        "question": "Кванттық нүктенің радиусы 2 есе кішірейсе, оның тыйым салынған аймақ ені қалай өзгереді?",
        "formula": "\\Delta E \\propto \\frac{1}{R^2}",
        "correct_answer": "4",
        "solution": "ΔE ~ 1/R². R екі есе кішірейсе: ΔE' ~ 1/(R/2)² = 4/R². Демек, тыйым салынған аймақ ені 4 есе артады.",
        "difficulty": "3",
        "tags": ["кванттық нүкте", "кванттық шектелу"],
    },
    {
        "topic": "nanomaterials",
        "question": "Алтын наночастиктің диаметрі 5 нм, атом диаметрі 0,29 нм. Беттік атомдар үлесін шамамен есептеңіз.",
        "formula": "f \\approx \\frac{4}{d/d_0}",
        "correct_answer": "0.232",
        "solution": "f ≈ 4 / (5/0,29) = 4 / 17,24 ≈ 0,232. Яғни бөлшектің шамамен 23% атомдары бетінде.",
        "difficulty": "2",
        "tags": ["беттік атомдар", "нанобөлшек"],
    },
    {
        "topic": "nano_applications",
        "question": "Күн элементі 200 Вт/м² жарық қуатын қабылдап, 36 Вт/м² электр қуатын береді. ПӘК-ін табыңыз.",
        "formula": "\\eta = \\frac{P_{\\text{шығыс}}}{P_{\\text{кіріс}}} \\times 100\\%",
        "correct_answer": "18",
        "solution": "η = (36/200) × 100% = 18%.",
        "difficulty": "1",
        "tags": ["күн энергиясы", "ПӘК"],
    },
    {
        "topic": "nano_applications",
        "question": "Бір электронды транзистордың сыйымдылығы $C = 10^{-18}$ Ф. Кулон блокада энергиясын эВ-пен табыңыз. ($e = 1{,}6 \\times 10^{-19}$ Кл)",
        "formula": "E_C = \\frac{e^2}{2C}",
        "correct_answer": "0.08",
        "solution": "Eс = (1,6×10⁻¹⁹)² / (2 × 10⁻¹⁸) = 2,56×10⁻³⁸ / 2×10⁻¹⁸ = 1,28×10⁻²⁰ Дж. Eс(эВ) = 1,28×10⁻²⁰ / 1,6×10⁻¹⁹ = 0,08 эВ.",
        "difficulty": "3",
        "tags": ["наноэлектроника", "Кулон блокадасы"],
    },
    {
        "topic": "nano_applications",
        "question": "Наноматериал негізіндегі катализатор 1 сағатта 500 моль өнім береді. Катализатор центрлерінің саны 100 моль. TOF мәнін табыңыз (сағ⁻¹).",
        "formula": "TOF = \\frac{n_{\\text{өнім}}}{n_{\\text{кат}} \\cdot t}",
        "correct_answer": "5",
        "solution": "TOF = 500 / (100 × 1) = 5 сағ⁻¹.",
        "difficulty": "2",
        "tags": ["катализ", "TOF"],
    },
    {
        "topic": "nano_applications",
        "question": "Жартылай өткізгіш наноматериалдың тыйым салынған аймақ ені $E_g = 1{,}8$ эВ. Фотокатализ үшін жарық толқын ұзындығы қандай болуы керек? ($hc = 1240$ эВ·нм)",
        "formula": "\\lambda_{\\text{макс}} = \\frac{hc}{E_g}",
        "correct_answer": "689",
        "solution": "λmax = hc/Eg = 1240/1,8 ≈ 689 нм. Демек, 689 нм-ден қысқа толқын ұзындықты жарық қажет.",
        "difficulty": "3",
        "tags": ["фотокатализ", "толқын ұзындығы"],
    },
    {
        "topic": "atomic_structure",
        "question": "Уран-238 изотопында 92 протон бар. Нейтрондар санын табыңыз.",
        "correct_answer": "146",
        "solution": "N = A - Z = 238 - 92 = 146 нейтрон.",
        "difficulty": "1",
        "tags": ["изотоптар", "ядро"],
    },
    {
        "topic": "atomic_structure",
        "question": "Көміртек-14 жартылай ыдырау периоды 5730 жыл. Ыдырау тұрақтысын (жыл⁻¹) табыңыз. Жауапты $\\times 10^{-4}$ түрінде жазыңыз.",
        "formula": "\\lambda = \\frac{\\ln 2}{T_{1/2}}",
        "correct_answer": "1.21",
        "solution": "λ = ln2 / 5730 = 0,693 / 5730 ≈ 1,21 × 10⁻⁴ жыл⁻¹.",
        "difficulty": "2",
        "tags": ["радиоактивтілік", "жартылай ыдырау"],
    },
    {
        "topic": "quantum_basics",
        "question": "Электронның импульсі $p = 3 \\times 10^{-24}$ кг·м/с. Координата анықсыздығының ең аз мәнін (нм) табыңыз. ($\\hbar = 1{,}055 \\times 10^{-34}$ Дж·с)",
        "formula": "\\Delta x \\geq \\frac{\\hbar}{2\\Delta p}",
        "correct_answer": "0.018",
        "solution": "Δx ≥ ℏ/(2p) = 1,055×10⁻³⁴ / (2 × 3×10⁻²⁴) = 1,76×10⁻¹¹ м ≈ 0,018 нм.",
        "difficulty": "2",
        "tags": ["анықсыздық принципі", "импульс"],
    },
    {
        "topic": "quantum_basics",
        "question": "Потенциалдық тосқауыл ені $d = 0{,}5$ нм, $\\kappa = 10$ нм⁻¹. Туннельдеу ықтималдығын $T \\approx e^{-2\\kappa d}$ формуласымен табыңыз. Жауапты $\\times 10^{-5}$ түрінде жазыңыз.",
        "formula": "T \\approx e^{-2\\kappa d}",
        "correct_answer": "4.54",
        "solution": "T = e^(-2 × 10 × 0,5) = e^(-10) ≈ 4,54 × 10⁻⁵.",
        "difficulty": "3",
        "tags": ["туннельдік эффект"],
    },
    {
        "topic": "nanomaterials",
        "question": "Материалдың Юнг модулі: толтырғыш $E_f = 300$ ГПа (көлемі 30%), матрица $E_m = 3$ ГПа (көлемі 70%). Композит модулін (ГПа) табыңыз.",
        "formula": "E_c = E_f V_f + E_m V_m",
        "correct_answer": "92.1",
        "solution": "Ec = 300 × 0,3 + 3 × 0,7 = 90 + 2,1 = 92,1 ГПа.",
        "difficulty": "2",
        "tags": ["нанокомпозит", "механика"],
    },
    {
        "topic": "nanomaterials",
        "question": "Нанотүтіктің хиральдік индекстері (6, 6). Диаметрін (нм) табыңыз. ($a = 0{,}246$ нм)",
        "formula": "d = \\frac{a}{\\pi}\\sqrt{n^2 + nm + m^2}",
        "correct_answer": "0.814",
        "solution": "d = (0,246/π)√(36+36+36) = (0,0783) × √108 = 0,0783 × 10,39 ≈ 0,814 нм.",
        "difficulty": "3",
        "tags": ["нанотүтік", "хиральдік"],
    },
    {
        "topic": "nano_applications",
        "question": "Магнитті наночастиктер гипертермия қуаты 50 мВт/г бергенде, 10 г ісік тінін 37°C-ден 42°C-ге қыздыру үшін қанша секунд қажет? (Тіннің жылу сыйымдылығы $c = 3{,}5$ Дж/(г·°C))",
        "correct_answer": "350",
        "solution": "Q = mcΔT = 10 × 3,5 × 5 = 175 Дж. P = 50 мВт/г × 10 г = 0,5 Вт. t = Q/P = 175/0,5 = 350 с.",
        "difficulty": "3",
        "tags": ["наномедицина", "гипертермия"],
    },
    {
        "topic": "nano_applications",
        "question": "Кванттық нүкте радиусы 3 нм, тыйым салынған аймақ ені $E_{g,0} = 1{,}5$ эВ. Тиімді массасы $\\mu = 0{,}05 m_e$. Жалпы $E_g$ табыңыз (эВ). ($\\hbar^2\\pi^2/(2\\mu R^2)$ = 0,25 эВ деп алыңыз)",
        "formula": "E_g = E_{g,0} + \\frac{\\hbar^2 \\pi^2}{2\\mu R^2}",
        "correct_answer": "1.75",
        "solution": "Eg = 1,5 + 0,25 = 1,75 эВ. Кванттық шектелу салдарынан аймақ ені артады.",
        "difficulty": "2",
        "tags": ["кванттық нүкте", "энергия"],
    },
]


def seed_problems(db: Session):
    count = db.query(Problem).count()
    if count == 0:
        for p in SEED_PROBLEMS:
            db.add(Problem(**p))
        db.commit()


@router.get("", response_model=List[ProblemOut])
async def get_problems(
    difficulty: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    seed_problems(db)
    query = db.query(Problem)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    if topic:
        query = query.filter(Problem.topic == topic)
    return query.all()


@router.get("/{problem_id}", response_model=ProblemOut)
async def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")
    return problem


@router.post("/{problem_id}/check", response_model=AnswerResult)
async def check_answer(problem_id: int, body: AnswerCheck, request: Request, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")

    # Normalize answer for comparison
    user_ans = body.answer.strip().replace(",", ".").lower()
    correct = problem.correct_answer.strip().replace(",", ".").lower()

    is_correct = user_ans == correct
    # Fallback: numeric comparison with tolerance
    if not is_correct:
        try:
            is_correct = abs(float(user_ans) - float(correct)) < 0.01
        except (ValueError, TypeError):
            pass

    # Update streak on correct answer
    if is_correct:
        try:
            init_data = request.headers.get("x-telegram-init-data", "")
            if "user" in init_data:
                import json, urllib.parse
                params = dict(urllib.parse.parse_qsl(init_data))
                user_data = json.loads(params.get("user", "{}"))
                telegram_id = user_data.get("id")
                if telegram_id:
                    user = db.query(User).filter(User.telegram_id == telegram_id).first()
                    if user:
                        update_streak(db, user)
                        db.commit()
        except Exception:
            pass

    return AnswerResult(
        correct=is_correct,
        message="Дұрыс жауап!" if is_correct else f"Қате. Дұрыс жауап: {problem.correct_answer}",
        solution=problem.solution if not is_correct else None,
    )
