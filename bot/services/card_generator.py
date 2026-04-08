"""Генератор карточки результатов (Pillow) — Instagram Stories формат."""

import io
import os

from PIL import Image, ImageDraw, ImageFont

from i18n import get_text, tr_demand

# ─── Константы ────────────────────────────────────────────
WIDTH, HEIGHT = 1080, 1920

# Цвета
BG_TOP = (10, 22, 40)       # #0a1628
BG_BOTTOM = (22, 45, 80)    # #162d50
GOLD = (212, 146, 42)       # #d4922a
GOLD_SOFT = (245, 230, 204) # #f5e6cc
WHITE = (255, 255, 255)
WHITE_DIM = (180, 190, 210)
CARD_BG = (20, 35, 65)      # полупрозрачный фон карточки
BAR_BG = (40, 55, 90)       # фон progress bar

RANK_COLORS = [
    (255, 215, 0),   # 🥇 золото
    (192, 192, 210),  # 🥈 серебро
    (205, 127, 50),   # 🥉 бронза
    (140, 160, 190),  # 4
    (120, 140, 170),  # 5
]

# ─── Шрифты (кеш) ────────────────────────────────────────
FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "fonts")
FONT_PATH = os.path.join(FONT_DIR, "NotoSans-Variable.ttf")

_font_cache = {}


def _font(size: int) -> ImageFont.FreeTypeFont:
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
    return _font_cache[size]


# ─── Генерация ────────────────────────────────────────────
def generate_result_card(
    user_name: str,
    top_professions: list,
    lang: str = "kk",
    bot_username: str = "",
) -> io.BytesIO:
    """Генерирует карточку результатов как PNG в BytesIO.

    Args:
        user_name: Имя пользователя.
        top_professions: Список из match_professions() или DB.
            Каждый элемент: {"profession": {...}, "score": N, ...}
            или из DB: {"id": ..., "name": ..., "name_ru": ..., "emoji": ..., "score": N}
        lang: Тіл коды.
        bot_username: Бот username (@... үшін).

    Returns:
        BytesIO с PNG-изображением.
    """
    img = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # ─── Градиентный фон ───
    _draw_gradient(img)

    # ─── Декоративные линии ───
    draw.line([(80, 160), (WIDTH - 80, 160)], fill=GOLD, width=2)
    draw.line([(80, HEIGHT - 160), (WIDTH - 80, HEIGHT - 160)], fill=GOLD, width=2)

    # ─── Заголовок ───
    title = "Кім боламын?" if lang == "kk" else "Кем стать?"
    _draw_text_center(draw, title, y=80, font=_font(52), fill=GOLD)

    subtitle = "Кәсіби бағдар нәтижесі" if lang == "kk" else "Результат профориентации"
    _draw_text_center(draw, subtitle, y=185, font=_font(28), fill=WHITE_DIM)

    # ─── Имя пользователя ───
    _draw_text_center(draw, user_name, y=260, font=_font(64), fill=WHITE)

    # ─── Подзаголовок TOP-5 ───
    top_label = "ТОП-5 мамандық" if lang == "kk" else "ТОП-5 профессий"
    _draw_text_center(draw, top_label, y=350, font=_font(32), fill=GOLD_SOFT)

    # ─── Нормализация данных ───
    profs = _normalize_professions(top_professions)
    max_score = profs[0]["score"] if profs else 1

    # ─── 5 карточек профессий ───
    card_y = 430
    card_height = 220
    card_gap = 20
    card_margin_x = 60

    for i, prof in enumerate(profs[:5]):
        y = card_y + i * (card_height + card_gap)
        _draw_profession_card(
            draw, prof, i, y,
            card_margin_x, card_height,
            max_score, lang,
        )

    # ─── Футер ───
    footer_y = HEIGHT - 120
    if bot_username:
        footer_text = f"@{bot_username}"
    else:
        footer_text = "Кім боламын? — Telegram бот"
    _draw_text_center(draw, footer_text, y=footer_y, font=_font(26), fill=WHITE_DIM)

    # ─── Сохранение ───
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    buf.seek(0)
    return buf


def _draw_gradient(img: Image.Image):
    """Вертикальный градиент BG_TOP → BG_BOTTOM (горизонтальными линиями)."""
    draw = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * ratio)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * ratio)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))


def _draw_text_center(draw: ImageDraw.Draw, text: str, y: int,
                      font: ImageFont.FreeTypeFont, fill: tuple):
    """Текст по центру горизонтали."""
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    x = (WIDTH - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def _draw_profession_card(draw: ImageDraw.Draw, prof: dict, rank: int,
                          y: int, mx: int, h: int,
                          max_score: float, lang: str):
    """Рисует одну карточку профессии."""
    w = WIDTH - mx * 2

    # Фон карточки (скруглённый прямоугольник)
    _draw_rounded_rect(draw, mx, y, mx + w, y + h, radius=20, fill=CARD_BG)

    # Ранг (большой номер слева)
    rank_num = str(rank + 1)
    rank_color = RANK_COLORS[rank] if rank < len(RANK_COLORS) else WHITE_DIM
    draw.text((mx + 30, y + 25), rank_num, font=_font(90), fill=rank_color)

    # Название профессии
    name = prof.get("name_ru", prof["name"]) if lang == "ru" else prof["name"]
    # Обрезать если слишком длинное
    max_name_width = w - 160
    name_font = _font(34)
    while name_font.getbbox(name)[2] > max_name_width and len(name) > 10:
        name = name[:len(name) - 2] + "…"
    draw.text((mx + 120, y + 30), name, font=name_font, fill=WHITE)

    # Demand
    demand_text = tr_demand(prof.get("demand", ""), lang)
    if demand_text:
        draw.text((mx + 120, y + 75), demand_text, font=_font(22), fill=WHITE_DIM)

    # Progress bar
    bar_x = mx + 120
    bar_y = y + 120
    bar_w = w - 250
    bar_h = 16
    percentage = round(prof["score"] / max_score * 100) if max_score > 0 else 0
    fill_w = int(bar_w * percentage / 100)

    _draw_rounded_rect(draw, bar_x, bar_y, bar_x + bar_w, bar_y + bar_h,
                       radius=8, fill=BAR_BG)
    if fill_w > 0:
        _draw_rounded_rect(draw, bar_x, bar_y, bar_x + fill_w, bar_y + bar_h,
                           radius=8, fill=GOLD)

    # Процент
    pct_text = f"{percentage}%"
    draw.text((bar_x + bar_w + 20, bar_y - 8), pct_text,
              font=_font(30), fill=GOLD)

    # Salary (мелким шрифтом)
    salary = prof.get("salary_range", "")
    if salary:
        sal_label = "💰 " + salary
        draw.text((mx + 120, y + 155), sal_label, font=_font(20), fill=WHITE_DIM)


def _draw_rounded_rect(draw: ImageDraw.Draw, x1: int, y1: int,
                       x2: int, y2: int, radius: int, fill: tuple):
    """Скруглённый прямоугольник."""
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill)


def _normalize_professions(top_professions: list) -> list:
    """Приводит данные к единому формату (из matcher или из DB)."""
    result = []
    for item in top_professions:
        if "profession" in item:
            # Из match_professions()
            prof = item["profession"].copy()
            prof["score"] = item["score"]
            result.append(prof)
        else:
            # Из DB (уже плоский dict)
            result.append(item)
    return result
