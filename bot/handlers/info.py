"""Ақпараттық хендлерлер — /help, бот туралы."""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message

router = Router()


HELP_TEXT = """
❓ <b>Көмек — «Кім боламын?» боты</b>

📋 <b>Командалар:</b>
/start — Ботты іске қосу, тестті бастау
/help — Осы көмек хабарламасы

🔘 <b>Батырмалар:</b>
🚀 Тест бастау — Жаңа тест тапсыру
📊 Менің нәтижем — Соңғы нәтижені қайта көру
ℹ️ Бот туралы — Бот ақпараты
❓ Көмек — Көмек

📝 <b>Тест қалай жұмыс істейді?</b>
• 15 сұрақ, 3 блок (қызығушылық, күшті жақтар, пәндер)
• Әр сұраққа 5 жауап нұсқасы бар
• Жауаптарыңды талдап, ТОП-5 мамандық ұсынамын
• Тестті қанша рет болса сонша тапсыра аласың

🤖 <b>Байланыс:</b> @callmebekaa
"""


ABOUT_TEXT = """
ℹ️ <b>«Кім боламын?» — Кәсіби бағдар боты</b>

🎯 <b>Мақсаты:</b>
7-8 сынып оқушыларына болашақ мамандық таңдауға көмектесу.

📊 <b>Не істейді:</b>
• Қызығушылықтарыңды анықтайды
• Күшті жақтарыңды бағалайды
• Сүйікті пәндеріңді ескереді
• ТОП-5 мамандық ұсынады
• Қажет ҰБТ пәндерін көрсетеді
• ҚР ЖОО-ларын ұсынады

🇰🇿 <b>Қазақстан еңбек нарығына негізделген</b>
25+ мамандық, 17 ЖОО базасында жұмыс істейді.

⚙️ <b>Технология:</b> Python + aiogram + JSON

👨‍💻 <b>Автор:</b> @callmebekaa
"""


@router.message(Command("help"))
@router.message(F.text == "❓ Көмек")
async def cmd_help(message: Message):
    """Көмек хабарламасын көрсету."""
    await message.answer(HELP_TEXT, parse_mode="HTML")


@router.message(F.text == "ℹ️ Бот туралы")
async def cmd_about(message: Message):
    """Бот туралы ақпарат."""
    await message.answer(ABOUT_TEXT, parse_mode="HTML")


@router.message(F.text == "🚀 Тест бастау")
async def cmd_test_button(message: Message):
    """Reply клавиатурадағы 'Тест бастау' батырмасы."""
    from config import WEBAPP_URL
    from keyboards.main_kb import get_start_inline

    await message.answer(
        "👇 Тестті бастау үшін батырманы бас:",
        reply_markup=get_start_inline(webapp_url=WEBAPP_URL),
    )
