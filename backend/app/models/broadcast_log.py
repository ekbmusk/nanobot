from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database.database import Base


class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"

    id = Column(Integer, primary_key=True, index=True)
    audience = Column(String, nullable=False)
    audience_level = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    total_targets = Column(Integer, default=0)
    delivered = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
