import asyncio
import random
import logging
import httpx
from aiogram import Bot, Router, F
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)

from config import BACKEND_URL, MINI_APP_URL

router = Router()
logger = logging.getLogger(__name__)

REMINDER_MESSAGES = [
    "🔥 {name}, streak жоғалтып алма!\n\nБүгін әлі есеп шешпедің. 1 есеп — 5 минут қана! 💪",
    "⚡ {name}! Физика сені күтіп жатыр!\n\nStreak: {streak} күн. Жоғалтпа! 🎯",
    "📚 {name}, бүгін қандай есеп шешеміз?\n\n{streak} күндік streak қауіпте! 🔥",
    "🏆 {name}, рейтингте жоғарылауға мүмкіндік бар!\n\nОқуды жалғастыр — алға! 💡",
]


def _notification_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Қазір ашу", web_app=WebAppInfo(url=MINI_APP_URL))],
            [InlineKeyboardButton(text="🔕 Хабарландыруды өшіру", callback_data="disable_notifications")],
        ]
    )


async def send_reminders(bot: Bot):
    """Fetch inactive users from backend and send them reminder messages."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{BACKEND_URL}/api/users/inactive")
            if r.status_code != 200:
                return
            users = r.json()
    except Exception as e:
        logger.warning(f"Failed to fetch inactive users: {e}")
        return

    if not users:
        return

    logger.info(f"Sending reminders to {len(users)} inactive users")

    for user in users:
        try:
            name = user.get("first_name") or "Оқушы"
            streak = user.get("streak", 0)
            text = random.choice(REMINDER_MESSAGES).format(name=name, streak=streak)

            await bot.send_message(
                chat_id=user["telegram_id"],
                text=text,
                reply_markup=_notification_keyboard(),
                parse_mode="HTML",
            )
            # Small delay to avoid hitting Telegram rate limits
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.warning(f"Failed to notify user {user.get('telegram_id')}: {e}")


async def notification_loop(bot: Bot, interval_seconds: int = 3600):
    """Background loop that checks for inactive users every `interval_seconds`."""
    logger.info(f"Notification loop started (interval: {interval_seconds}s)")
    while True:
        await asyncio.sleep(interval_seconds)
        logger.info("Checking for inactive users to notify...")
        await send_reminders(bot)


@router.callback_query(F.data == "disable_notifications")
async def disable_notifications(callback: CallbackQuery):
    telegram_id = callback.from_user.id
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.patch(
                f"{BACKEND_URL}/api/users/{telegram_id}/notifications",
                json={"enabled": False},
            )
    except Exception:
        pass

    await callback.answer("Хабарландырулар өшірілді")
    try:
        await callback.message.edit_text(
            "🔕 Хабарландырулар өшірілді.\n\n"
            "Қайта қосу үшін: /start командасын жіберіңіз.",
            parse_mode="HTML",
        )
    except Exception:
        pass
