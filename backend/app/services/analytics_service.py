from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.topic_mastery import TopicMastery
from app.models.user import User

TOPIC_NAMES = {
    "atomic_structure": "Атом құрылысы",
    "quantum_basics": "Кванттық физика негіздері",
    "nanomaterials": "Наноматериалдар",
    "nano_applications": "Нанотехнология қолданыстары",
}


def _calculate_estimated_level(accuracy: float) -> int:
    if accuracy >= 90:
        return 6
    elif accuracy >= 80:
        return 5
    elif accuracy >= 65:
        return 4
    elif accuracy >= 50:
        return 3
    elif accuracy >= 30:
        return 2
    return 1


def update_topic_mastery(
    db: Session,
    user_id: int,
    topic_results: dict[str, list[bool]],
):
    """Update TopicMastery rows after a test/quiz submission.

    topic_results: {topic_id: [True, False, True, ...]} per question correctness
    """
    now = datetime.now(timezone.utc)

    for topic_id, results in topic_results.items():
        mastery = (
            db.query(TopicMastery)
            .filter(TopicMastery.user_id == user_id, TopicMastery.topic_id == topic_id)
            .first()
        )

        if not mastery:
            mastery = TopicMastery(
                user_id=user_id,
                topic_id=topic_id,
                total_attempts=0,
                correct_attempts=0,
                current_accuracy=0.0,
                last_5_results="[]",
                estimated_level=3,
            )
            db.add(mastery)

        mastery.total_attempts = (mastery.total_attempts or 0) + len(results)
        mastery.correct_attempts = (mastery.correct_attempts or 0) + sum(results)
        mastery.current_accuracy = round(
            mastery.correct_attempts / mastery.total_attempts * 100, 1
        ) if mastery.total_attempts > 0 else 0.0

        # Rolling last 5: append new results, keep last 5
        last_5 = mastery.get_last_5()
        last_5.extend(results)
        mastery.set_last_5(last_5)

        mastery.estimated_level = _calculate_estimated_level(mastery.last_5_accuracy)
        mastery.last_attempted = now

    db.flush()


def get_weak_topics(db: Session, user_id: int) -> list[dict]:
    """Return topics sorted by weakness (lowest last_5 accuracy first).
    Only includes topics with at least 3 attempts.
    """
    records = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == user_id, TopicMastery.total_attempts >= 3)
        .all()
    )

    weak = []
    for r in records:
        l5 = r.last_5_accuracy
        if l5 < 70:
            weak.append({
                "topic_id": r.topic_id,
                "name": TOPIC_NAMES.get(r.topic_id, r.topic_id),
                "accuracy": r.current_accuracy,
                "last_5_accuracy": round(l5, 1),
                "estimated_level": r.estimated_level,
            })

    weak.sort(key=lambda x: x["last_5_accuracy"])
    return weak


def get_recommendations(db: Session, user_id: int) -> list[dict]:
    """Return 2-3 actionable recommendations in Kazakh."""
    weak = get_weak_topics(db, user_id)
    recs = []

    for topic in weak[:2]:
        tid = topic["topic_id"]
        name = topic["name"]
        acc = topic["last_5_accuracy"]

        if acc < 40:
            msg = f"{name} тақырыбын қайталаңыз — соңғы нәтиже: {acc:.0f}%"
            recs.append({
                "type": "review_theory",
                "topic_id": tid,
                "message": msg,
                "action_url": f"/theory?topic={tid}",
            })
        else:
            msg = f"{name} бойынша тест шешіңіз — нәтижеңізді жақсартыңыз ({acc:.0f}%)"
            recs.append({
                "type": "practice_topic",
                "topic_id": tid,
                "message": msg,
                "action_url": f"/test?topic={tid}",
            })

    # If no weak topics yet, suggest exploring
    if not recs:
        all_mastery = (
            db.query(TopicMastery)
            .filter(TopicMastery.user_id == user_id)
            .all()
        )
        covered = {m.topic_id for m in all_mastery}
        uncovered = [tid for tid in TOPIC_NAMES if tid not in covered]

        if uncovered:
            tid = uncovered[0]
            recs.append({
                "type": "explore_topic",
                "topic_id": tid,
                "message": f"{TOPIC_NAMES[tid]} тақырыбын бастаңыз",
                "action_url": f"/theory?topic={tid}",
            })
        else:
            # All topics covered and strong — suggest daily test
            recs.append({
                "type": "daily_test",
                "topic_id": None,
                "message": "Барлық тақырыптар жақсы! Күнделікті тест шешіңіз",
                "action_url": "/test",
            })

    return recs


def get_analytics(db: Session, telegram_id: int) -> dict | None:
    """Build full analytics response for a user."""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return None

    records = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == user.id)
        .all()
    )

    topic_mastery = []
    for r in records:
        l5 = r.last_5_accuracy
        overall = r.current_accuracy

        if r.total_attempts < 3:
            trend = "new"
        elif l5 > overall + 5:
            trend = "improving"
        elif l5 < overall - 5:
            trend = "declining"
        else:
            trend = "stable"

        topic_mastery.append({
            "topic_id": r.topic_id,
            "name": TOPIC_NAMES.get(r.topic_id, r.topic_id),
            "accuracy": overall,
            "last_5_accuracy": round(l5, 1),
            "estimated_level": r.estimated_level,
            "attempts": r.total_attempts,
            "trend": trend,
        })

    topic_mastery.sort(key=lambda x: x["accuracy"])

    weak = get_weak_topics(db, user.id)
    recs = get_recommendations(db, user.id)

    # Overall trend
    if not topic_mastery:
        overall_trend = "new"
    else:
        improving = sum(1 for t in topic_mastery if t["trend"] == "improving")
        declining = sum(1 for t in topic_mastery if t["trend"] == "declining")
        if improving > declining:
            overall_trend = "improving"
        elif declining > improving:
            overall_trend = "declining"
        else:
            overall_trend = "stable"

    return {
        "topic_mastery": topic_mastery,
        "weak_topics": [w["topic_id"] for w in weak],
        "recommendations": recs,
        "overall_trend": overall_trend,
    }
