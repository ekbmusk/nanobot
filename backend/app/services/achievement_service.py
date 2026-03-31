from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.achievement import UserAchievement
from app.models.test_result import TestResult
from app.models.user import User

# Achievement definitions: code → {name_kz, description_kz, icon, color, category}
ACHIEVEMENTS = {
    # XP milestones
    "xp_100": {"name_kz": "Жаңа бастама", "description_kz": "100 XP жинау", "icon": "⭐", "color": "#FFD93D", "category": "xp"},
    "xp_500": {"name_kz": "Белсенді оқушы", "description_kz": "500 XP жинау", "icon": "🌟", "color": "#FFA63D", "category": "xp"},
    "xp_1000": {"name_kz": "Математик", "description_kz": "1000 XP жинау", "icon": "💫", "color": "#FF6584", "category": "xp"},
    "xp_5000": {"name_kz": "Шебер", "description_kz": "5000 XP жинау", "icon": "🏅", "color": "#6C63FF", "category": "xp"},
    # Streak milestones
    "streak_7": {"name_kz": "Апталық жолақ", "description_kz": "7 күн қатар оқу", "icon": "🔥", "color": "#FF6B6B", "category": "streak"},
    "streak_14": {"name_kz": "Екі аптолық жолақ", "description_kz": "14 күн қатар оқу", "icon": "🔥", "color": "#FF6584", "category": "streak"},
    "streak_30": {"name_kz": "Ай бойы!", "description_kz": "30 күн қатар оқу", "icon": "🔥", "color": "#D93DFF", "category": "streak"},
    # Test milestones
    "first_test": {"name_kz": "Бірінші тест", "description_kz": "Алғашқы тестті тапсыру", "icon": "🎯", "color": "#43E97B", "category": "test"},
    "tests_10": {"name_kz": "Тест жүлдегері", "description_kz": "10 тест тапсыру (70%+)", "icon": "📝", "color": "#43E97B", "category": "test"},
    "tests_25": {"name_kz": "Тест шебері", "description_kz": "25 тест тапсыру (70%+)", "icon": "📋", "color": "#38BDF8", "category": "test"},
    "tests_50": {"name_kz": "Тест чемпионы", "description_kz": "50 тест тапсыру (70%+)", "icon": "🏆", "color": "#6C63FF", "category": "test"},
    # Special
    "perfect_score": {"name_kz": "Мінсіз нәтиже", "description_kz": "Тестте 100% алу", "icon": "💯", "color": "#43E97B", "category": "special"},
    "all_topics": {"name_kz": "Зерттеуші", "description_kz": "Барлық 4 доменде тест тапсыру", "icon": "🧭", "color": "#FFD93D", "category": "special"},
}


def _has_achievement(db: Session, user_id: int, code: str) -> bool:
    return db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id,
        UserAchievement.achievement_code == code,
    ).first() is not None


def _award(db: Session, user_id: int, code: str, newly: list):
    if _has_achievement(db, user_id, code):
        return
    db.add(UserAchievement(
        user_id=user_id,
        achievement_code=code,
        unlocked_at=datetime.now(timezone.utc),
    ))
    meta = ACHIEVEMENTS[code]
    newly.append({"code": code, "name_kz": meta["name_kz"], "icon": meta["icon"], "color": meta["color"]})


def check_and_award(db: Session, user: User) -> list[dict]:
    """Check all achievement conditions and award any newly unlocked ones.
    Returns list of newly unlocked achievements."""
    newly = []

    # XP milestones
    score = user.score or 0
    if score >= 100:
        _award(db, user.id, "xp_100", newly)
    if score >= 500:
        _award(db, user.id, "xp_500", newly)
    if score >= 1000:
        _award(db, user.id, "xp_1000", newly)
    if score >= 5000:
        _award(db, user.id, "xp_5000", newly)

    # Streak milestones
    streak = user.streak or 0
    if streak >= 7:
        _award(db, user.id, "streak_7", newly)
    if streak >= 14:
        _award(db, user.id, "streak_14", newly)
    if streak >= 30:
        _award(db, user.id, "streak_30", newly)

    # Test milestones
    passed_tests = db.query(TestResult).filter(
        TestResult.user_id == user.id,
        TestResult.percentage >= 70,
    ).count()

    if passed_tests >= 1:
        _award(db, user.id, "first_test", newly)
    if passed_tests >= 10:
        _award(db, user.id, "tests_10", newly)
    if passed_tests >= 25:
        _award(db, user.id, "tests_25", newly)
    if passed_tests >= 50:
        _award(db, user.id, "tests_50", newly)

    # Perfect score
    perfect = db.query(TestResult).filter(
        TestResult.user_id == user.id,
        TestResult.percentage >= 100,
    ).first()
    if perfect:
        _award(db, user.id, "perfect_score", newly)

    # All topics attempted
    topics_attempted = set()
    results = db.query(TestResult).filter(TestResult.user_id == user.id).all()
    from app.models.admin_test import AdminTestQuestion
    for r in results:
        for a in (r.answers or []):
            qid = a.get("question_id")
            if qid:
                q = db.query(AdminTestQuestion).filter(AdminTestQuestion.id == qid).first()
                if q and q.topic in ("atomic_structure", "quantum_basics", "nanomaterials", "nano_applications"):
                    topics_attempted.add(q.topic)
    if len(topics_attempted) >= 4:
        _award(db, user.id, "all_topics", newly)

    if newly:
        db.flush()

    return newly


def get_user_achievements(db: Session, user_id: int) -> list[dict]:
    """Get all achievements with unlock status for a user."""
    unlocked = {
        ua.achievement_code: ua.unlocked_at
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    }

    result = []
    for code, meta in ACHIEVEMENTS.items():
        entry = {
            "code": code,
            "name_kz": meta["name_kz"],
            "description_kz": meta["description_kz"],
            "icon": meta["icon"],
            "color": meta["color"],
            "category": meta["category"],
            "unlocked": code in unlocked,
            "unlocked_at": unlocked[code].strftime("%d.%m.%Y") if code in unlocked else None,
        }
        result.append(entry)

    return result
