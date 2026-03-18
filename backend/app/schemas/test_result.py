from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TestQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None


class TestSet(BaseModel):
    questions: List[TestQuestion]


class TestAnswerItem(BaseModel):
    question_id: int
    answer: int


class TestSubmit(BaseModel):
    telegram_id: Optional[int] = None
    answers: List[TestAnswerItem]
    is_daily: bool = False


class TestResultOut(BaseModel):
    correct: int
    total: int
    percentage: float
    passed: bool
    xp_earned: int = 0
    bonus_xp: int = 0

    model_config = {"from_attributes": True}
