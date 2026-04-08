"""Мини-квесттер хендлері — мамандықты сынап көру."""

import json
import os

from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext

from database import get_user_lang
from i18n import t, get_text
from models.states import QuestStates
from keyboards.quest_kb import (
    get_quest_start_keyboard,
    get_quest_answer_keyboard,
    get_quest_next_keyboard,
    get_quest_result_keyboard,
)

router = Router()

# Квест деректерін жүктеу
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
QUESTS_PATH = os.path.join(DATA_DIR, "quests.json")

QUESTS_DATA = {}
if os.path.exists(QUESTS_PATH):
    with open(QUESTS_PATH, "r", encoding="utf-8") as f:
        QUESTS_DATA = json.load(f).get("quests", {})

# Қолжетімді мамандықтар жиыны
AVAILABLE_QUEST_IDS = set(QUESTS_DATA.keys())


def get_available_quest_ids() -> set:
    """Квесті бар мамандықтардың ID жиыны."""
    return AVAILABLE_QUEST_IDS


@router.callback_query(F.data.startswith("quest_") & ~F.data.startswith("quest_back"))
async def start_quest(callback: CallbackQuery, state: FSMContext):
    """Квестті бастау — мамандық таңдалды."""
    profession_id = callback.data[6:]  # "quest_software_engineer" → "software_engineer"

    data = await state.get_data()
    lang = data.get("lang")
    if not lang:
        lang = await get_user_lang(callback.from_user.id) or "kk"

    quest = QUESTS_DATA.get(profession_id)
    if not quest:
        msg = "🔜 Бұл мамандық бойынша квест жақында қосылады!" if lang == "kk" \
            else "🔜 Квест для этой профессии скоро появится!"
        await callback.answer(msg, show_alert=True)
        return

    title = get_text(quest, "title", lang)
    desc = get_text(quest, "description", lang)
    q_count = len(quest["questions"])

    await callback.message.edit_text(
        f"🎮 <b>{title}</b>\n\n"
        f"{desc}\n\n"
        f"📝 {q_count} {'сұрақ' if lang == 'kk' else 'вопросов'}",
        reply_markup=get_quest_start_keyboard(profession_id, lang),
    )

    # Квест деректерін сақтау
    await state.update_data(
        quest_profession_id=profession_id,
        quest_correct=0,
        quest_current=0,
    )
    await state.set_state(QuestStates.active)
    await callback.answer()


