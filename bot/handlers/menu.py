from aiogram import Router, F
from aiogram.types import Message

from keyboards.inline_kb import open_app_button

router = Router()


@router.message(F.text == "📊 Прогресс")
async def menu_progress(message: Message):
    await message.answer(
        "📊 <b>Прогресс</b>\n\n"
        "Физика бойынша прогрессіңізді Mini App ішінен көре аласыз!",
        parse_mode="HTML",
        reply_markup=open_app_button(),
    )


@router.message(F.text)
async def unknown_text(message: Message):
    pass
