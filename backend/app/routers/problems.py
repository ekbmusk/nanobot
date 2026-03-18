from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.database import get_db
from app.models.problem import Problem
from app.schemas.problem import ProblemOut, AnswerCheck, AnswerResult

router = APIRouter()

# Seed problems if DB is empty
SEED_PROBLEMS = [
    {
        "topic": "Механика",
        "question": "Дене 20 м/с жылдамдықпен қозғалады және 4 с ішінде тоқтайды. Үдеуді табыңыз.",
        "formula": "a = \\frac{\\Delta v}{t}",
        "correct_answer": "-5",
        "solution": "a = (0 - 20) / 4 = -5 м/с². Теріс мән тежелуді білдіреді.",
        "difficulty": "easy",
        "tags": ["кинематика", "үдеу"],
    },
    {
        "topic": "Механика",
        "question": "Массасы 2 кг дененің импульсі 10 кг·м/с болса, жылдамдығын табыңыз.",
        "formula": "p = mv",
        "correct_answer": "5",
        "solution": "v = p/m = 10/2 = 5 м/с",
        "difficulty": "easy",
        "tags": ["импульс"],
    },
    {
        "topic": "Механика",
        "question": "Массасы 5 кг дене 10 м биіктіктен түседі. Потенциалдық энергиясын табыңыз. (g=10)",
        "formula": "E_p = mgh",
        "correct_answer": "500",
        "solution": "E_p = 5 × 10 × 10 = 500 Дж",
        "difficulty": "easy",
        "tags": ["энергия"],
    },
    {
        "topic": "Электромагнетизм",
        "question": "Кернеуі 220 В, кедергісі 44 Ом болса, ток күшін табыңыз.",
        "formula": "I = \\frac{U}{R}",
        "correct_answer": "5",
        "solution": "I = U/R = 220/44 = 5 А",
        "difficulty": "easy",
        "tags": ["Ом заңы", "тұрақты ток"],
    },
    {
        "topic": "Термодинамика",
        "question": "Дене 500 Дж жылу алды, ішкі энергиясы 300 Дж өсті. Жасалған жұмысты табыңыз.",
        "formula": "Q = \\Delta U + A",
        "correct_answer": "200",
        "solution": "A = Q - ΔU = 500 - 300 = 200 Дж",
        "difficulty": "medium",
        "tags": ["термодинамика", "бірінші бастама"],
    },
    {
        "topic": "Механика",
        "question": "Массасы 3 кг дене 6 м/с жылдамдықпен қозғалады. Кинетикалық энергиясын табыңыз.",
        "formula": "E_k = \\frac{mv^2}{2}",
        "correct_answer": "54",
        "solution": "Eₖ = (3 × 6²) / 2 = (3 × 36) / 2 = 54 Дж",
        "difficulty": "easy",
        "tags": ["энергия", "кинетикалық"],
    },
    {
        "topic": "Электромагнетизм",
        "question": "Ток күші 3 А, кедергі 5 Ом. 10 секундта бөлінетін жылуды табыңыз.",
        "formula": "Q = I^2 R t",
        "correct_answer": "450",
        "solution": "Q = 3² × 5 × 10 = 9 × 5 × 10 = 450 Дж",
        "difficulty": "medium",
        "tags": ["Жоуль-Ленц", "жылу"],
    },
    {
        "topic": "Механика",
        "question": "Маятниктің ауытқу периоды T=2π√(l/g). l=1 м болса, периодты табыңыз. (π≈3.14, g=10)",
        "formula": "T = 2\\pi\\sqrt{\\frac{l}{g}}",
        "correct_answer": "1.99",
        "solution": "T = 2 × 3.14 × √(1/10) = 6.28 × 0.316 ≈ 1.99 с",
        "difficulty": "hard",
        "tags": ["тербеліс", "маятник"],
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
async def check_answer(problem_id: int, body: AnswerCheck, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")

    # Normalize answer for comparison
    user_ans = body.answer.strip().replace(",", ".").lower()
    correct = problem.correct_answer.strip().replace(",", ".").lower()

    is_correct = user_ans == correct
    return AnswerResult(
        correct=is_correct,
        message="Дұрыс жауап!" if is_correct else f"Қате. Дұрыс жауап: {problem.correct_answer}",
        solution=problem.solution if not is_correct else None,
    )
