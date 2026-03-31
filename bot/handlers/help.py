from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

router = Router()

HELP_TEXT = (
    "⚛️ <b>Физика Нанотехнология Боты — Нұсқаулық</b>\n"
    "━━━━━━━━━━━━━━━━━\n\n"
    "<b>📱 Командалар:</b>\n"
    "/start   — Басты бетті ашу\n"
    "/app     — Mini App ашу\n"
    "/profile — Профильді көру\n"
    "/rating  — Рейтинг TOP-10\n"
    "/streak  — Streak статистикасы\n"
    "/help    — Осы нұсқаулық\n\n"
    "<b>📘 Нанотехнология тақырыптары:</b>\n"
    "⚛️ Атом құрылысы\n"
    "〰️ Кванттық физика негіздері\n"
    "🔬 Наноматериалдар\n"
    "💡 Нанотехнология қолданыстары\n\n"
    "<b>🎮 Мүмкіндіктер:</b>\n"
    "• Теория — нанотехнология тақырыптары\n"
    "• Есептер — 6 деңгей\n"
    "• Тесттер — 10 сұрақ, 20 сек таймер\n"
    "• AI репетитор — қазақша жауап\n"
    "• Рейтинг — апта/ай/жалпы\n"
    "• Streak — күнделікті оқу жолағы\n\n"
    "<b>📩 Байланыс:</b> @callmebekaa"
)


@router.message(Command("help"))
@router.message(F.text == "❓ Көмек")
async def show_help(message: Message):
    await message.answer(HELP_TEXT, parse_mode="HTML")
