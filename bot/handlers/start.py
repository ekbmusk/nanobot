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
from keyboards.main_kb import get_main_keyboard
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
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL))],
            [
                InlineKeyboardButton(text="📖 Нұсқаулық", callback_data="help"),
                InlineKeyboardButton(text="🏆 Рейтинг", callback_data="rating"),
            ],
        ]
    )


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
                "rank": my_rank.get("rank"),
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

    # Build welcome text
    if is_new or not stats:
        text = (
            f"🎓 <b>Физика Оқу Боты</b>\n\n"
            f"Сәлем, <b>{first_name}</b>! 👋\n\n"
            f"Бұл бот саған физиканы оңай үйренуге көмектеседі:\n\n"
            f"📘 <b>Теория</b> — түсінікті түсіндірмелер + формулалар\n"
            f"🧮 <b>Есептер</b> — 3 деңгей: жеңіл → күрделі\n"
            f"🧠 <b>Тесттер</b> — өзіңді тексер\n"
            f"🤖 <b>AI репетитор</b> — кез келген сұраққа жауап\n"
            f"🏆 <b>Рейтинг</b> — достарыңмен бәсекелес\n\n"
            f"━━━━━━━━━━━━━━━\n"
            f"👇 <b>Бастау үшін батырманы басыңыз</b>"
        )
    else:
        rank_str = f"#{stats['rank']}" if stats.get("rank") else "—"
        text = (
            f"Қош келдіңіз қайта, <b>{first_name}</b>! 🎉\n\n"
            f"🔥 Streak: <b>{stats.get('streak', 0)} күн</b>\n"
            f"✅ Шешілген есептер: <b>{stats.get('problems_solved', 0)}</b>\n"
            f"🏆 Рейтингтегі орын: <b>{rank_str}</b>\n\n"
            f"Жалғастырамыз ба? 💪"
        )

    # Send persistent reply keyboard first
    await message.answer("👋", reply_markup=get_main_keyboard())

    # Then send welcome card with inline keyboard
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
    await message.answer(
        "📱 <b>Физика Боты</b> — Mini App:",
        parse_mode="HTML",
        reply_markup=open_app_button(),
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
