import httpx
from html import escape
from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

from config import BACKEND_URL
from keyboards.inline_kb import open_app_button

router = Router()

MEDAL = {0: "🥇", 1: "🥈", 2: "🥉"}


def _format_user_mention(entry: dict) -> str:
    username = (entry.get("username") or "").strip().lstrip("@")
    first_name = (entry.get("first_name") or "").strip()
    last_name = (entry.get("last_name") or "").strip()
    full_label = " ".join(part for part in [first_name, last_name] if part)

    if username:
        label = full_label or f"@{username}"
        return f'<a href="https://t.me/{escape(username, quote=True)}">{escape(label)}</a>'

    telegram_id = entry.get("telegram_id")
    label = full_label or "Пайдаланушы"
    if telegram_id:
        return f'<a href="tg://user?id={telegram_id}">{escape(label)}</a>'
    return escape(label)


async def _fetch_leaderboard(telegram_id: int) -> tuple[list[dict], dict | None]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"{BACKEND_URL}/api/rating/leaderboard",
                params={"period": "all", "limit": 10, "telegram_id": telegram_id},
            )
            if r.status_code == 200:
                data = r.json()
                return data.get("leaderboard", []), data.get("my_rank")
    except Exception:
        pass
    return [], None


@router.message(Command("rating"))
@router.message(F.text == "🏆 Рейтинг")
async def show_rating(message: Message):
    telegram_id = message.from_user.id
    leaders, my_rank = await _fetch_leaderboard(telegram_id)

    if not leaders:
        await message.answer(
            "🏆 <b>Рейтинг</b>\n\nӘзірше деректер жоқ. Алғашқы болыңыз!",
            parse_mode="HTML",
            reply_markup=open_app_button(),
        )
        return

    lines = ["🏆 <b>TOP-10 Рейтинг</b>\n"]
    for i, entry in enumerate(leaders):
        medal = MEDAL.get(i, f"{i + 1}.")
        name = _format_user_mention(entry)
        score = entry.get("score", 0)
        is_me = entry.get("telegram_id") == telegram_id
        arrow = " →" if is_me else ""
        lines.append(f"{medal} {name} — {score} ⭐{arrow}")

    if my_rank:
        rank_str = f"#{my_rank['rank']}"
        score_str = my_rank.get("score", 0)
        lines.append(f"\n━━━━━━━━━━━━━")
        lines.append(f"📍 Сіздің орыныңыз: <b>{rank_str}</b> — {score_str} ⭐")

    await message.answer(
        "\n".join(lines),
        parse_mode="HTML",
        reply_markup=open_app_button(),
    )
