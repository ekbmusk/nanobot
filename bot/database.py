"""SQLite база — нәтижелерді және тіл таңдауын сақтау."""

import aiosqlite
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "bot.db")


async def init_db():
    """Кестелерді құру (бот іске қосылғанда шақырылады)."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                lang TEXT,
                first_name TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                first_name TEXT,
                top_professions TEXT,
                tag_scores TEXT,
                confidence INTEGER,
                lang TEXT DEFAULT 'kk',
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.commit()


async def save_result(user_id: int, first_name: str, top_professions: list,
                      tag_scores: dict, confidence: int | None = None,
                      lang: str = "kk") -> int:
    """Тест нәтижесін сақтау. result_id қайтарады."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO results
               (user_id, first_name, top_professions, tag_scores, confidence, lang)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, first_name,
             json.dumps(top_professions, ensure_ascii=False),
             json.dumps(tag_scores, ensure_ascii=False),
             confidence, lang),
        )
        result_id = cursor.lastrowid
        await db.commit()
        return result_id


async def get_result(result_id: int) -> dict | None:
    """Нәтижені ID бойынша алу."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM results WHERE id = ?", (result_id,))
        row = await cursor.fetchone()
        if row:
            r = dict(row)
            r["top_professions"] = json.loads(r["top_professions"])
            r["tag_scores"] = json.loads(r["tag_scores"])
            return r
        return None


async def get_user_results(user_id: int, limit: int = 10) -> list:
    """Пайдаланушының соңғы нәтижелерін алу."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        )
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            r = dict(row)
            r["top_professions"] = json.loads(r["top_professions"])
            r["tag_scores"] = json.loads(r["tag_scores"])
            results.append(r)
        return results


async def save_user_lang(user_id: int, lang: str):
    """Пайдаланушының тілін сақтау/жаңарту."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO users (user_id, lang) VALUES (?, ?)
               ON CONFLICT(user_id) DO UPDATE SET lang = ?""",
            (user_id, lang, lang),
        )
        await db.commit()


async def get_user_lang(user_id: int) -> str | None:
    """Пайдаланушының тілін алу. None — әлі таңдалмаған."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT lang FROM users WHERE user_id = ?", (user_id,)
        )
        row = await cursor.fetchone()
        if row and row[0]:
            return row[0]
        return None
