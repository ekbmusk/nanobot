"""Mini App-тан келген деректерді өңдеу."""

import json
import logging
import os

from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from config import WEBAPP_URL
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
    try:
        data = json.loads(message.web_app_data.data)
    except (json.JSONDecodeError, AttributeError):
        await message.answer("❌ Қате деректер. Қайта тест тапсырыңыз.")
        return

    answers = data.get("answers", [])
    timings_data = data.get("timings", [])

    if not answers:
        await message.answer("❌ Тест толық аяқталмады. Қайта тест тапсырыңыз.")
        return

    logger.info(f"📊 Mini App нәтижесі: {len(answers)} жауап, user={message.from_user.id}")

    # Server-side anti-cheat
    # Тегтерді сервер жағында реконструкциялау (қауіпсіздік)
    _reconstruct_tags(answers)

    anticheat_result = validate_answers(answers, timings_data)
    confidence = calculate_confidence(anticheat_result)

    # Салмақталған скоринг
    tag_scores = calculate_weighted_tag_scores(answers, QUESTIONS_DATA)
    matched = match_professions(tag_scores, top_n=5)

    # Нәтижені форматтау
    confidence_text = format_confidence(confidence)
    result_text = format_result_message(matched)
    full_result = f"{confidence_text}\n\n{result_text}"

    await message.answer(full_result, reply_markup=get_restart_inline(webapp_url=WEBAPP_URL))

    # Cache for /results
    await state.update_data(
        last_results=full_result,
        tag_scores={k: float(v) for k, v in tag_scores.items()},
        confidence=confidence,
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
