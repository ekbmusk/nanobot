from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from config import MINI_APP_URL


def open_app_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🚀 Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL)),
    ]])


def profile_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Қосымшаны ашу", web_app=WebAppInfo(url=MINI_APP_URL))],
        [InlineKeyboardButton(text="🔄 Жаңарту", callback_data="profile_refresh")],
    ])
