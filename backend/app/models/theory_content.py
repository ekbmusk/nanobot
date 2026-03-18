from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, JSON, String

from app.database.database import Base


class TheoryContent(Base):
    __tablename__ = "theory_contents"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    blocks = Column(JSON, default=list)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
