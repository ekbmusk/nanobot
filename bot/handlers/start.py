"""/start командасы — ботпен танысу, сәлемдесу."""

from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
from keyboards.main_kb import get_main_keyboard, get_start_inline

router = Router()


WELCOME_TEXT = """
🎓 <b>«Кім боламын?» — Кәсіби бағдар боты</b>

Сәлем, <b>{name}</b>! 👋

Мен саған болашақ мамандығыңды таңдауға көмектесемін.

📋 <b>Қалай жұмыс істейді?</b>
1️⃣ Мен саған 15 сұрақ қоямын (3 блок)
2️⃣ Сенің қызығушылықтарыңды, күшті жақтарыңды және сүйікті пәндеріңді анықтаймын
3️⃣ Жауаптарыңды талдап, <b>ТОП-5 мамандық</b> ұсынамын
4️⃣ Әр мамандыққа қажет пәндер мен ҚР ЖОО-ларын көрсетемін

⏱ Тест шамамен <b>3-5 минут</b> алады.

Дайын болсаң, «Тестті бастау» батырмасын бас! 👇
"""


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """Бот іске қосылғанда /start командасы."""
    # Алдыңғы FSM күйін тазалау
    await state.clear()

    name = message.from_user.first_name or "Оқушы"
    await message.answer(
        WELCOME_TEXT.format(name=name),
        parse_mode="HTML",
        reply_markup=get_main_keyboard(webapp_url=WEBAPP_URL),
    )
