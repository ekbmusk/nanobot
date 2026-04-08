"""/start командасы — тіл таңдау, сәлемдесу, deep link."""

from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.filters.command import CommandObject
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
from database import get_user_lang, get_result
from i18n import t, get_text
from keyboards.main_kb import (
    get_main_keyboard,
    get_start_inline,
    get_language_keyboard,
)

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject, state: FSMContext):
    """Бот іске қосылғанда /start командасы."""
    await state.clear()

    # Deep link тексеру — бөлісу
    if command.args and command.args.startswith("r_"):
        try:
            result_id = int(command.args[2:])
        except ValueError:
            result_id = None
        if result_id:
            await _show_shared_result(message, result_id, state)
            return

    # Тілді тексеру
    lang = await get_user_lang(message.from_user.id)
    if lang:
        await state.update_data(lang=lang)
        await _show_welcome(message, lang)
    else:
        # Бірінші рет — тіл таңдау
        await message.answer(
            t("choose_lang"),
            reply_markup=get_language_keyboard(),
        )


async def _show_welcome(message: Message, lang: str, name: str = None):
    """Welcome хабарламасын көрсету."""
    if name is None:
        if message.from_user:
            name = message.from_user.first_name or "👤"
        else:
            name = "👤"

    await message.answer(
        t("welcome", lang).format(name=name),
        reply_markup=get_main_keyboard(lang=lang, webapp_url=WEBAPP_URL),
    )


async def _show_shared_result(message: Message, result_id: int, state: FSMContext):
    """Бөлісілген нәтижені көрсету."""
    result = await get_result(result_id)

    # Көрушінің тілін алу
    lang = await get_user_lang(message.from_user.id)
    if not lang:
        lang = "kk"
    await state.update_data(lang=lang)

    if not result:
        await message.answer(t("no_results", lang))
        return

    # Нәтижеден бірінші мамандықты алу
    top_profs = result.get("top_professions", [])
    if top_profs:
        first_prof = top_profs[0]
        prof_name = get_text(first_prof, "name", lang) if isinstance(first_prof, dict) else str(first_prof)
    else:
        prof_name = "?"

    owner_name = result.get("first_name", "👤")

    await message.answer(
        t("share_teaser", lang).format(name=owner_name, profession=prof_name),
        reply_markup=get_start_inline(lang=lang, webapp_url=WEBAPP_URL),
    )
