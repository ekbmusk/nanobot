"""Квест клавиатуралары — мини-квесттер үшін."""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from i18n import t, get_text


def get_quest_selection_keyboard(matched: list, lang: str = "kk",
                                 available_ids: set = None) -> InlineKeyboardMarkup | None:
    """Квест таңдау клавиатурасы — ТОП-5 мамандық."""
    buttons = []
    for item in matched[:5]:
        prof = item["profession"] if "profession" in item else item
        prof_id = prof["id"]

        if available_ids and prof_id not in available_ids:
            continue

        name = get_text(prof, "name", lang)
        # Қысқарту
        if len(name) > 30:
            name = name[:28] + "…"
        emoji = prof.get("emoji", "🎮")
        label = f"{emoji} {name}"

        buttons.append([
            InlineKeyboardButton(
                text=label,
                callback_data=f"quest_{prof_id}",
            )
        ])

    if not buttons:
        return None
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_quest_start_keyboard(profession_id: str,
                             lang: str = "kk") -> InlineKeyboardMarkup:
    """Квест бастау батырмасы."""
    btn_text = "🚀 Бастау!" if lang == "kk" else "🚀 Начать!"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=btn_text,
                callback_data=f"qbegin_{profession_id}",
            )],
        ]
    )


def get_quest_answer_keyboard(profession_id: str, q_idx: int,
                              options: list,
                              lang: str = "kk") -> InlineKeyboardMarkup:
    """Квест сұрақ нұсқалары."""
    buttons = []
    for i, opt in enumerate(options):
        text = get_text(opt, "text", lang)
        buttons.append([
            InlineKeyboardButton(
                text=text,
                callback_data=f"qans_{profession_id}_{q_idx}_{i}",
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_quest_next_keyboard(profession_id: str, next_idx: int,
                            lang: str = "kk") -> InlineKeyboardMarkup:
    """Келесі сұрақ батырмасы."""
    btn_text = "Келесі →" if lang == "kk" else "Далее →"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=btn_text,
                callback_data=f"qnext_{profession_id}_{next_idx}",
            )],
        ]
    )


def get_quest_result_keyboard(lang: str = "kk") -> InlineKeyboardMarkup:
    """Квест нәтижесі батырмалары."""
    back_text = "📊 Нәтижелерге оралу" if lang == "kk" else "📊 К результатам"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=back_text,
                callback_data="quest_back",
            )],
        ]
    )
