from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.services.gemini_service import get_ai_answer
from app.database.database import get_db
from app.models.chat_history import ChatHistory
from app.models.user import User
from app.models.test_result import TestResult
from app.models.progress import Progress

router = APIRouter()

HISTORY_LIMIT = 20  # messages stored per user
CONTEXT_MESSAGES = 6  # messages sent to AI


def _build_student_context(telegram_id: int, db: Session) -> str:
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return ""

    lines = []
    if user.first_name:
        lines.append(f"Студенттің аты: {user.first_name}")

    # Last 5 test results
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == user.id)
        .order_by(TestResult.created_at.desc())
        .limit(5)
        .all()
    )
    if results:
        test_lines = []
        for r in results:
            status = "өтті ✓" if r.percentage >= 70 else "өтпеді ✗"
            test_lines.append(f"  - {r.correct_answers}/{r.total_questions} дұрыс ({r.percentage}%) — {status}")
        lines.append("Соңғы тест нәтижелері:\n" + "\n".join(test_lines))

    # Topic progress
    progress_records = (
        db.query(Progress)
        .filter(Progress.user_id == user.id)
        .order_by(Progress.completion_percent.desc())
        .all()
    )
    if progress_records:
        prog_lines = [f"  - {p.topic_name}: {p.completion_percent}%" for p in progress_records]
        lines.append("Тақырыптар бойынша прогресс:\n" + "\n".join(prog_lines))

    if not lines:
        return ""

    return (
        "--- Студент туралы мәліметтер ---\n"
        + "\n".join(lines)
        + "\n--- Жоғарыдағы деректерді ескеріп, студентке жекелендірілген жауап бер. "
        "Егер студент нашар нәтиже көрсеткен тақырыпты сұраса, ерекше мұқият түсіндір. ---"
    )


class AskRequest(BaseModel):
    question: str
    telegram_id: Optional[int] = None


class HintRequest(BaseModel):
    problem_id: int
    telegram_id: Optional[int] = None


JAILBREAK_KEYWORDS = [
    "ignore previous", "forget your", "forget all", "новые инструкции",
    "ты теперь", "притворись", "roleplay", "jailbreak", "dan mode",
    "developer mode", "ignore instructions", "system prompt",
    "ережені ұмыт", "нұсқауды ұмыт", "жаңа рөл", "барлық ережені",
    "act as", "pretend you are", "you are now", "disregard",
]

def _is_jailbreak(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in JAILBREAK_KEYWORDS)


@router.post("/ask")
async def ask_question(body: AskRequest, db: Session = Depends(get_db)):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Сұрақ бос болмауы керек")

    if _is_jailbreak(body.question):
        return {"answer": "Мен тек физика сұрақтарына жауап беремін. Физика тақырыбына сұрақ қой — мен көмектесемін! ⚛️"}

    history = []
    student_context = None
    if body.telegram_id:
        rows = (
            db.query(ChatHistory)
            .filter(ChatHistory.telegram_id == body.telegram_id)
            .order_by(ChatHistory.id.desc())
            .limit(CONTEXT_MESSAGES)
            .all()
        )
        history = [{"role": r.role, "content": r.content} for r in reversed(rows)]
        student_context = _build_student_context(body.telegram_id, db)

    answer = await get_ai_answer(question=body.question, history=history, student_context=student_context)

    if body.telegram_id:
        db.add(ChatHistory(telegram_id=body.telegram_id, role="user", content=body.question))
        db.add(ChatHistory(telegram_id=body.telegram_id, role="assistant", content=answer))
        db.commit()

        # Keep only the last HISTORY_LIMIT messages per user
        all_ids = (
            db.query(ChatHistory.id)
            .filter(ChatHistory.telegram_id == body.telegram_id)
            .order_by(ChatHistory.id.desc())
            .all()
        )
        if len(all_ids) > HISTORY_LIMIT:
            old_ids = [r.id for r in all_ids[HISTORY_LIMIT:]]
            db.query(ChatHistory).filter(ChatHistory.id.in_(old_ids)).delete(synchronize_session=False)
            db.commit()

    return {"answer": answer}


@router.get("/history/{telegram_id}")
def get_history(telegram_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.telegram_id == telegram_id)
        .order_by(ChatHistory.id.asc())
        .all()
    )
    return [{"role": r.role, "content": r.content, "created_at": r.created_at} for r in rows]


@router.delete("/history/{telegram_id}")
def clear_history(telegram_id: int, db: Session = Depends(get_db)):
    db.query(ChatHistory).filter(ChatHistory.telegram_id == telegram_id).delete()
    db.commit()
    return {"ok": True}


@router.post("/hint")
async def get_hint(body: HintRequest):
    hint_question = f"Есеп #{body.problem_id} бойынша кішкентай кеңес бер, бірақ жауапты тікелей айтпа."
    answer = await get_ai_answer(question=hint_question)
    return {"hint": answer}
