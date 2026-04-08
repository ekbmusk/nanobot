"""Нәтижелер хендлері — соңғы нәтижені қайта көрсету + карточка."""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, BufferedInputFile
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
from database import get_user_lang, get_user_results
from i18n import t
from keyboards.main_kb import get_restart_inline

router = Router()


@router.message(F.text.in_(["📊 Менің нәтижем", "📊 Мой результат"]))
async def show_last_results(message: Message, state: FSMContext):
    """Соңғы тест нәтижесін көрсету."""
    data = await state.get_data()
    lang = data.get("lang")
    if not lang:
        lang = await get_user_lang(message.from_user.id) or "kk"

    last_results = data.get("last_results")
    share_url = data.get("last_share_url", "")

    if last_results:
        await message.answer(
            last_results,
            reply_markup=get_restart_inline(
                lang=lang, webapp_url=WEBAPP_URL, share_url=share_url,
            ),
        )
    else:
        await message.answer(t("no_results", lang))


@router.callback_query(F.data == "get_card")
async def send_card_image(callback: CallbackQuery, state: FSMContext):
    """📸 Карточка батырмасы — нәтиже карточкасын жіберу."""
    data = await state.get_data()
    lang = data.get("lang")
    if not lang:
        lang = await get_user_lang(callback.from_user.id) or "kk"

    # State-тен немесе DB-дан top_professions алу
    top_profs = data.get("last_top_professions")

    if not top_profs:
        # DB-дан соңғы нәтижені алу
        results = await get_user_results(callback.from_user.id, limit=1)
        if results:
            top_profs = results[0].get("top_professions", [])

    if not top_profs:
        msg = "📭 Алдымен тест тапсырыңыз!" if lang == "kk" else "📭 Сначала пройдите тест!"
        await callback.answer(msg, show_alert=True)
        return

    from services.card_generator import generate_result_card
    bot_info = await callback.bot.get_me()

    card_buf = generate_result_card(
        user_name=callback.from_user.first_name or "👤",
        top_professions=top_profs,
        lang=lang,
        bot_username=bot_info.username,
    )

    await callback.message.answer_photo(
        photo=BufferedInputFile(card_buf.read(), filename="result.png"),
        caption="📸 " + (
            "Карточканы сақтап, достарыңмен бөліс!"
            if lang == "kk" else
            "Сохрани карточку и поделись с друзьями!"
        ),
    )
    await callback.answer()
