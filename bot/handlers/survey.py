"""Сауалнама хендлері — сұрақтарды кезектеп шығару, жауаптарды жинау."""

import json
import os

from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext

from models.states import SurveyStates
from models.user_session import UserSession
from keyboards.survey_kb import get_question_keyboard
from keyboards.main_kb import get_restart_inline
from config import WEBAPP_URL
from database import save_result, get_user_lang
from i18n import t, get_text
from services.analyzer import calculate_tag_scores
from services.matcher import match_professions, format_result_message

router = Router()

# Сұрақтарды жүктеу
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
with open(os.path.join(DATA_DIR, "questions.json"), "r", encoding="utf-8") as f:
    QUESTIONS_DATA = json.load(f)

# Категориялар тізімі (ретімен)
CATEGORIES = QUESTIONS_DATA["categories"]
CATEGORY_ORDER = [cat["id"] for cat in CATEGORIES]

# Категория → FSM State картасы
CATEGORY_STATE_MAP = {
    "interests": SurveyStates.interests,
    "strengths": SurveyStates.strengths,
    "subjects": SurveyStates.subjects,
    "values": SurveyStates.values,
    "workstyle": SurveyStates.workstyle,
    "digital": SurveyStates.digital,
}


def get_category_data(category_id: str) -> dict:
    """Категория деректерін алу."""
    for cat in CATEGORIES:
        if cat["id"] == category_id:
            return cat
    return None


@router.callback_query(F.data == "start_survey")
async def start_survey(callback: CallbackQuery, state: FSMContext):
    """Сауалнаманы бастау — бірінші категорияның бірінші сұрағы."""
    # Тілді сақтау
    data = await state.get_data()
    lang = data.get("lang")
    if not lang:
        lang = await get_user_lang(callback.from_user.id) or "kk"

    await state.clear()

    # Жаңа сессия жасау
    session = UserSession.create_empty()
    session["current_category"] = CATEGORY_ORDER[0]
    session["current_question"] = 0
    session["lang"] = lang
    await state.update_data(**session)

    # Бірінші категорияны көрсету
    first_category = get_category_data(CATEGORY_ORDER[0])
    cat_name = get_text(first_category, "name", lang)
    cat_desc = get_text(first_category, "description", lang)

    await callback.message.edit_text(
        f"{first_category['emoji']} <b>{cat_name}</b>\n\n"
        f"{cat_desc}\n\n"
        f"{t('question_n', lang).format(n=1, total=len(first_category['questions']))}",
    )

    # Бірінші сұрақты қою
    question = first_category["questions"][0]
    q_text = get_text(question, "text", lang)
    await callback.message.answer(
        f"❓ <b>{q_text}</b>",
        reply_markup=get_question_keyboard(question, CATEGORY_ORDER[0], lang),
    )

    await state.set_state(CATEGORY_STATE_MAP[CATEGORY_ORDER[0]])
    await callback.answer()


