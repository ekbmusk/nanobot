"""FSM күйлері — сауалнаманың кезеңдерін анықтау."""

from aiogram.fsm.state import State, StatesGroup


class SurveyStates(StatesGroup):
    """Сауалнама кезеңдері (FSM).

    Бот сұрақтарды 6 блокта қояды:
    1. Қызығушылықтар (interests) — 5 сұрақ
    2. Күшті жақтар (strengths) — 5 сұрақ
    3. Сүйікті пәндер (subjects) — 5 сұрақ
    4. Құндылықтар мен мотивация (values) — 5 сұрақ
    5. Жұмыс стилі (workstyle) — 5 сұрақ
    6. Цифрлық дағдылар (digital) — 5 сұрақ

    Әр блокта сұрақ нөмірі state data-да сақталады.
    """

    interests = State()
    strengths = State()
    subjects = State()
    values = State()
    workstyle = State()
    digital = State()

    results = State()


class QuestStates(StatesGroup):
    """Мини-квест кезеңдері."""

    active = State()
