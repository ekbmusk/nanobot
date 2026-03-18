import httpx
from datetime import datetime
from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

from config import BACKEND_URL
from keyboards.inline_kb import open_app_button

router = Router()


def _streak_bar(streak: int, days: int = 7) -> str:
    filled = min(streak, days)
    return "🟩" * filled + "⬜" * (days - filled)


def _streak_message(streak: int) -> str:
    if streak == 0:
        return "Бүгін бастаңыз! 💪"
    if streak < 3:
        return "Жақсы бастама! Жалғастырыңыз! 💪"
    if streak < 7:
        return "Үздіксіз оқып жатырсыз! 🔥"
    if streak < 30:
        return "Керемет нәтиже! Тоқтамаңыз! 🚀"
    return "Сіз — физика чемпионысыз! 🏆"


async def _fetch_streak(telegram_id: int) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{BACKEND_URL}/api/progress/{telegram_id}")
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return {}


@router.message(Command("streak"))
@router.message(F.text == "🔥 Streak")
async def show_streak(message: Message):
    data = await _fetch_streak(message.from_user.id)
    streak = data.get("streak", 0)
    bar = _streak_bar(streak)
    motivation = _streak_message(streak)
    last_test = data.get("recent_tests", [])
    last_active = last_test[0]["date"] if last_test else "—"

    text = (
        f"🔥 <b>Сіздің streak: {streak} күн!</b>\n\n"
        f"{bar}\n\n"
        f"{motivation}\n"
        f"📅 Соңғы белсенділік: <b>{last_active}</b>\n\n"
        f"⚡ Streak сақтау үшін күн сайын кем дегенде\n"
        f"   1 есеп шешіңіз немесе тест өтіңіз!"
    )

    await message.answer(
        text,
        parse_mode="HTML",
        reply_markup=open_app_button(),
    )
