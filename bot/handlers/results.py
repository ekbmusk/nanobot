"""Нәтижелер хендлері — соңғы нәтижені қайта көрсету."""

from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
from keyboards.main_kb import get_restart_inline

router = Router()


@router.message(F.text == "📊 Менің нәтижем")
async def show_last_results(message: Message, state: FSMContext):
    """Соңғы тест нәтижесін көрсету."""
    data = await state.get_data()
    last_results = data.get("last_results")

    if last_results:
        await message.answer(
            last_results,
            parse_mode="HTML",
            reply_markup=get_restart_inline(webapp_url=WEBAPP_URL),
        )
    else:
        await message.answer(
            "📭 Сен әлі тест тапсырған жоқсың.\n\n"
            "🚀 Тестті бастау үшін /start командасын жаз немесе "
            "«Тест бастау» батырмасын бас!",
            parse_mode="HTML",
        )
