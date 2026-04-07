"""Жауаптарды талдау — тег скорларын есептеу."""

from collections import Counter


def calculate_tag_scores(all_tags: list) -> dict:
    """Тегтердің жиілігін есептеу.

    Args:
        all_tags: Барлық жауаптардан жиналған тегтер тізімі.

    Returns:
        dict: {тег: скор} — скор бойынша сұрыпталған.

    Мысалы:
        >>> calculate_tag_scores(["IT", "логика", "IT", "математика", "IT"])
        {"IT": 3, "логика": 1, "математика": 1}
    """
    counter = Counter(all_tags)
    # Скор бойынша кему ретімен сұрыптау
    sorted_scores = dict(counter.most_common())
    return sorted_scores


def calculate_weighted_tag_scores(answers: list, questions_data: dict) -> dict:
    """Салмақталған тег скорларын есептеу (Mini App үшін).

    Сервер тегтерді questions.json-нан реконструкциялайды (қауіпсіздік).
    Әр сұрақтың weight-і тег скорын көбейтеді.
    """
    # question_id -> {weight, options} lookup
    question_map = {}
    for category in questions_data["categories"]:
        for question in category["questions"]:
            question_map[question["id"]] = question

    scores = {}
    for answer in answers:
        qid = answer.get("question_id", "")
        option_index = answer.get("option_index", 0)

        question = question_map.get(qid)
        if not question:
            continue

        weight = question.get("weight", 1.0)
        options = question.get("options", [])
        if option_index < 0 or option_index >= len(options):
            continue

        tags = options[option_index].get("tags", [])
        for tag in tags:
            scores[tag] = scores.get(tag, 0.0) + weight

    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))


def get_top_tags(tag_scores: dict, top_n: int = 5) -> list:
    """Ең жоғары скорлы тегтерді алу.

    Args:
        tag_scores: {тег: скор} сөздігі.
        top_n: Қанша тег қайтару.

    Returns:
        list: ТОП-N тегтер тізімі.
    """
    sorted_tags = sorted(tag_scores.items(), key=lambda x: x[1], reverse=True)
    return [tag for tag, _ in sorted_tags[:top_n]]
