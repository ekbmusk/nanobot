from sqlalchemy import Column, Integer, String, Text, JSON
from app.database.database import Base


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True, nullable=False)
    question = Column(Text, nullable=False)
    formula = Column(String, nullable=True)  # LaTeX formula string
    correct_answer = Column(String, nullable=False)
    solution = Column(Text, nullable=True)
    difficulty = Column(String, default="easy")  # easy / medium / hard
    tags = Column(JSON, default=list)
