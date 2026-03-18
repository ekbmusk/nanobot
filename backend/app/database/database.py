from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./physics_bot.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from app.models import user, problem, test_result, progress as prog  # noqa
    from app.models import admin_user, admin_test, theory_content, broadcast_log, chat_history  # noqa
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite()
    _seed_admin_user()
    _seed_admin_tests()
    _seed_theory_content()


def _migrate_sqlite():
    """Add missing columns to existing SQLite tables without dropping data."""
    if "sqlite" not in DATABASE_URL:
        return

    migrations = [
        ("users", "level",                  "VARCHAR DEFAULT 'medium'"),
        ("users", "is_admin",               "BOOLEAN DEFAULT 0"),
        ("users", "is_banned",              "BOOLEAN DEFAULT 0"),
        ("users", "notifications_enabled",  "BOOLEAN DEFAULT 1"),
        ("users", "notification_sent_at",   "DATETIME"),
        ("users", "photo_url",              "VARCHAR"),
        ("users", "last_daily_date",        "VARCHAR"),
    ]

    with engine.connect() as conn:
        for table, column, col_def in migrations:
            try:
                conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"
                    )
                )
                conn.commit()
            except Exception:
                # Column already exists — safe to ignore
                pass


def _seed_admin_user():
    from app.models.admin_user import AdminUser
    from app.utils.auth import hash_password

    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    if not username or not password:
        return

    with SessionLocal() as db:
        existing = db.query(AdminUser).filter(AdminUser.username == username).first()
        if existing:
            existing.password_hash = hash_password(password)
            existing.is_active = True
            db.commit()
            return
        admin = AdminUser(username=username, password_hash=hash_password(password), is_active=True)
        db.add(admin)
        db.commit()


def _seed_theory_content():
    from app.models.theory_content import TheoryContent

    seeds = [
        {"topic_id": "mechanics", "title": "Механика"},
        {"topic_id": "thermodynamics", "title": "Термодинамика"},
        {"topic_id": "electromagnetism", "title": "Электромагнетизм"},
        {"topic_id": "optics", "title": "Оптика"},
        {"topic_id": "quantum", "title": "Кванттық физика"},
        {"topic_id": "nuclear", "title": "Ядролық физика"},
    ]

    with SessionLocal() as db:
        existing_count = db.query(TheoryContent).count()
        if existing_count > 0:
            return
        for topic in seeds:
            db.add(TheoryContent(topic_id=topic["topic_id"], title=topic["title"], blocks=[]))
        db.commit()


def _seed_admin_tests():
    from app.models.admin_test import AdminTestQuestion
    from app.routers.tests import TEST_BANK

    with SessionLocal() as db:
        existing_count = db.query(AdminTestQuestion).count()
        if existing_count > 0:
            return

        for item in TEST_BANK:
            options = item.get("options", [])
            if len(options) != 4:
                continue

            correct_idx = int(item.get("correct_answer", 0))
            if correct_idx < 0 or correct_idx > 3:
                correct_idx = 0

            db.add(
                AdminTestQuestion(
                    topic="Жалпы физика",
                    question=item.get("question", ""),
                    option_a=options[0],
                    option_b=options[1],
                    option_c=options[2],
                    option_d=options[3],
                    correct_option=["A", "B", "C", "D"][correct_idx],
                    explanation=item.get("explanation"),
                )
            )

        db.commit()
