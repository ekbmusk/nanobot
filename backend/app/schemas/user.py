from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    photo_url: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = "kk"


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str]
    photo_url: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    score: int
    streak: int
    level: str = "medium"
    notifications_enabled: bool = True
    created_at: datetime
    is_new: bool = False

    model_config = {"from_attributes": True}


class LevelUpdate(BaseModel):
    telegram_id: int
    level: str  # easy | medium | hard


class NotificationToggle(BaseModel):
    enabled: bool


class InactiveUserOut(BaseModel):
    telegram_id: int
    first_name: Optional[str]
    streak: int
    score: int

    model_config = {"from_attributes": True}
