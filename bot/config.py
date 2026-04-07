"""Конфигурация — .env файлынан параметрлерді жүктеу."""

import os
from pathlib import Path
from dotenv import load_dotenv

# .env файлы bot/ немесе жоба корінде болуы мүмкін
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN орнатылмаған! .env файлын тексеріңіз.")

# Mini App web server
WEBAPP_URL = os.getenv("WEBAPP_URL", "")
WEBAPP_HOST = os.getenv("WEBAPP_HOST", "0.0.0.0")
WEBAPP_PORT = int(os.getenv("WEBAPP_PORT", "8080"))
