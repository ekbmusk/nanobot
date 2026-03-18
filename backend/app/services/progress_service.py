from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.models.user import User
from app.models.test_result import TestResult
from app.models.progress import Progress


def get_or_create_user(db: Session, telegram_id: int, **kwargs) -> User:
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id, **kwargs)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def update_streak(db: Session, user: User):
    now = datetime.now(timezone.utc)
    last = user.last_activity

    if last and (now - last).days == 1:
        user.streak = (user.streak or 0) + 1
    elif last and (now - last).days == 0:
        pass  # Already active today
    else:
        user.streak = 1

    user.last_activity = now
    db.commit()


def calculate_user_score(db: Session, user_id: int) -> int:
    results = db.query(TestResult).filter(TestResult.user_id == user_id).all()
    return sum(int(r.percentage) for r in results)


def get_user_stats(db: Session, user: User) -> dict:
    tests = db.query(TestResult).filter(TestResult.user_id == user.id).all()
    tests_taken = len(tests)
    avg_score = round(sum(t.percentage for t in tests) / tests_taken, 1) if tests_taken else 0

    progress = db.query(Progress).filter(Progress.user_id == user.id).all()
    problems_solved = sum(p.problems_solved for p in progress)

    return {
        "tests_taken": tests_taken,
        "avg_score": avg_score,
        "problems_solved": problems_solved,
        "streak": user.streak or 0,
        "total_score": user.score or 0,
    }
