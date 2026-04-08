"""«Кім боламын?» — Кәсіби бағдар Telegram боты.

Негізгі файл: ботты іске қосу, роутерлерді тіркеу, Mini App веб-серверін қосу.
"""

import asyncio
import json
import logging
import os
import sys

from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from config import BOT_TOKEN, WEBAPP_HOST, WEBAPP_PORT, WEBAPP_URL
from database import init_db
from handlers import start, survey, results, info, quest
from handlers import webapp as webapp_handler

# Логгинг баптау
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# Сұрақтарды бір рет жүктеу
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

with open(os.path.join(DATA_DIR, "questions.json"), "r", encoding="utf-8") as f:
    QUESTIONS_DATA = json.load(f)
with open(os.path.join(DATA_DIR, "professions.json"), "r", encoding="utf-8") as f:
    PROFESSIONS_DATA = json.load(f)
with open(os.path.join(DATA_DIR, "universities.json"), "r", encoding="utf-8") as f:
    UNIVERSITIES_DATA = json.load(f)


async def api_questions_handler(request):
    """GET /api/questions"""
    return web.json_response(QUESTIONS_DATA)


async def api_professions_handler(request):
    """GET /api/professions"""
    return web.json_response(PROFESSIONS_DATA)


async def api_universities_handler(request):
    """GET /api/universities"""
    return web.json_response(UNIVERSITIES_DATA)


async def api_card_handler(request):
    """POST /api/card — генерация карточки результатов (PNG)."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)

    user_name = data.get("user_name", "👤")
    top_professions = data.get("top_professions", [])
    lang = data.get("lang", "kk")

    if not top_professions:
        return web.json_response({"error": "no results"}, status=400)

    from services.card_generator import generate_result_card
    buf = generate_result_card(
        user_name=user_name,
        top_professions=top_professions,
        lang=lang,
        bot_username="propickerbot",
    )

    return web.Response(
        body=buf.getvalue(),
        content_type="image/png",
        headers={"Cache-Control": "no-cache"},
    )


async def api_quests_handler(request):
    """GET /api/quests"""
    quests_path = os.path.join(DATA_DIR, "quests.json")
    if os.path.exists(quests_path):
        with open(quests_path, "r", encoding="utf-8") as f:
            return web.json_response(json.load(f))
    return web.json_response({"quests": {}})


async def main():
    """Ботты іске қосу."""
    logger.info("🚀 «Кім боламын?» боты іске қосылуда...")

    # Дерекқорды инициализациялау
    await init_db()
    logger.info("✅ SQLite дерекқор дайын")

    # Бот пен диспетчер жасау
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=MemoryStorage())

    # Роутерлерді тіркеу (реті маңызды!)
    dp.include_router(start.router)
    dp.include_router(survey.router)
    dp.include_router(webapp_handler.router)
    dp.include_router(results.router)
    dp.include_router(quest.router)
    dp.include_router(info.router)

    logger.info("✅ Роутерлер тіркелді: start, survey, webapp, results, info")

    # Mini App веб-серверін баптау
    web_app = web.Application()
    webapp_dir = os.path.join(os.path.dirname(__file__), "webapp")
    async def index_handler(request):
        return web.FileResponse(os.path.join(webapp_dir, "index.html"))

    web_app.router.add_get("/api/questions", api_questions_handler)
    web_app.router.add_get("/api/professions", api_professions_handler)
    web_app.router.add_get("/api/universities", api_universities_handler)
    web_app.router.add_post("/api/card", api_card_handler)
    web_app.router.add_get("/api/quests", api_quests_handler)
    web_app.router.add_static("/assets/", os.path.join(webapp_dir, "assets"))
    web_app.router.add_get("/", index_handler)
    web_app.router.add_get("/{path:.*}", index_handler)

    runner = web.AppRunner(web_app)
    await runner.setup()
    site = web.TCPSite(runner, WEBAPP_HOST, WEBAPP_PORT, reuse_address=True)
    await site.start()
    logger.info(f"🌐 Mini App веб-сервер: http://{WEBAPP_HOST}:{WEBAPP_PORT}")
    if WEBAPP_URL:
        logger.info(f"🔗 Mini App URL: {WEBAPP_URL}")
    else:
        logger.warning("⚠️ WEBAPP_URL орнатылмаған — Mini App батырмасы көрсетілмейді")

    # Ботты іске қосу (long-polling)
    try:
        logger.info("🤖 Бот жұмыс істеп тұр! Тоқтату үшін: Ctrl+C")
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()
        logger.info("🛑 Бот тоқтатылды.")


if __name__ == "__main__":
    asyncio.run(main())
