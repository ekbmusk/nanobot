import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import BotCommand, BotCommandScopeDefault

from config import BOT_TOKEN
from handlers import start, profile, rating, streak, help, menu, notifications

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BOT_COMMANDS = [
    BotCommand(command="start",   description="⚛️ Басты бет"),
    BotCommand(command="app",     description="🔬 Қосымшаны ашу"),
    BotCommand(command="profile", description="👤 Менің профилім"),
    BotCommand(command="rating",  description="🏆 Рейтинг TOP-10"),
    BotCommand(command="streak",  description="🔥 Менің streak"),
    BotCommand(command="help",    description="❓ Көмек"),
]


async def main():
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN орнатылмаған! .env файлын тексеріңіз.")
        return

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    dp.include_router(start.router)
    dp.include_router(profile.router)
    dp.include_router(rating.router)
    dp.include_router(streak.router)
    dp.include_router(help.router)
    dp.include_router(notifications.router)
    dp.include_router(menu.router)

    await bot.set_my_commands(BOT_COMMANDS, scope=BotCommandScopeDefault())
    logger.info("Бот командалары орнатылды.")

    # Start push-notification background loop
    notif_task = asyncio.create_task(
        notifications.notification_loop(bot, interval_seconds=3600)
    )
    logger.info("Хабарландыру тексерушісі іске қосылды (сағатына 1 рет).")

    try:
        logger.info("Бот іске қосылды...")
        await dp.start_polling(bot, skip_updates=True)
    finally:
        notif_task.cancel()
        try:
            await notif_task
        except asyncio.CancelledError:
            pass
        logger.info("Хабарландыру тексерушісі тоқтатылды.")


if __name__ == "__main__":
    asyncio.run(main())
