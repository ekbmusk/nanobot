"""Mini App-тан келген деректерді өңдеу."""

import json
import logging
import os

from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
from database import save_result, get_user_lang
from i18n import t
from services.analyzer import calculate_weighted_tag_scores
from services.matcher import match_professions, format_result_message
from services.anticheat import validate_answers, calculate_confidence, format_confidence
from keyboards.main_kb import get_restart_inline

logger = logging.getLogger(__name__)
router = Router()

# Сұрақтарды жүктеу (тегтерді реконструкциялау үшін)
QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "questions.json")
with open(QUESTIONS_PATH, "r", encoding="utf-8") as f:
    QUESTIONS_DATA = json.load(f)


@router.message(F.web_app_data)
async def handle_webapp_data(message: Message, state: FSMContext):
    """Mini App-тан келген тест нәтижелерін өңдеу."""
    data_raw = await state.get_data()
    lang = data_raw.get("lang")
    if not lang:
        lang = await get_user_lang(message.from_user.id) or "kk"

    try:
        data = json.loads(message.web_app_data.data)
    except (json.JSONDecodeError, AttributeError):
        await message.answer(t("webapp_error", lang))
        return

    answers = data.get("answers", [])
    timings_data = data.get("timings", [])

    if not answers:
        await message.answer(t("webapp_incomplete", lang))
        return

    logger.info(f"Mini App: {len(answers)} answers, user={message.from_user.id}")

    # Server-side: тегтерді реконструкциялау
    _reconstruct_tags(answers)

    anticheat_result = validate_answers(answers, timings_data)
    confidence = calculate_confidence(anticheat_result)

    # Салмақталған скоринг
    tag_scores = calculate_weighted_tag_scores(answers, QUESTIONS_DATA)
    matched = match_professions(tag_scores, top_n=5)

    # Нәтижені форматтау
    confidence_text = format_confidence(confidence)
    result_text = format_result_message(matched, lang=lang)
    full_result = f"{confidence_text}\n\n{result_text}"

    # DB-ға сақтау
    top_profs = [
        {"id": m["profession"]["id"],
         "name": m["profession"]["name"],
         "name_ru": m["profession"].get("name_ru", ""),
         "emoji": m["profession"]["emoji"],
         "score": m["score"]}
        for m in matched
    ]
    result_id = await save_result(
        user_id=message.from_user.id,
        first_name=message.from_user.first_name or "👤",
        top_professions=top_profs,
        tag_scores={k: float(v) for k, v in tag_scores.items()},
        confidence=confidence,
        lang=lang,
    )

    # Бөлісу сілтемесі
    bot_info = await message.bot.get_me()
    share_url = f"https://t.me/{bot_info.username}?start=r_{result_id}"

    await message.answer(
        full_result,
        reply_markup=get_restart_inline(lang=lang, webapp_url=WEBAPP_URL, share_url=share_url),
    )

    # Карточка результатов (PNG)
    from services.card_generator import generate_result_card
    from aiogram.types import BufferedInputFile
    card_buf = generate_result_card(
        user_name=message.from_user.first_name or "👤",
        top_professions=matched,
        lang=lang,
        bot_username=bot_info.username,
    )
    await message.answer_photo(
        photo=BufferedInputFile(card_buf.read(), filename="result.png"),
    )

    # Мини-квесттер ұсыну
    from handlers.quest import get_available_quest_ids
    from keyboards.quest_kb import get_quest_selection_keyboard
    quest_kb = get_quest_selection_keyboard(
        matched, lang, available_ids=get_available_quest_ids(),
    )
    if quest_kb:
        await message.answer(
            t("quest_invite", lang),
            reply_markup=quest_kb,
        )

    # Cache for /results
    await state.update_data(
        last_results=full_result,
        tag_scores={k: float(v) for k, v in tag_scores.items()},
        confidence=confidence,
        last_share_url=share_url,
        lang=lang,
    )


def _reconstruct_tags(answers: list):
    """Тегтерді questions.json-нан реконструкциялау (клиент деректеріне сенбеу)."""
    question_map = {}
    for category in QUESTIONS_DATA["categories"]:
        for question in category["questions"]:
            question_map[question["id"]] = question

    for answer in answers:
        qid = answer.get("question_id", "")
        option_index = answer.get("option_index", 0)
        question = question_map.get(qid)
        if question and 0 <= option_index < len(question["options"]):
            answer["tags"] = question["options"][option_index].get("tags", [])
        else:
            answer["tags"] = []
