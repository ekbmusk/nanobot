"""Ақпараттық хендлерлер — авторлар, тіл ауыстыру."""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
from database import get_user_lang, save_user_lang
from i18n import t
from keyboards.main_kb import get_language_keyboard, get_main_keyboard

router = Router()


@router.message(F.text.in_(["👩‍🎓 Авторлар", "👩‍🎓 Авторы"]))
async def cmd_authors(message: Message, state: FSMContext):
    """Жоба авторлары."""
    lang = await _get_lang(message, state)
    await message.answer(t("authors", lang))


@router.message(Command("lang"))
async def cmd_change_language(message: Message, state: FSMContext):
    """/lang — тілді ауыстыру."""
    await message.answer(
        t("choose_lang"),
        reply_markup=get_language_keyboard(),
    )


@router.callback_query(F.data.startswith("lang_"))
async def set_language(callback: CallbackQuery, state: FSMContext):
    """Тіл таңдау callback."""
    lang = callback.data.split("_")[1]
    await save_user_lang(callback.from_user.id, lang)
    await state.update_data(lang=lang)

    await callback.message.edit_text(t("lang_set", lang))

    name = callback.from_user.first_name or "👤"
    await callback.message.answer(
        t("welcome", lang).format(name=name),
        reply_markup=get_main_keyboard(lang=lang, webapp_url=WEBAPP_URL),
    )
    await callback.answer()


async def _get_lang(message: Message, state: FSMContext) -> str:
    """Пайдаланушы тілін алу."""
    data = await state.get_data()
    lang = data.get("lang")
    if not lang:
        lang = await get_user_lang(message.from_user.id) or "kk"
        await state.update_data(lang=lang)
    return lang
