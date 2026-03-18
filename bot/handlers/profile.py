import asyncio
import httpx
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command

from config import BACKEND_URL
from keyboards.inline_kb import profile_keyboard

router = Router()


async def _fetch_profile(telegram_id: int) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            progress_r, rank_r = await asyncio.gather(
                client.get(f"{BACKEND_URL}/api/progress/{telegram_id}"),
                client.get(
                    f"{BACKEND_URL}/api/rating/leaderboard",
                    params={"period": "all", "telegram_id": telegram_id},
                ),
            )
            progress = progress_r.json() if progress_r.status_code == 200 else {}
            rank_data = rank_r.json() if rank_r.status_code == 200 else {}
            my_rank = rank_data.get("my_rank") or {}
            return {
                "problems_solved": progress.get("problems_solved", 0),
                "tests_taken": progress.get("tests_taken", 0),
                "streak": progress.get("streak", 0),
                "score": my_rank.get("score", 0),
                "rank": my_rank.get("rank"),
            }
    except Exception:
        return {}


def _build_profile_text(user, data: dict) -> str:
    full_name = " ".join(filter(None, [user.first_name, user.last_name])) or "Белгісіз"
    username = f"@{user.username}" if user.username else "—"
    rank_str = f"#{data['rank']}" if data.get("rank") else "—"

    return (
        f"👤 <b>Менің профилім</b>\n\n"
        f"🏅 Аты: <b>{full_name}</b>\n"
        f"🆔 Username: {username}\n\n"
        f"━━━━━━━━━━━━━\n"
        f"📊 <b>Статистика:</b>\n"
        f"✅ Шешілген есептер: <b>{data.get('problems_solved', 0)}</b>\n"
        f"🧠 Өткен тесттер: <b>{data.get('tests_taken', 0)}</b>\n"
        f"🔥 Streak: <b>{data.get('streak', 0)} күн</b>\n"
        f"⭐ Жалпы ұпай: <b>{data.get('score', 0)}</b>\n\n"
        f"━━━━━━━━━━━━━\n"
        f"🏆 Рейтингтегі орын: <b>{rank_str}</b>"
    )


@router.message(Command("profile"))
@router.message(F.text == "👤 Профиль")
async def show_profile(message: Message):
    data = await _fetch_profile(message.from_user.id)
    await message.answer(
        _build_profile_text(message.from_user, data),
        parse_mode="HTML",
        reply_markup=profile_keyboard(),
    )


@router.callback_query(F.data == "profile_refresh")
async def refresh_profile(query: CallbackQuery):
    await query.answer("Жаңартылуда...")
    data = await _fetch_profile(query.from_user.id)
    try:
        await query.message.edit_text(
            _build_profile_text(query.from_user, data),
            parse_mode="HTML",
            reply_markup=profile_keyboard(),
        )
    except Exception:
        pass
