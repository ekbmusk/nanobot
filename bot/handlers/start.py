from pathlib import Path
from html import escape
import httpx
from aiogram import Router, F
from aiogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    FSInputFile,
)
from aiogram.filters import CommandStart, Command

from config import BACKEND_URL, MINI_APP_URL
from keyboards.main_keyboard import get_main_keyboard
from keyboards.inline_kb import open_app_button, profile_keyboard

router = Router()

BANNER_PATH = Path(__file__).parent.parent / "assets" / "welcome_banner.png"
MEDAL = ["🥇", "🥈", "🥉"]


def _format_user_mention(entry: dict) -> str:
    username = (entry.get("username") or "").strip().lstrip("@")
    first_name = (entry.get("first_name") or "").strip()
    last_name = (entry.get("last_name") or "").strip()
    full_label = " ".join(part for part in [first_name, last_name] if part)

    if username:
        label = full_label or f"@{username}"
        return f'<a href="https://t.me/{escape(username, quote=True)}">{escape(label)}</a>'

    telegram_id = entry.get("telegram_id")
    label = full_label or "Пайдаланушы"
    if telegram_id:
        return f'<a href="tg://user?id={telegram_id}">{escape(label)}</a>'
    return escape(label)


def _start_inline_keyboard() -> InlineKeyboardMarkup:
    buttons = []
    if MINI_APP_URL:
        buttons.append([InlineKeyboardButton(text="⚛️ Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL))])
    buttons.append([
        InlineKeyboardButton(text="📖 Нұсқаулық", callback_data="help"),
        InlineKeyboardButton(text="🏆 Рейтинг", callback_data="rating"),
    ])
    buttons.append([
        InlineKeyboardButton(text="👤 Профиль", callback_data="profile"),
        InlineKeyboardButton(text="🔥 Streak", callback_data="streak"),
    ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


async def _register_user(user) -> tuple[bool, dict | None]:
    """Upsert user in backend. Returns (is_new, response_data)."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{BACKEND_URL}/api/users/register",
                json={
                    "telegram_id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "language_code": user.language_code or "kk",
                },
            )
            if r.status_code == 200:
                data = r.json()
                return data.get("is_new", False), data
    except Exception:
        pass
    return False, None


async def _get_user_stats(telegram_id: int) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            progress_r = await client.get(f"{BACKEND_URL}/api/progress/{telegram_id}")
            rank_r = await client.get(
                f"{BACKEND_URL}/api/rating/leaderboard",
                params={"period": "all", "telegram_id": telegram_id},
            )
            progress = progress_r.json() if progress_r.status_code == 200 else {}
            rank_data = rank_r.json() if rank_r.status_code == 200 else {}
            my_rank = rank_data.get("my_rank") or {}
            return {
                "streak": progress.get("streak", 0),
                "problems_solved": progress.get("problems_solved", 0),
                "tests_taken": progress.get("tests_taken", 0),
                "avg_score": progress.get("avg_score", 0),
                "rank": my_rank.get("rank"),
                "score": my_rank.get("score", 0),
            }
    except Exception:
        return {}


async def _get_top5() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"{BACKEND_URL}/api/rating/leaderboard",
                params={"period": "all", "limit": 5},
            )
            if r.status_code == 200:
                return r.json().get("leaderboard", [])
    except Exception:
        pass
    return []


@router.message(CommandStart())
async def cmd_start(message: Message):
    user = message.from_user
    first_name = user.first_name or "Оқушы"

    is_new, _ = await _register_user(user)

    stats = {}
    if not is_new:
        stats = await _get_user_stats(user.id)

    if is_new or not stats:
        text = (
            f"⚛️ <b>Физика Нанотехнология Боты</b>\n"
            f"━━━━━━━━━━━━━━━━━\n\n"
            f"Сәлем, <b>{first_name}</b>! 👋\n\n"
            f"Бұл бот физика және нанотехнологияны оңай үйренуге көмектеседі:\n\n"
            f"📘 <b>Теория</b> — нанотехнология негіздері\n"
            f"🧮 <b>Есептер</b> — 6 деңгей: жеңіл → күрделі\n"
            f"🧠 <b>Тесттер</b> — 10 сұрақ, таймермен\n"
            f"🤖 <b>AI репетитор</b> — физика сұрағына жауап\n"
            f"🏆 <b>Рейтинг</b> — достарыңмен бәсекелес\n"
            f"🔥 <b>Streak</b> — күн сайын оқы, жолақ жина\n\n"
            f"━━━━━━━━━━━━━━━━━\n"
            f"👇 <b>Бастау үшін батырманы басыңыз!</b>"
        )
    else:
        rank_str = f"#{stats['rank']}" if stats.get("rank") else "—"
        text = (
            f"⚛️ <b>Физика Нанотехнология Боты</b>\n"
            f"━━━━━━━━━━━━━━━━━\n\n"
            f"Қош келдіңіз қайта, <b>{first_name}</b>! 🎉\n\n"
            f"📊 <b>Сіздің статистика:</b>\n"
            f"🔥 Streak: <b>{stats.get('streak', 0)} күн</b>\n"
            f"✅ Есептер: <b>{stats.get('problems_solved', 0)}</b>\n"
            f"🧠 Тесттер: <b>{stats.get('tests_taken', 0)}</b>\n"
            f"⭐ Ұпай: <b>{stats.get('score', 0)}</b>\n"
            f"🏆 Рейтинг: <b>{rank_str}</b>\n\n"
            f"━━━━━━━━━━━━━━━━━\n"
            f"Жалғастырамыз ба? 💪"
        )

    # Send persistent reply keyboard
    await message.answer(
        "⚛️ <b>Физика Нанотехнология</b> — Мәзір дайын!",
        parse_mode="HTML",
        reply_markup=get_main_keyboard(),
    )

    # Send welcome card with inline keyboard
    if BANNER_PATH.exists():
        await message.answer_photo(
            photo=FSInputFile(str(BANNER_PATH)),
            caption=text,
            parse_mode="HTML",
            reply_markup=_start_inline_keyboard(),
        )
    else:
        await message.answer(
            text,
            parse_mode="HTML",
            reply_markup=_start_inline_keyboard(),
        )


@router.message(Command("app"))
async def cmd_app(message: Message):
    if MINI_APP_URL:
        await message.answer(
            "⚛️ <b>Физика Нанотехнология</b> — Mini App:",
            parse_mode="HTML",
            reply_markup=open_app_button(),
        )
    else:
        await message.answer(
            "⚠️ Mini App URL орнатылмаған.\nАдминге хабарласыңыз.",
            parse_mode="HTML",
        )


@router.callback_query(F.data == "help")
async def cb_help(query: CallbackQuery):
    from handlers.help import HELP_TEXT
    await query.answer()
    await query.message.answer(HELP_TEXT, parse_mode="HTML")


@router.callback_query(F.data == "rating")
async def cb_rating(query: CallbackQuery):
    await query.answer()
    leaders = await _get_top5()

    if not leaders:
        await query.message.answer(
            "🏆 <b>Рейтинг</b>\n\nӘзірше деректер жоқ. Алғашқы болыңыз!",
            parse_mode="HTML",
        )
        return

    lines = ["🏆 <b>Үздік оқушылар</b>\n"]
    for i, u in enumerate(leaders):
        medal = MEDAL[i] if i < 3 else f"{i + 1}."
        name = _format_user_mention(u)
        score = u.get("score", 0)
        lines.append(f"{medal} {name} — <b>{score} ұпай</b>")

    await query.message.answer("\n".join(lines), parse_mode="HTML")


@router.callback_query(F.data == "profile")
async def cb_profile(query: CallbackQuery):
    await query.answer()
    from handlers.profile import _fetch_profile, _build_profile_text
    data = await _fetch_profile(query.from_user.id)
    await query.message.answer(
        _build_profile_text(query.from_user, data),
        parse_mode="HTML",
        reply_markup=profile_keyboard(),
    )


@router.callback_query(F.data == "streak")
async def cb_streak(query: CallbackQuery):
    await query.answer()
    from handlers.streak import _fetch_streak, _streak_bar, _streak_message
    data = await _fetch_streak(query.from_user.id)
    streak = data.get("streak", 0)
    bar = _streak_bar(streak)
    motivation = _streak_message(streak)
    last_test = data.get("recent_tests", [])
    last_active = last_test[0]["date"] if last_test else "—"

    text = (
        f"🔥 <b>Сіздің streak: {streak} күн!</b>\n\n"
        f"{bar}\n\n"
        f"{motivation}\n"
        f"📅 Соңғы белсенділік: <b>{last_active}</b>"
    )
    await query.message.answer(text, parse_mode="HTML", reply_markup=open_app_button())


@router.callback_query(F.data == "noop")
async def cb_noop(query: CallbackQuery):
    await query.answer("Mini App URL орнатылмаған")
