from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from config import MINI_APP_URL


def open_app_button() -> InlineKeyboardMarkup:
    if MINI_APP_URL:
        return InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="⚛️ Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL)),
        ]])
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="ℹ️ Қосымша орнатылмаған", callback_data="noop"),
    ]])


def profile_keyboard() -> InlineKeyboardMarkup:
    buttons = []
    if MINI_APP_URL:
        buttons.append([InlineKeyboardButton(text="⚛️ Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL))])
    buttons.append([InlineKeyboardButton(text="🔄 Жаңарту", callback_data="profile_refresh")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)
