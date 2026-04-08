"""Негізгі мәзір клавиатурасы."""

from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)

from i18n import t


def get_language_keyboard() -> InlineKeyboardMarkup:
    """Тіл таңдау клавиатурасы."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🇰🇿 Қазақша", callback_data="lang_kk"),
                InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru"),
            ],
        ]
    )


def get_main_keyboard(lang: str = "kk", webapp_url: str = "") -> ReplyKeyboardMarkup:
    """Негізгі reply клавиатура."""
    if webapp_url:
        start_btn = KeyboardButton(
            text=t("btn_start", lang),
            web_app=WebAppInfo(url=f"{webapp_url}"),
        )
    else:
        start_btn = KeyboardButton(text=t("btn_start", lang))

    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [start_btn],
            [KeyboardButton(text=t("btn_authors", lang))],
        ],
        resize_keyboard=True,
        input_field_placeholder="🎯",
    )
    return keyboard


def get_start_inline(lang: str = "kk", webapp_url: str = "") -> InlineKeyboardMarkup:
    """Бастау батырмасы — inline."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=t("btn_begin", lang),
                callback_data="start_survey",
            )],
        ]
    )


def get_restart_inline(lang: str = "kk", webapp_url: str = "",
                       share_url: str = "") -> InlineKeyboardMarkup:
    """Қайта тест + карточка + бөлісу батырмалары."""
    card_text = "📸 Карточка"
    buttons = [
        [
            InlineKeyboardButton(
                text=t("btn_restart", lang),
                callback_data="start_survey",
            ),
            InlineKeyboardButton(
                text=card_text,
                callback_data="get_card",
            ),
        ],
    ]
    if share_url:
        buttons.append([
            InlineKeyboardButton(
                text=t("btn_share", lang),
                url=share_url,
            ),
        ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)
