"""Негізгі мәзір клавиатурасы."""

from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)


def get_main_keyboard(webapp_url: str = "") -> ReplyKeyboardMarkup:
    """Негізгі reply клавиатура — тест бастау, ақпарат."""
    # Mini App болса, "Тест бастау" батырмасы WebApp ашады
    if webapp_url:
        start_btn = KeyboardButton(
            text="🚀 Тест бастау",
            web_app=WebAppInfo(url=f"{webapp_url}/webapp/index.html"),
        )
    else:
        start_btn = KeyboardButton(text="🚀 Тест бастау")

    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [start_btn],
            [
                KeyboardButton(text="📊 Менің нәтижем"),
                KeyboardButton(text="ℹ️ Бот туралы"),
            ],
            [KeyboardButton(text="❓ Көмек")],
        ],
        resize_keyboard=True,
        input_field_placeholder="Мамандығыңды тап! 🎯",
    )
    return keyboard


def get_start_inline(webapp_url: str = "") -> InlineKeyboardMarkup:
    """Бастау батырмасы — inline (fallback, sendData жұмыс істемейді)."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="🚀 Тестті бастау",
                callback_data="start_survey",
            )],
        ]
    )


def get_restart_inline(webapp_url: str = "") -> InlineKeyboardMarkup:
    """Қайта тест тапсыру батырмасы."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="🔄 Қайта тест тапсыру",
                callback_data="start_survey",
            )],
        ]
    )
