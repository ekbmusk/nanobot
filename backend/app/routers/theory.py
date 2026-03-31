import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.admin_test import AdminTestQuestion
from app.models.progress import Progress as ProgressModel
from app.models.user import User
from app.services.analytics_service import update_topic_mastery
from app.services.progress_service import update_streak

TOPIC_NAMES = {
    "atomic_structure": "Атом құрылысы",
    "quantum_basics": "Кванттық физика негіздері",
    "nanomaterials": "Наноматериалдар",
    "nano_applications": "Нанотехнология қолданыстары",
}

router = APIRouter()


# --- Quiz schemas ---

class QuizAnswerItem(BaseModel):
    question_id: int
    answer: int  # 0-3 index


class QuizSubmit(BaseModel):
    telegram_id: int
    topic_id: str
    answers: list[QuizAnswerItem]
    check_only: bool = False  # If True, only check answers without awarding XP

TOPICS = [
    {
        "id": "atomic_structure",
        "label": "Атом құрылысы",
        "icon": "⚛️",
        "subtopics": [
            {
                "title": "Атом моделі және құрылымы",
                "description": "Атомның құрылысы, Бор моделі, ядро мен электрондар, атом нөмірі мен массалық сан.",
                "formulas": [
                    {"name": "Бор моделіндегі энергия", "latex": "E_n = -\\frac{13{,}6}{n^2} \\text{ эВ}", "description": "n — бас кванттық сан, сутегі атомы үшін"},
                    {"name": "Орбита радиусы", "latex": "r_n = n^2 \\cdot a_0 = n^2 \\cdot 0{,}053 \\text{ нм}", "description": "a₀ — Бор радиусы (0,053 нм)"},
                    {"name": "Массалық сан", "latex": "A = Z + N", "description": "Z — протон саны, N — нейтрон саны"},
                ],
            },
            {
                "title": "Наномасштаб және өлшемдер",
                "description": "Нанометр ұғымы, нано-өлшемдер мен макроәлемді салыстыру, масштабтау принциптері.",
                "formulas": [
                    {"name": "Нанометр", "latex": "1 \\text{ нм} = 10^{-9} \\text{ м}", "description": "Нано-масштаб: атомдар мен молекулалар деңгейі"},
                    {"name": "Бет ауданы/көлем қатынасы", "latex": "\\frac{S}{V} = \\frac{6}{d}", "description": "d — бөлшек диаметрі; кішірейген сайын қатынас артады"},
                    {"name": "Бөлшек саны", "latex": "N = \\frac{m}{M} \\cdot N_A", "description": "m — масса, M — молярлық масса, Nₐ — Авогадро саны"},
                ],
            },
            {
                "title": "Электрон конфигурациясы",
                "description": "Кванттық сандар, Паули принципі, Хунд ережесі, электрондық қабаттар.",
                "formulas": [
                    {"name": "Кванттық сандар", "latex": "n, l, m_l, m_s", "description": "n — бас, l — орбиталық, mₗ — магниттік, mₛ — спин"},
                    {"name": "Қабаттағы электрон саны", "latex": "N_{max} = 2n^2", "description": "n-ші қабатта ең көп 2n² электрон болады"},
                    {"name": "Де Бройль толқын ұзындығы", "latex": "\\lambda = \\frac{h}{mv}", "description": "h — Планк тұрақтысы, m — масса, v — жылдамдық"},
                ],
            },
            {
                "title": "Изотоптар мен радиоактивтілік",
                "description": "Изотоптар ұғымы, ядролық ыдырау, жартылай ыдырау периоды, радиоактивті сәулелену түрлері.",
                "formulas": [
                    {"name": "Радиоактивті ыдырау заңы", "latex": "N(t) = N_0 \\cdot e^{-\\lambda t}", "description": "N₀ — бастапқы сан, λ — ыдырау тұрақтысы"},
                    {"name": "Жартылай ыдырау периоды", "latex": "T_{1/2} = \\frac{\\ln 2}{\\lambda}", "description": "Ядролардың жартысы ыдырайтын уақыт"},
                    {"name": "Масса-энергия эквиваленттілігі", "latex": "E = mc^2", "description": "Эйнштейн формуласы: масса дефектінен бөлінетін энергия"},
                ],
            },
            {
                "title": "Спектрлер мен сәулелену",
                "description": "Атомдық спектрлер, Бальмер мен Лайман сериялары, спектр анализі, сәулелену мен жұту.",
                "formulas": [
                    {"name": "Бальмер сериясы", "latex": "\\frac{1}{\\lambda} = R_H \\left(\\frac{1}{2^2} - \\frac{1}{n^2}\\right)", "description": "RH — Ридберг тұрақтысы, n ≥ 3, көрінетін спектр"},
                    {"name": "Ридберг формуласы", "latex": "\\frac{1}{\\lambda} = R_H \\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)", "description": "Кез келген серия үшін жалпы формула"},
                    {"name": "Ридберг тұрақтысы", "latex": "R_H = 1{,}097 \\times 10^7 \\text{ м}^{-1}", "description": "Сутегі атомының спектрлік тұрақтысы"},
                ],
            },
            {
                "title": "Периодтық жүйе және атом қасиеттері",
                "description": "Менделеев кестесіндегі заңдылықтар, электртерістілік, атом радиусы, иондану энергиясы.",
                "formulas": [
                    {"name": "Иондану энергиясы", "latex": "E_i = -E_n = \\frac{13{,}6 \\cdot Z^2}{n^2} \\text{ эВ}", "description": "Z — ядро заряды, n — электрон қабаты"},
                    {"name": "Атом радиусы тренді", "latex": "r \\propto \\frac{n^2}{Z_{\\text{eff}}}", "description": "Периодта солдан оңға радиус кемиді, топта жоғарыдан төмен артады"},
                    {"name": "Электртерістілік (Малликен)", "latex": "\\chi = \\frac{E_i + E_a}{2}", "description": "Ei — иондану энергиясы, Ea — электронға тартылу энергиясы"},
                ],
            },
        ],
    },
    {
        "id": "quantum_basics",
        "label": "Кванттық физика негіздері",
        "icon": "〰️",
        "subtopics": [
            {
                "title": "Толқындық-бөлшектік дуализм",
                "description": "Жарық пен бөлшектердің қос табиғаты, фотоэлектрлік эффект, Комптон шашырауы.",
                "formulas": [
                    {"name": "Фотон энергиясы", "latex": "E = h\\nu = \\frac{hc}{\\lambda}", "description": "h — Планк тұрақтысы, ν — жиілік, λ — толқын ұзындығы"},
                    {"name": "Фотоэффект теңдеуі", "latex": "E_k = h\\nu - A", "description": "Eₖ — электрон кинетикалық энергиясы, A — шығу жұмысы"},
                    {"name": "Комптон шашырауы", "latex": "\\Delta\\lambda = \\frac{h}{m_e c}(1 - \\cos\\theta)", "description": "Рентген сәулесінің электронда шашырауы"},
                ],
            },
            {
                "title": "Гейзенберг анықсыздық принципі",
                "description": "Координата мен импульсті бір уақытта дәл анықтау мүмкін еместігі, кванттық шектеулер.",
                "formulas": [
                    {"name": "Анықсыздық принципі", "latex": "\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}", "description": "Δx — координата анықсыздығы, Δp — импульс анықсыздығы"},
                    {"name": "Энергия-уақыт анықсыздығы", "latex": "\\Delta E \\cdot \\Delta t \\geq \\frac{\\hbar}{2}", "description": "Энергия мен уақыттың бір мезгілде дәл өлшенбеуі"},
                    {"name": "Планк тұрақтысы", "latex": "\\hbar = \\frac{h}{2\\pi} = 1{,}055 \\times 10^{-34} \\text{ Дж·с}", "description": "Редукцияланған Планк тұрақтысы"},
                ],
            },
            {
                "title": "Туннельдік эффект",
                "description": "Бөлшектің потенциалдық тосқауылдан өтуі, сканерлеуші туннельдік микроскоп.",
                "formulas": [
                    {"name": "Туннельдеу ықтималдығы", "latex": "T \\approx e^{-2\\kappa d}", "description": "κ — толқын векторы, d — тосқауыл ені"},
                    {"name": "Толқын векторы", "latex": "\\kappa = \\frac{\\sqrt{2m(U_0 - E)}}{\\hbar}", "description": "U₀ — тосқауыл биіктігі, E — бөлшек энергиясы"},
                    {"name": "СТМ токтың тәуелділігі", "latex": "I \\propto e^{-2\\kappa d}", "description": "Ток қашықтыққа экспоненциалды тәуелді"},
                ],
            },
            {
                "title": "Шрёдингер теңдеуі",
                "description": "Толқындық функция, стационар күйлер, кванттық жүйелердің математикалық сипаттамасы.",
                "formulas": [
                    {"name": "Уақытқа тәуелді Шрёдингер теңдеуі", "latex": "i\\hbar \\frac{\\partial \\Psi}{\\partial t} = \\hat{H}\\Psi", "description": "Ψ — толқындық функция, Ĥ — Гамильтониан операторы"},
                    {"name": "Стационар теңдеу", "latex": "\\hat{H}\\psi = E\\psi", "description": "Уақытқа тәуелсіз күйлер үшін меншікті мән есебі"},
                    {"name": "Ықтималдық тығыздығы", "latex": "|\\Psi(x,t)|^2 dx", "description": "Бөлшектің x нүктесінде табылу ықтималдығы"},
                ],
            },
            {
                "title": "Кванттық суперпозиция мен өлшеу",
                "description": "Суперпозиция принципі, толқындық функция коллапсы, Шрёдингер мысығы, кванттық декогеренция.",
                "formulas": [
                    {"name": "Суперпозиция", "latex": "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle", "description": "α, β — амплитудалар, |α|² + |β|² = 1"},
                    {"name": "Өлшеу ықтималдығы", "latex": "P(0) = |\\alpha|^2, \\quad P(1) = |\\beta|^2", "description": "Өлшеу кезінде жүйе бір күйге коллапстайды"},
                    {"name": "Декогеренция уақыты", "latex": "T_2 \\sim \\frac{\\hbar}{k_B T} \\cdot Q", "description": "Q — сапа факторы, T — температура; суытқан сайын декогеренция баяулайды"},
                ],
            },
            {
                "title": "Спин және магнитті қасиеттер",
                "description": "Электрон спині, Паули ерекшелігі, ферромагнетизм, спинтроника негіздері.",
                "formulas": [
                    {"name": "Спин мөлшері", "latex": "S = \\frac{1}{2}, \\quad m_s = \\pm\\frac{1}{2}", "description": "Электронның спин кванттық саны тек ±½ болады"},
                    {"name": "Магнитті момент", "latex": "\\mu = -g_s \\mu_B S", "description": "gs ≈ 2 — спин g-факторы, μB — Бор магнетоны"},
                    {"name": "Зееман эффектісі", "latex": "\\Delta E = g_s \\mu_B B \\cdot m_s", "description": "Магнит өрісінде энергия деңгейлерінің жарылуы"},
                ],
            },
        ],
    },
    {
        "id": "nanomaterials",
        "label": "Наноматериалдар",
        "icon": "🔬",
        "subtopics": [
            {
                "title": "Көміртекті наноқұрылымдар",
                "description": "Фуллерендер (C₆₀), көміртекті нанотүтіктер, графен — құрылысы мен қасиеттері.",
                "formulas": [
                    {"name": "Фуллерен C₆₀", "latex": "C_{60}: d \\approx 0{,}71 \\text{ нм}", "description": "60 көміртек атомынан тұратын сфералық молекула"},
                    {"name": "Графен электрондық дисперсиясы", "latex": "E(k) = \\pm \\hbar v_F |k|", "description": "vF — Ферми жылдамдығы, k — толқын векторы"},
                    {"name": "Нанотүтік диаметрі", "latex": "d = \\frac{a}{\\pi}\\sqrt{n^2 + nm + m^2}", "description": "a = 0,246 нм; (n,m) — хиральдік индекстер"},
                ],
            },
            {
                "title": "Наночастиктер қасиеттері",
                "description": "Беттік эффект, кванттық шектелу, наночастиктердің оптикалық, магниттік, механикалық қасиеттері.",
                "formulas": [
                    {"name": "Беттік атомдар үлесі", "latex": "f = \\frac{N_{\\text{бет}}}{N_{\\text{жалпы}}} \\approx \\frac{4}{d/d_0}", "description": "d — бөлшек диаметрі, d₀ — атом диаметрі"},
                    {"name": "Кванттық нүкте энергиясы", "latex": "E_g = E_{g,0} + \\frac{\\hbar^2 \\pi^2}{2\\mu R^2}", "description": "R — нүкте радиусы, μ — келтірілген масса"},
                    {"name": "Балқу температурасының төмендеуі", "latex": "T_m = T_{m,0}\\left(1 - \\frac{\\alpha}{d}\\right)", "description": "Нанобөлшек кішірейген сайын балқу температурасы түседі"},
                ],
            },
            {
                "title": "Нанобөлшектерді синтездеу",
                "description": "Жоғарыдан-төмен (top-down) және төменнен-жоғары (bottom-up) тәсілдер, химиялық және физикалық әдістер.",
                "formulas": [
                    {"name": "Нуклеация жылдамдығы", "latex": "J = A \\exp\\left(-\\frac{\\Delta G^*}{k_B T}\\right)", "description": "ΔG* — критикалық нуклеация энергиясы"},
                    {"name": "Критикалық радиус", "latex": "r^* = \\frac{2\\gamma V_m}{k_B T \\ln S}", "description": "γ — беттік энергия, S — аса қанығу дәрежесі"},
                    {"name": "Оствальд пісу", "latex": "\\bar{r}^3 - \\bar{r}_0^3 = Kt", "description": "Уақыт өткен сайын үлкен бөлшектер өседі, кішілері еріді"},
                ],
            },
            {
                "title": "Нанокомпозиттер мен жабындар",
                "description": "Наноқұрылымдық композиттер, наножабындар, беткі модификация, өзін-өзі тазартатын беттер.",
                "formulas": [
                    {"name": "Холл-Петч заңы", "latex": "\\sigma_y = \\sigma_0 + \\frac{k}{\\sqrt{d}}", "description": "Түйір мөлшері кішірейген сайын материал берігірек болады"},
                    {"name": "Юнг модулі (композит)", "latex": "E_c = E_f V_f + E_m V_m", "description": "Аралас ереже: Ef, Em — толтырғыш/матрица модульдері, Vf, Vm — көлемдік үлестер"},
                    {"name": "Контакт бұрышы", "latex": "\\cos\\theta = \\frac{\\gamma_{SG} - \\gamma_{SL}}{\\gamma_{LG}}", "description": "Юнг теңдеуі: нанобетке тамшы бұрышы, гидрофобтылық"},
                ],
            },
            {
                "title": "Наносымдар мен нанопленкалар",
                "description": "Алтын, күміс наночастиктер, наносымдар синтезі, CVD, тұндыру әдістері, жұқа плёнкалар.",
                "formulas": [
                    {"name": "Плазмондық резонанс", "latex": "\\lambda_{SPR} \\propto d \\cdot \\sqrt{\\varepsilon_m}", "description": "d — наночастик мөлшері, εm — орта диэлектрлік тұрақтысы"},
                    {"name": "CVD тұндыру жылдамдығы", "latex": "R = R_0 \\exp\\left(-\\frac{E_a}{k_B T}\\right)", "description": "Ea — активация энергиясы, T — субстрат температурасы"},
                    {"name": "Пленка қалыңдығы", "latex": "d = R \\cdot t", "description": "R — тұндыру жылдамдығы, t — уақыт"},
                ],
            },
            {
                "title": "Наноматериалдарды сипаттау әдістері",
                "description": "ТЕМ, СЕМ, АСМ, рентген дифракциясы (XRD), динамикалық жарық шашырауы (DLS).",
                "formulas": [
                    {"name": "Брэгг заңы (XRD)", "latex": "2d\\sin\\theta = n\\lambda", "description": "d — кристалл жазықтықтар арасы, θ — дифракция бұрышы"},
                    {"name": "ТЕМ ажыратымдылығы", "latex": "\\delta = \\frac{0{,}61\\lambda}{\\mu\\sin\\alpha}", "description": "λ — электрон толқын ұзындығы, ажыратымдылық < 0,1 нм"},
                    {"name": "DLS гидродинамикалық радиус", "latex": "R_h = \\frac{k_B T}{6\\pi\\eta D}", "description": "D — диффузия коэффициенті, η — тұтқырлық"},
                ],
            },
        ],
    },
    {
        "id": "nano_applications",
        "label": "Нанотехнология қолданыстары",
        "icon": "💡",
        "subtopics": [
            {
                "title": "Наномедицина",
                "description": "Дәрі жеткізу жүйелері, наноботтар, диагностика, наносенсорлар медицинада.",
                "formulas": [
                    {"name": "Дәрі босату кинетикасы", "latex": "\\frac{M_t}{M_{\\infty}} = kt^n", "description": "Korsmeyer-Peppas моделі: k — жылдамдық тұрақтысы, n — босату механизмі"},
                    {"name": "EPR эффекті", "latex": "d_{\\text{нано}} < d_{\\text{тесік}} \\approx 100{-}400 \\text{ нм}", "description": "Ісіктегі тамыр тесіктері арқылы наночастиктер жиналады"},
                    {"name": "Гипертермия қуаты", "latex": "P = \\mu_0 \\pi \\chi'' f H^2", "description": "Магнитті наночастиктермен ісікті қыздыру"},
                ],
            },
            {
                "title": "Наноэлектроника",
                "description": "Кванттық нүктелер, нанотранзисторлар, жартылай өткізгіш наноқұрылымдар, жад құрылғылары.",
                "formulas": [
                    {"name": "Мур заңы", "latex": "N(t) = N_0 \\cdot 2^{t/T}", "description": "Транзисторлар саны әр 2 жылда екі есе артады"},
                    {"name": "Кулон блокадасы", "latex": "E_C = \\frac{e^2}{2C}", "description": "Бір электронды транзистор жұмысының негізі"},
                    {"name": "Кванттық нүкте спектрі", "latex": "\\lambda_{\\text{эмиссия}} \\propto R^2", "description": "Нүкте мөлшері артқан сайын сәуле ұзарады (қызыл жаққа ығысу)"},
                ],
            },
            {
                "title": "Энергетика және қоршаған орта",
                "description": "Күн батареялары, нанокатализаторлар, сутегі энергетикасы, суды тазарту нанотехнологиялары.",
                "formulas": [
                    {"name": "Күн элементінің ПӘК", "latex": "\\eta = \\frac{P_{\\text{шығыс}}}{P_{\\text{кіріс}}} \\times 100\\%", "description": "Жарық энергиясын электр энергиясына айналдыру тиімділігі"},
                    {"name": "Катализатор белсенділігі", "latex": "TOF = \\frac{n_{\\text{өнім}}}{n_{\\text{кат}} \\cdot t}", "description": "Уақыт бірлігінде бір катализатор центрі өңдейтін молекула саны"},
                    {"name": "Фотокатализ", "latex": "E_{\\text{фотон}} \\geq E_g", "description": "Фотон энергиясы тыйым салынған аймақ енінен көп болуы керек"},
                ],
            },
            {
                "title": "Нанобиотехнология мен қауіпсіздік",
                "description": "Нанотоксикология, наноэтика, қоршаған ортаға әсер, наноматериалдар қауіпсіздік стандарттары.",
                "formulas": [
                    {"name": "Экспозиция дозасы", "latex": "D = C \\times t", "description": "C — наночастиктер концентрациясы, t — әсер ету уақыты"},
                    {"name": "LD₅₀ дозасы", "latex": "LD_{50} = \\frac{m_{\\text{зат}}}{m_{\\text{дене}}}", "description": "Организмдердің 50%-ына летальді доза (мг/кг)"},
                    {"name": "Беттік заряд", "latex": "\\zeta = \\frac{4\\pi \\eta \\mu_e}{\\varepsilon}", "description": "Дзета-потенциал: наночастиктер тұрақтылығының көрсеткіші"},
                ],
            },
            {
                "title": "Нанотехнология Қазақстанда",
                "description": "Назарбаев Университетінің наноматериалдар зертханасы, қазақстандық минералдар мен нанотехнология, ННТЛ жобалары.",
                "formulas": [
                    {"name": "Қазақстан кремний ресурсы", "latex": "\\text{SiO}_2 \\xrightarrow{\\text{тазарту}} \\text{Si}_{\\text{нано}}", "description": "ҚР кремний шикізатынан нанокремний алу — күн батареялары үшін"},
                    {"name": "Нано-TiO₂ фотокатализі", "latex": "\\text{TiO}_2 + h\\nu \\to e^- + h^+", "description": "Қазақстанда ауа мен суды тазарту үшін зерттелуде"},
                    {"name": "Наносорбент сыйымдылығы", "latex": "q = \\frac{(C_0 - C_e) V}{m}", "description": "ҚР ғалымдары суды тазартуда көміртекті наносорбенттер жасауда"},
                ],
            },
            {
                "title": "Нанороботтар мен болашақ",
                "description": "Молекулалық машиналар, self-assembly, Дрекслер болжамдары, нанотехнологияның этикалық мәселелері.",
                "formulas": [
                    {"name": "Self-assembly шарты", "latex": "\\Delta G = \\Delta H - T\\Delta S < 0", "description": "Өздігінен жиналу тек Гиббс энергиясы теріс болғанда жүреді"},
                    {"name": "Молекулалық мотор тиімділігі", "latex": "\\eta = \\frac{W_{\\text{мех}}}{\\Delta G_{\\text{АТФ}}}", "description": "Биологиялық моторлар тиімділігі 50-100% аралығында"},
                    {"name": "Наноробот жылдамдығы", "latex": "v = \\frac{F}{6\\pi\\eta r}", "description": "Стокс заңы: r — робот радиусы, η — орта тұтқырлығы, F — қозғалтқыш күші"},
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
        raise HTTPException(status_code=404, detail="Тақырып табылмады")
    return topic


OPTION_TO_IDX = {"A": 0, "B": 1, "C": 2, "D": 3}


@router.get("/topics/{topic_id}/quiz")
async def get_topic_quiz(topic_id: str, count: int = 5, db: Session = Depends(get_db)):
    """Get 3-5 MCQ questions for a theory topic mini-test."""
    if not any(t["id"] == topic_id for t in TOPICS):
        raise HTTPException(status_code=404, detail="Тақырып табылмады")

    questions = db.query(AdminTestQuestion).filter(AdminTestQuestion.topic == topic_id).all()

    # Fallback: if not enough topic-specific questions, include from other topics
    if len(questions) < 3:
        other = db.query(AdminTestQuestion).filter(
            AdminTestQuestion.topic != topic_id
        ).all()
        questions.extend(other)

    if not questions:
        return {"questions": [], "topic_id": topic_id}

    selected = random.sample(questions, min(count, len(questions)))
    return {
        "topic_id": topic_id,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "options": [q.option_a, q.option_b, q.option_c, q.option_d],
                "explanation": q.explanation,
                "image_url": q.image_url,
                "table_data": q.table_data,
            }
            for q in selected
        ],
    }


@router.post("/quiz/submit")
async def submit_quiz(body: QuizSubmit, db: Session = Depends(get_db)):
    """Submit mini-test answers, update mastery, award XP."""
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")

    question_ids = [a.question_id for a in body.answers]
    db_questions = db.query(AdminTestQuestion).filter(AdminTestQuestion.id.in_(question_ids)).all()
    question_map = {q.id: q for q in db_questions}

    correct = 0
    total = len(body.answers)
    results = []
    topic_results: dict[str, list[bool]] = {}

    for item in body.answers:
        q = question_map.get(item.question_id)
        if not q:
            continue
        correct_idx = OPTION_TO_IDX.get(q.correct_option, 0)
        is_correct = item.answer == correct_idx
        if is_correct:
            correct += 1

        results.append({
            "question_id": item.question_id,
            "correct": is_correct,
            "correct_answer": correct_idx,
            "explanation": q.explanation,
        })

        topic_key = q.topic if q.topic in [t["id"] for t in TOPICS] else body.topic_id
        topic_results.setdefault(topic_key, []).append(is_correct)

    percentage = round((correct / total * 100) if total > 0 else 0, 1)

    quiz_xp = 0
    if not body.check_only:
        # Award XP (15 per mini-quiz)
        quiz_xp = 15
        user.score = (user.score or 0) + quiz_xp

        update_streak(db, user)

        # Update topic mastery
        if topic_results:
            update_topic_mastery(db, user.id, topic_results)

        # Update Progress table so progress page reflects mini-test results
        progress_rec = (
            db.query(ProgressModel)
            .filter(ProgressModel.user_id == user.id, ProgressModel.topic_id == body.topic_id)
            .first()
        )
        if progress_rec:
            progress_rec.completion_percent = min(100.0, max(progress_rec.completion_percent, percentage))
            progress_rec.problems_solved += total
            progress_rec.last_updated = datetime.now(timezone.utc)
        else:
            db.add(ProgressModel(
                user_id=user.id,
                topic_id=body.topic_id,
                topic_name=TOPIC_NAMES.get(body.topic_id, body.topic_id),
                completion_percent=percentage,
                problems_solved=total,
            ))

        db.commit()

    return {
        "correct": correct,
        "total": total,
        "percentage": percentage,
        "xp_earned": quiz_xp,
        "results": results,
    }
