import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, LevelUpdate, NotificationToggle, InactiveUserOut

router = APIRouter()

VALID_LEVELS = {"easy", "medium", "hard"}


async def _resolve_avatar_file_path(telegram_id: int) -> str | None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "") or os.getenv("BOT_TOKEN", "")
    if not token:
        return None

    async with httpx.AsyncClient(timeout=12.0) as client:
        photos_resp = await client.get(
            f"https://api.telegram.org/bot{token}/getUserProfilePhotos",
            params={"user_id": telegram_id, "limit": 1},
        )
        if photos_resp.status_code != 200:
            return None
        photos_data = photos_resp.json()
        if not photos_data.get("ok"):
            return None

        photos = photos_data.get("result", {}).get("photos", [])
        if not photos or not photos[0]:
            return None

        largest = photos[0][-1]
        file_id = largest.get("file_id")
        if not file_id:
            return None

        file_resp = await client.get(
            f"https://api.telegram.org/bot{token}/getFile",
            params={"file_id": file_id},
        )
        if file_resp.status_code != 200:
            return None
        file_data = file_resp.json()
        if not file_data.get("ok"):
            return None

        return file_data.get("result", {}).get("file_path")


@router.get("/{telegram_id}/avatar")
async def get_user_avatar(telegram_id: int):
    token = os.getenv("TELEGRAM_BOT_TOKEN", "") or os.getenv("BOT_TOKEN", "")
    if not token:
        raise HTTPException(status_code=404, detail="Avatar жоқ")

    file_path = await _resolve_avatar_file_path(telegram_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Avatar табылмады")

    async with httpx.AsyncClient(timeout=12.0) as client:
        file_resp = await client.get(f"https://api.telegram.org/file/bot{token}/{file_path}")
        if file_resp.status_code != 200:
            raise HTTPException(status_code=404, detail="Avatar жүктелмеді")

    content_type = file_resp.headers.get("content-type", "image/jpeg")
    return Response(content=file_resp.content, media_type=content_type)


@router.post("/register", response_model=UserOut)
async def register_user(body: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    is_new = user is None
    if is_new:
        user = User(
            telegram_id=body.telegram_id,
            username=body.username,
            photo_url=body.photo_url,
            first_name=body.first_name,
            last_name=body.last_name,
            language_code=body.language_code or "kk",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.is_banned:
            raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")
        user.username = body.username or user.username
        user.photo_url = body.photo_url or user.photo_url
        user.first_name = body.first_name or user.first_name
        user.last_name = body.last_name or user.last_name
        user.last_activity = datetime.now(timezone.utc)
        db.commit()
    out = UserOut.model_validate(user)
    out.is_new = is_new
    return out


@router.post("/level")
async def set_level(body: LevelUpdate, db: Session = Depends(get_db)):
    if body.level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Жарамсыз деңгей")
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")
    user.level = body.level
    user.last_activity = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok", "level": body.level}


@router.patch("/{telegram_id}/notifications")
async def toggle_notifications(
    telegram_id: int,
    body: NotificationToggle,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    user.notifications_enabled = body.enabled
    db.commit()
    return {"status": "ok", "notifications_enabled": body.enabled}


@router.get("/inactive", response_model=list[InactiveUserOut])
async def get_inactive_users(db: Session = Depends(get_db)):
    """
    Returns users who:
    - have not been active for 23+ hours
    - have notifications enabled
    - have not received a notification in the last 24 hours
    Marks them as notified (sets notification_sent_at) atomically.
    """
    now = datetime.now(timezone.utc)
    cutoff_active = now - timedelta(hours=23)
    cutoff_notif = now - timedelta(hours=24)

    users = (
        db.query(User)
        .filter(
            User.notifications_enabled == True,
            User.last_activity <= cutoff_active,
            (User.notification_sent_at == None) | (User.notification_sent_at <= cutoff_notif),
        )
        .all()
    )

    for u in users:
        u.notification_sent_at = now
    db.commit()

    return users