@router.callback_query(F.data.startswith("qbegin_"))
async def begin_quest(callback: CallbackQuery, state: FSMContext):
    """Бірінші сұрақты көрсету."""
    profession_id = callback.data[7:]
    data = await state.get_data()
    lang = data.get("lang", "kk")

    quest = QUESTS_DATA.get(profession_id)
    if not quest:
        await callback.answer("❌")
        return

    question = quest["questions"][0]
    q_text = get_text(question, "text", lang)
    total = len(quest["questions"])

    await callback.message.edit_text(
        f"❓ <b>1/{total}</b>\n\n{q_text}",
        reply_markup=get_quest_answer_keyboard(profession_id, 0, question["options"], lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("qans_"))
async def process_quest_answer(callback: CallbackQuery, state: FSMContext):
    """Квест жауабын өңдеу."""
    parts = callback.data.split("_")
    # qans_{prof_id}_{q_idx}_{opt_idx} — prof_id может содержать _
    # Формат: qans_software_engineer_0_2
    # Берём последние два числа, остальное — prof_id
    opt_idx = int(parts[-1])
    q_idx = int(parts[-2])
    profession_id = "_".join(parts[1:-2])

    data = await state.get_data()
    lang = data.get("lang", "kk")
    correct_count = data.get("quest_correct", 0)

    quest = QUESTS_DATA.get(profession_id)
    if not quest:
        await callback.answer("❌")
        return

    question = quest["questions"][q_idx]
    options = question["options"]
    selected = options[opt_idx]
    is_correct = selected.get("correct", False)

    if is_correct:
        correct_count += 1
        await state.update_data(quest_correct=correct_count)

    # Жауап нәтижесі + түсіндірме
    explanation = get_text(question, "explanation", lang)
    if is_correct:
        result_emoji = "✅"
        result_text = "Дұрыс!" if lang == "kk" else "Правильно!"
    else:
        result_emoji = "❌"
        # Дұрыс жауапты көрсету
        correct_opt = next((o for o in options if o.get("correct")), None)
        correct_text = get_text(correct_opt, "text", lang) if correct_opt else ""
        result_text = f"{'Дұрыс жауап' if lang == 'kk' else 'Правильный ответ'}: {correct_text}"

    total = len(quest["questions"])
    next_idx = q_idx + 1
    has_next = next_idx < total

    msg = f"{result_emoji} <b>{result_text}</b>\n\n💡 {explanation}"

    if has_next:
        await callback.message.edit_text(
            msg,
            reply_markup=get_quest_next_keyboard(profession_id, next_idx, lang),
        )
    else:
        # Квест аяқталды
        score_text = _format_quest_result(correct_count, total, profession_id, lang)
        await callback.message.edit_text(
            f"{msg}\n\n{'─' * 20}\n\n{score_text}",
            reply_markup=get_quest_result_keyboard(lang),
        )
        # Квест күйін тазалау
        await state.set_state(None)

    await callback.answer()


@router.callback_query(F.data.startswith("qnext_"))
async def next_quest_question(callback: CallbackQuery, state: FSMContext):
    """Келесі квест сұрағы."""
    parts = callback.data.split("_")
    next_idx = int(parts[-1])
    profession_id = "_".join(parts[1:-1])

    data = await state.get_data()
    lang = data.get("lang", "kk")

    quest = QUESTS_DATA.get(profession_id)
    if not quest or next_idx >= len(quest["questions"]):
        await callback.answer("❌")
        return

    question = quest["questions"][next_idx]
    q_text = get_text(question, "text", lang)
    total = len(quest["questions"])

    await callback.message.edit_text(
        f"❓ <b>{next_idx + 1}/{total}</b>\n\n{q_text}",
        reply_markup=get_quest_answer_keyboard(profession_id, next_idx, question["options"], lang),
    )
    await callback.answer()


@router.callback_query(F.data == "quest_back")
async def quest_back_to_results(callback: CallbackQuery, state: FSMContext):
    """Нәтижелерге оралу."""
    data = await state.get_data()
    lang = data.get("lang", "kk")
    last_results = data.get("last_results")

    if last_results:
        from config import WEBAPP_URL
        from keyboards.main_kb import get_restart_inline
        share_url = data.get("last_share_url", "")
        await callback.message.edit_text(
            last_results,
            reply_markup=get_restart_inline(lang=lang, webapp_url=WEBAPP_URL, share_url=share_url),
        )
    else:
        msg = "📊 /start командасымен қайта бастаңыз" if lang == "kk" \
            else "📊 Начните заново с /start"
        await callback.message.edit_text(msg)

    await callback.answer()


def _format_quest_result(correct: int, total: int, profession_id: str,
                         lang: str) -> str:
    """Квест нәтижесін форматтау."""
    ratio = correct / total if total > 0 else 0

    # Профессия атауын алу
    quest = QUESTS_DATA.get(profession_id, {})
    title = get_text(quest, "title", lang) if quest else profession_id

    score_line = f"🏆 <b>{correct}/{total}</b>"

    if ratio >= 0.8:
        if lang == "kk":
            verdict = f"Тамаша нәтиже! Сенен керемет {title.lower()} шығар еді! 🌟"
        else:
            verdict = f"Отличный результат! Из тебя получится отличный специалист! 🌟"
    elif ratio >= 0.5:
        if lang == "kk":
            verdict = f"Жақсы! {title} саласы саған жақын! 👏"
        else:
            verdict = f"Хорошо! Эта сфера тебе подходит! 👏"
    else:
        if lang == "kk":
            verdict = f"Қызықты! {title} саласы туралы көбірек білуге болады! 📚"
        else:
            verdict = f"Интересно! Можно узнать больше об этой сфере! 📚"

    return f"{score_line}\n\n{verdict}"
