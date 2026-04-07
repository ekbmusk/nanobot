"""Сауалнама хендлері — сұрақтарды кезектеп шығару, жауаптарды жинау."""

import json
import os

from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext

from models.states import SurveyStates
from models.user_session import UserSession
from keyboards.survey_kb import get_question_keyboard
from config import WEBAPP_URL
from keyboards.main_kb import get_restart_inline
from services.analyzer import calculate_tag_scores
from services.matcher import match_professions, format_result_message

router = Router()

# Сұрақтарды жүктеу
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
with open(os.path.join(DATA_DIR, "questions.json"), "r", encoding="utf-8") as f:
    QUESTIONS_DATA = json.load(f)

# Категориялар тізімі (ретімен)
CATEGORIES = QUESTIONS_DATA["categories"]
CATEGORY_ORDER = [cat["id"] for cat in CATEGORIES]  # ["interests", "strengths", "subjects"]

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
    await state.clear()

    # Жаңа сессия жасау
    session = UserSession.create_empty()
    session["current_category"] = CATEGORY_ORDER[0]
    session["current_question"] = 0
    await state.update_data(**session)

    # Бірінші категорияны көрсету
    first_category = get_category_data(CATEGORY_ORDER[0])
    await callback.message.edit_text(
        f"{first_category['emoji']} <b>{first_category['name']}</b>\n\n"
        f"{first_category['description']}\n\n"
        f"📝 Сұрақ 1/{len(first_category['questions'])}:",
        parse_mode="HTML",
    )

    # Бірінші сұрақты қою
    question = first_category["questions"][0]
    await callback.message.answer(
        f"❓ <b>{question['text']}</b>",
        parse_mode="HTML",
        reply_markup=get_question_keyboard(question, CATEGORY_ORDER[0]),
    )

    await state.set_state(CATEGORY_STATE_MAP[CATEGORY_ORDER[0]])
    await callback.answer()


@router.callback_query(F.data.startswith("answer_"))
async def process_answer(callback: CallbackQuery, state: FSMContext):
    """Жауапты өңдеу және келесі сұрақты көрсету."""
    # callback_data форматы: answer_{category_id}_{option_index}
    parts = callback.data.split("_")
    category_id = parts[1]
    option_index = int(parts[2])

    # Ағымдағы деректерді алу
    data = await state.get_data()
    current_q_index = data.get("current_question", 0)
    answers = data.get("answers", [])

    # Категория мен сұрақты табу
    category_data = get_category_data(category_id)
    if not category_data:
        await callback.answer("❌ Қате! Қайта бастаңыз: /start")
        return

    questions = category_data["questions"]
    if current_q_index >= len(questions):
        await callback.answer("Бұл сұрақ аяқталған!")
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

    # Категория ішіндегі сұрақтар бітті ме?
    if next_q_index < len(questions):
        # Келесі сұрақ
        next_question = questions[next_q_index]
        await state.update_data(answers=answers, current_question=next_q_index)

        await callback.message.edit_text(
            f"{category_data['emoji']} <b>{category_data['name']}</b>\n\n"
            f"📝 Сұрақ {next_q_index + 1}/{len(questions)}:\n\n"
            f"❓ <b>{next_question['text']}</b>",
            parse_mode="HTML",
            reply_markup=get_question_keyboard(next_question, category_id),
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

            # Жаңа категория хабарламасы
            completed = current_cat_index + 1
            total = len(CATEGORY_ORDER)
            progress_bar = "🟢" * completed + "⚪" * (total - completed)

            await callback.message.edit_text(
                f"✅ <b>{category_data['name']}</b> блогы аяқталды!\n\n"
                f"Прогресс: {progress_bar} ({completed}/{total})\n\n"
                f"Келесі блок: {next_category['emoji']} <b>{next_category['name']}</b>\n"
                f"{next_category['description']}",
                parse_mode="HTML",
            )

            # Бірінші сұрақ
            first_q = next_questions[0]
            await callback.message.answer(
                f"📝 Сұрақ 1/{len(next_questions)}:\n\n"
                f"❓ <b>{first_q['text']}</b>",
                parse_mode="HTML",
                reply_markup=get_question_keyboard(first_q, next_cat_id),
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
                "✅ <b>Барлық сұрақтар аяқталды!</b>\n\n"
                "⏳ Жауаптарыңды талдап жатырмын...",
                parse_mode="HTML",
            )

            # Талдау жасау
            all_tags = UserSession.get_all_tags({"answers": answers})
            tag_scores = calculate_tag_scores(all_tags)
            matched = match_professions(tag_scores, top_n=5)

            # Нәтижені көрсету
            result_text = format_result_message(matched)
            await callback.message.answer(
                result_text,
                parse_mode="HTML",
                reply_markup=get_restart_inline(webapp_url=WEBAPP_URL),
            )

            # Нәтижелерді state-те сақтау (кейін /results үшін)
            await state.update_data(
                last_results=result_text,
                tag_scores=dict(tag_scores),
            )
            await callback.answer("🎉 Нәтижеңіз дайын!")
