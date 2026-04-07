"""Пайдаланушы сессиясы — жауаптарды жинау үшін деректер моделі."""


class UserSession:
    """Сауалнама кезінде пайдаланушының жауаптарын сақтайды.

    FSM state data-да dict ретінде сақталады:
    {
        "answers": [
            {"question_id": "int_1", "option_index": 2, "tags": [...]},
            ...
        ],
        "current_question": 0,
        "current_category": "interests"
    }
    """

    @staticmethod
    def create_empty() -> dict:
        """Жаңа бос сессия жасау."""
        return {
            "answers": [],
            "current_question": 0,
            "current_category": "interests",
        }

    @staticmethod
    def add_answer(session_data: dict, question_id: str, option_index: int, tags: list) -> dict:
        """Жауапты сессияға қосу."""
        session_data["answers"].append({
            "question_id": question_id,
            "option_index": option_index,
            "tags": tags,
        })
        return session_data

    @staticmethod
    def get_all_tags(session_data: dict) -> list:
        """Барлық жауаптардан тегтерді жинау."""
        all_tags = []
        for answer in session_data.get("answers", []):
            all_tags.extend(answer.get("tags", []))
        return all_tags