@router.callback_query(F.data.startswith("answer_"))
async def process_answer(callback: CallbackQuery, state: FSMContext):
    """Жауапты өңдеу және келесі сұрақты көрсету."""
    parts = callback.data.split("_")
    category_id = parts[1]
    option_index = int(parts[2])

    data = await state.get_data()
    lang = data.get("lang", "kk")
    current_q_index = data.get("current_question", 0)
    answers = data.get("answers", [])

    category_data = get_category_data(category_id)
    if not category_data:
        await callback.answer(t("error_restart", lang))
        return

    questions = category_data["questions"]
    if current_q_index >= len(questions):
        await callback.answer(t("question_passed", lang))
        return

    current_question = questions[current_q_index]
    selected_option = current_question["options"][option_index]

    # Жауапты сақтау
    answers.append({
        "question_id": current_question["id"],
        "option_index": option_index,
        "tags": selected_option["tags"],
    })

    next_q_index = current_q_index + 1

    if next_q_index < len(questions):
        # Келесі сұрақ
        next_question = questions[next_q_index]
        await state.update_data(answers=answers, current_question=next_q_index)

        cat_name = get_text(category_data, "name", lang)
        q_text = get_text(next_question, "text", lang)

        await callback.message.edit_text(
            f"{category_data['emoji']} <b>{cat_name}</b>\n\n"
            f"{t('question_n', lang).format(n=next_q_index + 1, total=len(questions))}\n\n"
            f"❓ <b>{q_text}</b>",
            reply_markup=get_question_keyboard(next_question, category_id, lang),
        )
        await callback.answer()
    else:
        # Категория аяқталды — келесі категорияға көшу
        current_cat_index = CATEGORY_ORDER.index(category_id)

        if current_cat_index + 1 < len(CATEGORY_ORDER):
            # Келесі категория бар
            next_cat_id = CATEGORY_ORDER[current_cat_index + 1]
            next_category = get_category_data(next_cat_id)
            next_questions = next_category["questions"]

            await state.update_data(
                answers=answers,
                current_question=0,
                current_category=next_cat_id,
            )
            await state.set_state(CATEGORY_STATE_MAP[next_cat_id])

            # Прогресс
            completed = current_cat_index + 1
            total = len(CATEGORY_ORDER)
            progress_bar = "🟢" * completed + "⚪" * (total - completed)

            cat_name_done = get_text(category_data, "name", lang)
            next_name = get_text(next_category, "name", lang)
            next_desc = get_text(next_category, "description", lang)

            await callback.message.edit_text(
                f"{t('block_done', lang).format(name=cat_name_done)}\n\n"
                f"Прогресс: {progress_bar} ({completed}/{total})\n\n"
                f"{t('next_block', lang).format(emoji=next_category['emoji'], name=next_name, desc=next_desc)}",
            )

            # Бірінші сұрақ
            first_q = next_questions[0]
            q_text = get_text(first_q, "text", lang)
            await callback.message.answer(
                f"{t('question_n', lang).format(n=1, total=len(next_questions))}\n\n"
                f"❓ <b>{q_text}</b>",
                reply_markup=get_question_keyboard(first_q, next_cat_id, lang),
            )
            await callback.answer()
        else:
            # Барлық категориялар аяқталды — нәтижені көрсету
            await state.update_data(answers=answers)
            await state.set_state(SurveyStates.results)

            total_cats = len(CATEGORY_ORDER)
            done_bar = "🟢" * total_cats
            await callback.message.edit_text(
                f"{done_bar} Прогресс: {total_cats}/{total_cats}\n\n"
                f"{t('all_done', lang)}",
            )

            # Талдау жасау
            all_tags = UserSession.get_all_tags({"answers": answers})
            tag_scores = calculate_tag_scores(all_tags)
            matched = match_professions(tag_scores, top_n=5)

            # Нәтижені форматтау
            result_text = format_result_message(matched, lang=lang)

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
                user_id=callback.from_user.id,
                first_name=callback.from_user.first_name or "👤",
                top_professions=top_profs,
                tag_scores=dict(tag_scores),
                lang=lang,
            )

            # Бөлісу сілтемесі
            bot_info = await callback.bot.get_me()
            share_url = f"https://t.me/{bot_info.username}?start=r_{result_id}"

            await callback.message.answer(
                result_text,
                reply_markup=get_restart_inline(
                    lang=lang, webapp_url=WEBAPP_URL, share_url=share_url,
                ),
            )

            # Карточка результатов (PNG)
            from services.card_generator import generate_result_card
            from aiogram.types import BufferedInputFile
            card_buf = generate_result_card(
                user_name=callback.from_user.first_name or "👤",
                top_professions=matched,
                lang=lang,
                bot_username=bot_info.username,
            )
            await callback.message.answer_photo(
                photo=BufferedInputFile(card_buf.read(), filename="result.png"),
            )

            # Мини-квесттер ұсыну
            from handlers.quest import get_available_quest_ids
            from keyboards.quest_kb import get_quest_selection_keyboard
            quest_kb = get_quest_selection_keyboard(
                matched, lang, available_ids=get_available_quest_ids(),
            )
            if quest_kb:
                await callback.message.answer(
                    t("quest_invite", lang),
                    reply_markup=quest_kb,
                )

            # State-те сақтау (кейін /results үшін)
            await state.update_data(
                last_results=result_text,
                tag_scores=dict(tag_scores),
                last_share_url=share_url,
                last_top_professions=[
                    {"id": m["profession"]["id"],
                     "name": m["profession"]["name"],
                     "name_ru": m["profession"].get("name_ru", ""),
                     "emoji": m["profession"]["emoji"],
                     "score": m["score"],
                     "demand": m["profession"].get("demand", ""),
                     "salary_range": m["profession"].get("salary_range", "")}
                    for m in matched
                ],
            )
            await callback.answer(t("results_ready", lang))
