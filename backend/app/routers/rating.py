from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.user import User
from app.models.test_result import TestResult

router = APIRouter()


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = Query("week"),
    telegram_id: Optional[int] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
):
    # Use naive UTC to match SQLite's timezone-unaware storage
    now = datetime.utcnow()
    if period == "week":
        since = now - timedelta(days=7)
    elif period == "month":
        since = now - timedelta(days=30)
    else:
        since = None

    query = db.query(
        User.telegram_id,
        User.first_name,
        User.last_name,
        User.username,
        User.photo_url,
        func.count(TestResult.id).label("tests_taken"),
        func.coalesce(func.sum(TestResult.percentage), 0).label("total_score"),
    ).join(TestResult, TestResult.user_id == User.id, isouter=True)

    if since:
        query = query.filter(TestResult.created_at >= since)

    # Fetch all ranked rows so we can locate the requesting user's rank
    # regardless of whether they fall inside the display limit.
    all_results = (
        query.group_by(User.id)
        .order_by(func.coalesce(func.sum(TestResult.percentage), 0).desc())
        .all()
    )

    leaderboard = []
    my_rank = None

    for i, row in enumerate(all_results):
        full_name = " ".join(filter(None, [row.first_name, row.last_name])) or (f"@{row.username}" if row.username else "Пайдаланушы")
        score = int(row.total_score)
        entry = {
            "rank": i + 1,
            "telegram_id": row.telegram_id,
            "full_name": full_name,
            "username": row.username,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "photo_url": row.photo_url,
            "tests_taken": row.tests_taken or 0,
            "score": score,
        }
        if i < limit:
            leaderboard.append(entry)
        if telegram_id and row.telegram_id == telegram_id:
            my_rank = {"rank": i + 1, "score": score}

    return {"leaderboard": leaderboard, "my_rank": my_rank}


@router.get("/rank/{telegram_id}")
async def get_my_rank(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return {"rank": None, "score": 0}
    score = user.score or 0
    # Count users with a strictly higher score to determine rank
    higher_count = db.query(func.count(User.id)).filter(User.score > score).scalar() or 0
    rank = higher_count + 1
    return {"rank": rank, "score": score}
