from fastapi import APIRouter

router = APIRouter()

TOPICS = [
    {
        "id": "mechanics",
        "label": "Механика",
        "icon": "⚙️",
        "subtopics": [
            {
                "title": "Кинематика",
                "description": "Кинематика — денелердің қозғалысын себептерін зерттемей сипаттайтын механика бөлімі.",
                "formulas": [
                    {"name": "Бірқалыпты қозғалыс", "latex": "v = \\frac{s}{t}", "description": "v — жылдамдық, s — жол, t — уақыт"},
                    {"name": "Үдеу", "latex": "a = \\frac{\\Delta v}{t}", "description": "a — үдеу, Δv — жылдамдық өзгерісі"},
                    {"name": "Жол (бірқалыпты үдемелі)", "latex": "s = v_0 t + \\frac{a t^2}{2}", "description": "v₀ — бастапқы жылдамдық"},
                ],
            },
            {
                "title": "Динамика",
                "description": "Динамика — күштердің денелерге тигізетін әсерін зерттейді.",
                "formulas": [
                    {"name": "Ньютонның 2-ші заңы", "latex": "F = ma", "description": "F — күш (Н), m — масса (кг), a — үдеу (м/с²)"},
                    {"name": "Ауырлық күші", "latex": "F_g = mg", "description": "g = 9.8 м/с²"},
                    {"name": "Импульс", "latex": "p = mv", "description": "p — импульс (кг·м/с)"},
                ],
            },
            {
                "title": "Энергия",
                "description": "Механикалық энергия және оның сақталу заңы.",
                "formulas": [
                    {"name": "Кинетикалық энергия", "latex": "E_k = \\frac{mv^2}{2}", "description": "Қозғалыстағы дене энергиясы"},
                    {"name": "Потенциалдық энергия", "latex": "E_p = mgh", "description": "Биіктіктегі дене энергиясы"},
                    {"name": "Жұмыс", "latex": "A = Fs\\cos\\alpha", "description": "A — жұмыс (Дж)"},
                ],
            },
        ],
    },
    {
        "id": "thermodynamics",
        "label": "Термодинамика",
        "icon": "🌡️",
        "subtopics": [
            {
                "title": "Молекулалық-кинетикалық теория",
                "description": "Газдардың молекулалық-кинетикалық теориясының негізгі ережелері.",
                "formulas": [
                    {"name": "Мұрагер газ қысымы", "latex": "p = nkT", "description": "n — концентрация, k — Больцман тұрақтысы"},
                    {"name": "Газ заңы", "latex": "\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}", "description": "Бірлескен газ заңы"},
                ],
            },
            {
                "title": "Термодинамиканың бірінші бастамасы",
                "description": "Энергия сақталу заңының термодинамикалық формасы.",
                "formulas": [
                    {"name": "Бірінші бастама", "latex": "Q = \\Delta U + A", "description": "Q — жылу, ΔU — ішкі энергия өзгерісі, A — жұмыс"},
                    {"name": "Ішкі энергия", "latex": "U = \\frac{i}{2}\\nu RT", "description": "i — еркіндік дәрежелерінің саны"},
                ],
            },
        ],
    },
    {
        "id": "electromagnetism",
        "label": "Электромагнетизм",
        "icon": "⚡",
        "subtopics": [
            {
                "title": "Электростатика",
                "description": "Тыныштықтағы зарядтардың өзара әсері.",
                "formulas": [
                    {"name": "Кулон заңы", "latex": "F = k\\frac{q_1 q_2}{r^2}", "description": "k = 9·10⁹ Н·м²/Кл²"},
                    {"name": "Электр өрісінің кернеулігі", "latex": "E = \\frac{F}{q}", "description": "E — кернеулік (В/м)"},
                ],
            },
            {
                "title": "Тұрақты ток",
                "description": "Электр тізбегіндегі тұрақты ток заңдары.",
                "formulas": [
                    {"name": "Омның заңы", "latex": "I = \\frac{U}{R}", "description": "I — ток (А), U — кернеу (В), R — кедергі (Ом)"},
                    {"name": "Жоуль-Ленц заңы", "latex": "Q = I^2 R t", "description": "Q — бөлінген жылу (Дж)"},
                    {"name": "Қуат", "latex": "P = UI = I^2R", "description": "P — қуат (Вт)"},
                ],
            },
        ],
    },
    {
        "id": "optics",
        "label": "Оптика",
        "icon": "🔭",
        "subtopics": [
            {
                "title": "Геометриялық оптика",
                "description": "Жарықтың таралуы, шағылуы және сынуы заңдары.",
                "formulas": [
                    {"name": "Сыну заңы", "latex": "n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2", "description": "Снеллиус заңы"},
                    {"name": "Жұқа линза формуласы", "latex": "\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}", "description": "f — фокус қашықтығы"},
                ],
            },
        ],
    },
    {
        "id": "quantum",
        "label": "Кванттық физика",
        "icon": "⚛️",
        "subtopics": [
            {
                "title": "Фотоэффект",
                "description": "Жарықтың металдан электрондарды шығаруы.",
                "formulas": [
                    {"name": "Эйнштейн формуласы", "latex": "h\\nu = A + \\frac{mv^2}{2}", "description": "h — Планк тұрақтысы, A — шығу жұмысы"},
                    {"name": "Де Бройль толқыны", "latex": "\\lambda = \\frac{h}{mv}", "description": "Бөлшектің толқындық ұзындығы"},
                ],
            },
        ],
    },
    {
        "id": "nuclear",
        "label": "Ядролық физика",
        "icon": "☢️",
        "subtopics": [
            {
                "title": "Радиоактивтілік",
                "description": "Ядролардың өздігінен ыдырауы.",
                "formulas": [
                    {"name": "Ыдырау заңы", "latex": "N = N_0 e^{-\\lambda t}", "description": "N₀ — бастапқы ядролар саны"},
                    {"name": "Жарты ыдырау кезеңі", "latex": "T_{1/2} = \\frac{\\ln 2}{\\lambda}", "description": "λ — ыдырау тұрақтысы"},
                    {"name": "Масса-энергия", "latex": "E = \\Delta m c^2", "description": "Масса дефекті мен байланыс энергиясы"},
                ],
            },
        ],
    },
]


@router.get("/topics")
async def get_topics():
    return [{"id": t["id"], "label": t["label"], "icon": t["icon"]} for t in TOPICS]


@router.get("/topics/{topic_id}")
async def get_topic_detail(topic_id: str):
    topic = next((t for t in TOPICS if t["id"] == topic_id), None)
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Тақырып табылмады")
    return topic
