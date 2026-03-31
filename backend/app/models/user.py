from sqlalchemy import BigInteger, Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    language_code = Column(String, default="kk")
    is_active = Column(Boolean, default=True)
    score = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    level = Column(String, default="1")
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    notifications_enabled = Column(Boolean, default=True)
    notification_sent_at = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_daily_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    test_results = relationship("TestResult", back_populates="user", cascade="all, delete")
    progress_records = relationship("Progress", back_populates="user", cascade="all, delete")
    topic_mastery_records = relationship("TopicMastery", back_populates="user", cascade="all, delete")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete")

    @property
    def full_name(self):
        parts = filter(None, [self.first_name, self.last_name])
        return " ".join(parts) or self.username or f"User {self.telegram_id}"
