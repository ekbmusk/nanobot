from pydantic import BaseModel
from typing import Optional, List


class ProblemOut(BaseModel):
    id: int
    topic: str
    question: str
    formula: Optional[str] = None
    difficulty: str
    tags: List[str] = []

    model_config = {"from_attributes": True}


class ProblemDetail(ProblemOut):
    correct_answer: str
    solution: Optional[str] = None


class AnswerCheck(BaseModel):
    answer: str


class AnswerResult(BaseModel):
    correct: bool
    message: str
    solution: Optional[str] = None
