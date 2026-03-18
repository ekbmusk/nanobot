# Legacy handler — catches any unhandled text messages
from aiogram import Router, F
from aiogram.types import Message

router = Router()


@router.message(F.text)
async def unknown_text(message: Message):
    # Silently ignore unrecognized text (keyboard buttons are handled by dedicated routers)
    pass
