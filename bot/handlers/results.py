"""Нәтижелер хендлері — соңғы нәтижені қайта көрсету + карточка."""

from aiogram import Router, F
from aiogram.types import CallbackQuery, BufferedInputFile
from aiogram.fsm.context import FSMContext

from database import get_user_lang, get_user_results

router = Router()


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
