from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)


def get_main_keyboard(mini_app_url: str) -> ReplyKeyboardMarkup:
    """Main reply keyboard with Mini App button."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="📱 Mini App ашу",
                    web_app=WebAppInfo(url=https://bless-arm-timely-four.trycloudflare.com),
                )
            ],
            [
                KeyboardButton(text="📊 Прогресс"),
                KeyboardButton(text="🏆 Рейтинг"),
            ],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


def get_webapp_button(mini_app_url: str) -> InlineKeyboardMarkup:
    """Inline button to open Mini App."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⚛️ Физика Боты ашу",
                    web_app=WebAppInfo(url=https://bless-arm-timely-four.trycloudflare.com),
                )
            ]
        ]
    )
