from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.models.progress import Progress as ProgressModel
from app.schemas.progress import ProgressOut, ProgressUpdate, TopicProgress, RecentTest

router = APIRouter()

TOPIC_META = {
    "mechanics": ("Механика", "⚙️"),
    "thermodynamics": ("Термодинамика", "🌡️"),
    "electromagnetism": ("Электромагнетизм", "⚡"),
    "optics": ("Оптика", "🔭"),
    "quantum": ("Кванттық физика", "⚛️"),
    "nuclear": ("Ядролық физика", "☢️"),
}


@router.get("/{telegram_id}", response_model=ProgressOut)
async def get_user_progress(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return ProgressOut(
            tests_taken=0,
            avg_score=0.0,
            problems_solved=0,
            streak=0,
            topics=[],
            recent_tests=[],
        )
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")

    tests = db.query(TestResult).filter(TestResult.user_id == user.id).all()
    tests_taken = len(tests)
    avg_score = round(sum(t.percentage for t in tests) / tests_taken, 1) if tests_taken else 0.0

    progress_records = db.query(ProgressModel).filter(ProgressModel.user_id == user.id).all()
    progress_map = {p.topic_id: p for p in progress_records}

    topics = []
    for topic_id, (name, icon) in TOPIC_META.items():
        rec = progress_map.get(topic_id)
        topics.append(TopicProgress(
            topic_id=topic_id,
            name=name,
            icon=icon,
            percent=rec.completion_percent if rec else 0.0,
            problems_solved=rec.problems_solved if rec else 0,
        ))

    recent = (
        db.query(TestResult)
        .filter(TestResult.user_id == user.id)
        .order_by(TestResult.created_at.desc())
        .limit(5)
        .all()
    )
    recent_tests = [
        RecentTest(date=t.created_at.strftime("%d.%m"), score=t.percentage)
        for t in recent
    ]

    return ProgressOut(
        tests_taken=tests_taken,
        avg_score=avg_score,
        problems_solved=sum(t.problems_solved for t in progress_records),
        streak=user.streak or 0,
        topics=topics,
        recent_tests=recent_tests,
    )


@router.post("/update")
async def update_progress(body: ProgressUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")

    meta = TOPIC_META.get(body.topic_id)
    if not meta:
        raise HTTPException(status_code=400, detail="Белгісіз тақырып")

    record = (
        db.query(ProgressModel)
        .filter(ProgressModel.user_id == user.id, ProgressModel.topic_id == body.topic_id)
        .first()
    )

    if record:
        record.completion_percent = min(100.0, max(record.completion_percent, body.score))
        record.problems_solved += 1
        record.last_updated = datetime.now(timezone.utc)
    else:
        record = ProgressModel(
            user_id=user.id,
            topic_id=body.topic_id,
            topic_name=meta[0],
            completion_percent=body.score,
            problems_solved=1,
        )
        db.add(record)

    db.commit()
    return {"status": "updated"}
