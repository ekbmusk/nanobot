from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

from config import MINI_APP_URL


def get_main_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🚀 Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL)),
                KeyboardButton(text="👤 Профиль"),
            ],
            [
                KeyboardButton(text="🏆 Рейтинг"),
                KeyboardButton(text="🔥 Streak"),
            ],
            [
                KeyboardButton(text="❓ Көмек"),
            ],
        ],
        resize_keyboard=True,
        persistent=True,
    )
