"""Сауалнама клавиатурасы — сұрақ нұсқалары."""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def get_question_keyboard(question: dict, category_id: str) -> InlineKeyboardMarkup:
    """Сұрақ нұсқаларын inline батырмалар ретінде көрсету.

    callback_data форматы: answer_{category_id}_{option_index}
    Мысалы: answer_interests_2
    """
    buttons = []
    for i, option in enumerate(question["options"]):
        buttons.append([
            InlineKeyboardButton(
                text=option["text"],
                callback_data=f"answer_{category_id}_{i}",
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_category_intro_keyboard(category_id: str) -> InlineKeyboardMarkup:
    """Категория басталғанда 'Жалғастыру' батырмасы."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="➡️ Жалғастыру",
                callback_data=f"continue_{category_id}",
            )],
        ]
    )
