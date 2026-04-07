"""Жауаптардың сенімділігін тексеру — anti-cheat жүйесі."""

import statistics


def validate_answers(answers: list, timings: list) -> dict:
    """Жауаптарды тексеру және anti-cheat нәтижелерін қайтару."""
    result = {}

    option_indices = [a.get("option_index", 0) for a in answers]

    # 1. Straight-line detection — бірдей жауаптар қатарынан
    result["straight_line_count"] = _longest_consecutive_run(option_indices)

    # 2. Speed checks — тым жылдам жауаптар
    fast_threshold_ms = 2000
    result["fast_answers"] = sum(1 for t in timings if t < fast_threshold_ms)
    result["avg_time_ms"] = statistics.mean(timings) if timings else 0

    # 3. Low variance — тегтердің әртүрлілігі
    from collections import Counter
    all_tags = []
    for a in answers:
        all_tags.extend(a.get("tags", []))
    tag_counts = Counter(all_tags)
    if len(tag_counts) > 1:
        values = list(tag_counts.values())
        result["variance_score"] = statistics.stdev(values) / statistics.mean(values)
    else:
        result["variance_score"] = 0.0

    # 4. Pattern cycling — қайталанатын паттерн
    result["pattern_detected"] = _detect_cycling_pattern(option_indices)

    return result


def calculate_confidence(anticheat: dict) -> int:
    """Anti-cheat нәтижелерінен сенімділік пайызын есептеу (0-100)."""
    confidence = 100

    # Straight-line: ≥4 қатарынан бірдей → штраф
    if anticheat["straight_line_count"] >= 4:
        confidence -= (anticheat["straight_line_count"] - 3) * 15

    # Жылдам жауаптар: әрқайсысына -5%
    confidence -= anticheat["fast_answers"] * 5

    # Төмен variance: -20%
    if anticheat["variance_score"] < 0.3:
        confidence -= 20

    # Паттерн: -25%
    if anticheat["pattern_detected"]:
        confidence -= 25

    return max(0, min(100, confidence))


def format_confidence(confidence: int) -> str:
    """Сенімділікті HTML форматта көрсету."""
    filled = confidence // 20
    empty = 5 - filled

    if confidence >= 80:
        emoji = "🟢"
        icon = "🔒"
    elif confidence >= 50:
        emoji = "🟡"
        icon = "⚠️"
    else:
        emoji = "🔴"
        icon = "⚠️"

    bar = emoji * filled + "⚪" * empty
    text = f"{icon} <b>Нәтиже сенімділігі:</b> {confidence}% {bar}"

    if confidence < 50:
        text += "\n💡 <i>Сұрақтарға мұқият жауап беріп, қайта тест тапсырыңыз.</i>"

    return text


def _longest_consecutive_run(values: list) -> int:
    """Қатарынан қанша бірдей мән бар."""
    if not values:
        return 0
    max_run = 1
    current_run = 1
    for i in range(1, len(values)):
        if values[i] == values[i - 1]:
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 1
    return max_run


def _detect_cycling_pattern(values: list, min_period: int = 2, max_period: int = 5) -> bool:
    """Қысқа периодпен қайталанатын паттернді анықтау."""
    for period in range(min_period, max_period + 1):
        if len(values) < period * 2:
            continue
        pattern = values[:period]
        matches = sum(
            1 for i in range(period, len(values))
            if values[i] == pattern[i % period]
        )
        match_ratio = matches / (len(values) - period)
        if match_ratio >= 0.8:
            return True
    return False
