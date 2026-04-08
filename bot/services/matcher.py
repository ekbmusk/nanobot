"""Мамандық сәйкестендіру — тег скорлары бойынша ТОП-5 мамандық табу."""

import json
import os

from i18n import t, get_text, tr_subject, tr_demand

# Деректер файлдарының жолы
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def load_professions() -> list:
    """professions.json файлынан мамандықтарды жүктеу."""
    filepath = os.path.join(DATA_DIR, "professions.json")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["professions"]


def load_universities() -> dict:
    """universities.json файлынан ЖОО деректерін жүктеу."""
    filepath = os.path.join(DATA_DIR, "universities.json")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def match_professions(tag_scores: dict, top_n: int = 5) -> list:
    """Тег скорлары бойынша ең сәйкес мамандықтарды табу.

    Args:
        tag_scores: {тег: скор} сөздігі (analyzer-ден).
        top_n: Қанша мамандық қайтару (әдепкі: 5).

    Returns:
        list: Сәйкестендірілген мамандықтар тізімі, әрбірі:
            {"profession": {...}, "score": int, "universities": [...]}
    """
    professions = load_professions()
    uni_data = load_universities()
    uni_map = uni_data.get("profession_university_map", {})
    uni_list = {u["id"]: u for u in uni_data.get("universities", [])}

    results = []

    for profession in professions:
        # Мамандық тегтерінің пайдаланушы скорларымен сәйкестігін есептеу
        score = 0
        for tag in profession.get("tags", []):
            score += tag_scores.get(tag, 0)

        # ЖОО-ларды табу
        profession_unis = []
        for uni_id in uni_map.get(profession["id"], []):
            if uni_id in uni_list:
                profession_unis.append(uni_list[uni_id])

        results.append({
            "profession": profession,
            "score": score,
            "universities": profession_unis,
        })

    # Скор бойынша сұрыптау (кему ретімен)
    results.sort(key=lambda x: x["score"], reverse=True)

    return results[:top_n]


def format_result_message(matched: list, lang: str = "kk") -> str:
    """Нәтижені Telegram хабарлама форматында шығару.

    Args:
        matched: match_professions() нәтижесі.
        lang: Тіл коды ("kk" немесе "ru").

    Returns:
        str: Форматталған хабарлама мәтіні.
    """
    if not matched:
        return t("no_match", lang)

    lines = []
    lines.append(t("result_header", lang))

    medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]

    for i, item in enumerate(matched):
        prof = item["profession"]
        unis = item["universities"]

        name = get_text(prof, "name", lang)
        desc = get_text(prof, "description", lang)
        demand = tr_demand(prof["demand"], lang)
        subjects = [tr_subject(s, lang) for s in prof["ent_subjects"]]

        lines.append(f"{medals[i]} <b>{prof['emoji']} {name}</b>")
        lines.append(f"   📝 {desc}")
        lines.append(f"   💰 {t('salary_label', lang)}: {prof['salary_range']}")
        lines.append(f"   📈 {t('demand_label', lang)}: {demand}")
        lines.append(f"   📚 {t('ent_label', lang)}: {', '.join(subjects)}")

        if unis:
            uni_names = [u["name"] for u in unis[:3]]
            lines.append(f"   🏫 {t('uni_label', lang)}: {', '.join(uni_names)}")

        lines.append("")  # Бос жол

    lines.append(t("result_footer", lang))

    return "\n".join(lines)
