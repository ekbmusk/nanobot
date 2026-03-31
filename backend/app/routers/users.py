import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database.database import get_db
from app.models.admin_test import AdminTestQuestion
from app.models.chat_history import ChatHistory
from app.models.problem import Problem
from app.models.progress import Progress
from app.models.test_result import TestResult
from app.models.topic_mastery import TopicMastery
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, LevelUpdate, NotificationToggle, InactiveUserOut
from app.services.achievement_service import get_user_achievements
from app.utils.auth import get_admin_by_telegram_id

router = APIRouter()

VALID_LEVELS = {"1", "2", "3", "4", "5", "6"}

TOPIC_LABELS = {
    "atomic_structure": "Атом құрылысы",
    "quantum_basics": "Кванттық физика негіздері",
    "nanomaterials": "Наноматериалдар",
    "nano_applications": "Нанотехнология қолданыстары",
}


# ── Admin endpoints (Telegram ID auth) ──────────────────────────


@router.get("/admin/stats")
async def admin_stats(
    _admin: int = Depends(get_admin_by_telegram_id),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=7)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_problems = db.query(func.count(Problem.id)).scalar() or 0
    total_questions = db.query(func.count(AdminTestQuestion.id)).scalar() or 0
    total_tests_taken = db.query(func.count(TestResult.id)).scalar() or 0
    active_today = db.query(func.count(User.id)).filter(User.last_activity >= today_start).scalar() or 0
    active_week = db.query(func.count(User.id)).filter(User.last_activity >= week_start).scalar() or 0

    # Tests per day (last 7 days)
    tests_by_day = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(TestResult.id)).filter(
            TestResult.created_at >= day_start, TestResult.created_at < day_end
        ).scalar() or 0
        tests_by_day.append({"date": day_start.strftime("%d.%m"), "count": count})

    # Hardest questions (lowest average correct rate)
    hardest = []
    questions = db.query(AdminTestQuestion).all()
    for q in questions:
        results = db.query(TestResult).all()
        total, correct = 0, 0
        for r in results:
            if not r.answers:
                continue
            for ans in r.answers:
                if ans.get("question_id") == q.id:
                    total += 1
                    if ans.get("correct"):
                        correct += 1
        if total >= 3:
            hardest.append({
                "id": q.id,
                "question": q.question[:80],
                "total": total,
                "correct": correct,
                "rate": round(correct / total * 100),
            })
    hardest.sort(key=lambda x: x["rate"])

    return {
        "total_users": total_users,
        "total_problems": total_problems,
        "total_questions": total_questions,
        "total_tests_taken": total_tests_taken,
        "active_today": active_today,
        "active_week": active_week,
        "tests_by_day": tests_by_day,
        "hardest_questions": hardest[:5],
    }


@router.get("/admin/list")
async def admin_user_list(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    _admin: int = Depends(get_admin_by_telegram_id),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            (User.first_name.ilike(term))
            | (User.last_name.ilike(term))
            | (User.username.ilike(term))
        )
    total = q.count()
    users = q.order_by(User.last_activity.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "users": [
            {
                "id": u.id,
                "telegram_id": u.telegram_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "username": u.username,
                "score": u.score or 0,
                "streak": u.streak or 0,
                "level": u.level,
                "last_activity": u.last_activity.isoformat() if u.last_activity else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }


@router.get("/admin/{user_id}/activity")
async def admin_user_activity(
    user_id: int,
    _admin: int = Depends(get_admin_by_telegram_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")

    # General
    topics_started = db.query(func.count(TopicMastery.id)).filter(TopicMastery.user_id == user.id).scalar() or 0

    # Test history
    test_results = (
        db.query(TestResult)
        .filter(TestResult.user_id == user.id)
        .order_by(TestResult.created_at.desc())
        .limit(50)
        .all()
    )
    tests = []
    for tr in test_results:
        wrong = []
        if tr.answers:
            for ans in tr.answers:
                if not ans.get("correct"):
                    q = db.query(AdminTestQuestion).filter(AdminTestQuestion.id == ans.get("question_id")).first()
                    wrong.append(q.question[:80] if q else f"#{ans.get('question_id')}")
        tests.append({
            "id": tr.id,
            "date": tr.created_at.isoformat() if tr.created_at else None,
            "total": tr.total_questions,
            "correct": tr.correct_answers,
            "percentage": round(tr.percentage),
            "wrong_questions": wrong,
        })

    # Topic accuracy
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == user.id).all()
    topic_accuracy = [
        {
            "topic_id": m.topic_id,
            "topic_name": TOPIC_LABELS.get(m.topic_id, m.topic_id),
            "total": m.total_attempts,
            "correct": m.correct_attempts,
            "accuracy": round(m.current_accuracy),
            "level": m.estimated_level,
        }
        for m in masteries
    ]

    # Progress
    progress_records = db.query(Progress).filter(Progress.user_id == user.id).all()
    progress = [
        {
            "topic_id": p.topic_id,
            "topic_name": TOPIC_LABELS.get(p.topic_id, p.topic_id),
            "completion": round(p.completion_percent) if p.completion_percent else 0,
        }
        for p in progress_records
    ]

    # AI chat history
    chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.telegram_id == user.telegram_id)
        .order_by(ChatHistory.created_at.desc())
        .limit(20)
        .all()
    )
    ai_chat = [
        {
            "role": c.role,
            "content": c.content[:200],
            "date": c.created_at.isoformat() if c.created_at else None,
        }
        for c in reversed(chats)
    ]

    # Summary
    best_score = max((t["percentage"] for t in tests), default=0)
    worst_score = min((t["percentage"] for t in tests), default=0) if tests else 0
    ai_questions = db.query(func.count(ChatHistory.id)).filter(
        ChatHistory.telegram_id == user.telegram_id, ChatHistory.role == "user"
    ).scalar() or 0
    score_trend = [{"date": t["date"], "pct": t["percentage"]} for t in tests[:10]]

    return {
        "general": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "level": user.level,
            "score": user.score or 0,
            "streak": user.streak or 0,
            "topics_started": topics_started,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_activity": user.last_activity.isoformat() if user.last_activity else None,
        },
        "tests": tests,
        "topic_accuracy": topic_accuracy,
        "progress": progress,
        "ai_chat": ai_chat,
        "summary": {
            "best_score": best_score,
            "worst_score": worst_score,
            "ai_questions": ai_questions,
            "total_tests": len(tests),
            "score_trend": score_trend,
        },
    }


# ── Regular user endpoints ──────────────────────────────────────


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


@router.get("/{telegram_id}/achievements")
async def get_achievements(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return []
    return get_user_achievements(db, user.id)
