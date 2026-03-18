from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

router = Router()

HELP_TEXT = (
    "❓ <b>Көмек / Нұсқаулық</b>\n\n"
    "<b>Командалар:</b>\n"
    "/start   — Басты бетті ашу\n"
    "/app     — Қосымшаны ашу\n"
    "/profile — Профильді көру\n"
    "/rating  — Рейтингті көру\n"
    "/streak  — Streak статистикасы\n"
    "/help    — Осы нұсқаулық\n\n"
    "<b>Қосымша мүмкіндіктер:</b>\n"
    "🤖 AI репетиторға сұрақ қоюға болады\n"
    "📱 Барлық функциялар қосымшада бар\n\n"
    "<b>Байланыс:</b>\n"
    "📩 Мәселе болса: @callmebekaa"
)


@router.message(Command("help"))
@router.message(F.text == "❓ Көмек")
async def show_help(message: Message):
    await message.answer(HELP_TEXT, parse_mode="HTML")
