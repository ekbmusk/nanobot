# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Жоба туралы

Telegram-бот «Кім боламын?» — 7-8 сынып оқушыларына кәсіби бағдар беретін бот (aiogram 3 + Python).
30 сұрақ (6 блок × 5) → тег жинау → ТОП-5 мамандық ұсыну (25+ мамандықтан) + ҰБТ пәндері + ҚР ЖОО-лар (17).
Екі UI режимі: inline-бот (Telegram callback) және Telegram Mini App (webapp).

## Іске қосу

```bash
cd bot
pip install -r requirements.txt   # aiogram>=3.7.0, python-dotenv>=1.0.0, aiohttp>=3.9.0
# .env файлында BOT_TOKEN=... болуы керек (жоба корінде, bot/ емес)
python main.py                     # long-polling + Mini App веб-сервер (порт 8080)
```

Тәуелділіктер: `aiogram>=3.7.0`, `python-dotenv>=1.0.0`, `aiohttp>=3.9.0`. Python 3.10+.

### .env айнымалылары

- `BOT_TOKEN` (міндетті) — Telegram bot token
- `WEBAPP_URL` (опционал) — Mini App URL (мысалы ngrok). Орнатылмаса Mini App батырмасы көрсетілмейді, тек inline режим жұмыс істейді
- `WEBAPP_HOST` (әдепкі: `0.0.0.0`) — веб-сервер хосты
- `WEBAPP_PORT` (әдепкі: `8080`) — веб-сервер порты

`.env` файлы `bot/` емес, жоба корінде іздестіріледі (`config.py`: `Path(__file__).resolve().parent.parent / ".env"`).

## Архитектура

### Екі UI режимі

1. **Inline-бот** — Telegram callback батырмалары арқылы сұрақ-жауап (FSM). `handlers/survey.py` басқарады.
2. **Mini App** — Telegram WebApp ретінде ашылатын HTML/JS қосымша (`bot/webapp/`). Нәтижелерді `web_app_data` арқылы ботқа жібереді, `handlers/webapp.py` өңдейді.

Mini App деректерді `main.py`-дағы aiohttp серверден алады: `/api/questions`, `/api/professions`, `/api/universities`.

### FSM state flow

```
/start → (clear state)
  → callback "start_survey"
  → SurveyStates.interests  (5 сұрақ)
  → SurveyStates.strengths   (5 сұрақ)
  → SurveyStates.subjects    (5 сұрақ)
  → SurveyStates.values      (5 сұрақ)
  → SurveyStates.workstyle   (5 сұрақ)
  → SurveyStates.digital     (5 сұрақ)
  → SurveyStates.results     (талдау + нәтиже)
```

Блоктар `CATEGORY_ORDER` тізімімен (`survey.py`) анықталады — `questions.json`-дағы categories ретімен. Callback format: `answer_{category_id}_{option_index}`. Блок аяқталғанда `current_category` жаңартылып, `current_question` 0-ге қайтады.

### Тег жинау + сәйкестендіру алгоритмі

1. Әр жауаптың options-ында 2-3 тег бар (`questions.json`-да анықталған)
2. **Inline режим:** 30 жауаптан тегтер жиналады → `Counter`-мен жиілік есептеледі (`analyzer.py:calculate_tag_scores`)
3. **Mini App режим:** салмақталған скоринг (`analyzer.py:calculate_weighted_tag_scores`) — `question.weight` × тегтер. Тегтер клиент деректеріне сенбей, `questions.json`-нан сервер жағында реконструкцияланады (`webapp.py:_reconstruct_tags`)
4. Әр мамандықтың тегтерімен салыстырылады: `score = sum(tag_scores[tag] for tag in profession.tags)` (`matcher.py`)
5. ТОП-5 мамандық score бойынша сұрыпталады, әрқайсысына universities қосылады (`profession_university_map` арқылы)
6. Нәтиже HTML format-та `last_results`-ке cache-теледі (қайта көру үшін)

### Anti-cheat жүйесі (тек Mini App)

`services/anticheat.py` — Mini App-тан келген жауаптардың сенімділігін тексереді:
- Straight-line detection (≥4 қатарынан бірдей жауап)
- Speed checks (тым жылдам жауаптар, <2с)
- Low variance (тегтер әртүрлілігі)
- Pattern cycling detection (қайталанатын паттерн)

Нәтиже: confidence пайызы (0-100%), нәтиже хабарламасының басында көрсетіледі.

### Деректер ағыны

```
handlers/survey.py   →  services/analyzer.py (тег скорлау — Counter)
                     →  services/matcher.py  (мамандық сәйкестендіру + формат)

handlers/webapp.py   →  services/analyzer.py (салмақталған скорлау)
                     →  services/anticheat.py (сенімділік тексеру)
                     →  services/matcher.py   (мамандық сәйкестендіру + формат)
```

- `data/questions.json` — import кезінде бір рет жүктеледі, runtime-да өзгермейді. 6 блок × 5 сұрақ, әр сұрақтың `weight` өрісі бар.
- `data/professions.json` — 25+ мамандық (id, tags, salary_range, demand, ent_subjects, field, emoji)
- `data/universities.json` — 17 ЖОО + `profession_university_map` (many-to-many: profession_id → [uni_id])

### Session model

FSM state context = user session (MemoryStorage, persistent емес — бот restart-та жоғалады):
```python
{
    "answers": [{"question_id", "option_index", "tags"}, ...],
    "current_question": 0,        # блок ішіндегі индекс (0-4)
    "current_category": "interests",
    "last_results": "<html>",     # cache — қайта көру үшін
    "tag_scores": {...}
}
```

### Handler тіркелу реті (main.py)

`start → survey → webapp → results → info`. Реті маңызды: CommandStart() бірінші match болуы керек. `webapp` роутері `survey`-дан кейін, бірақ `results`-тен бұрын тіркелуі керек (F.web_app_data фильтрі).

## Конвенциялар

- Бот UI тілі: қазақша
- HTML parse mode (main.py-да DefaultBotProperties)
- Блок ішіндегі сұрақтар: блок ауысуда `edit_text()` (прогресс хабарламасы), сұрақ `answer()` (жаңа хабарлама); блок ішінде сұрақтар `edit_text()` арқылы жаңартылады
- Нәтижеде университеттер максимум 3 көрсетіледі (қалғаны кесіледі)
- Demand деңгейлері (өте жоғары, жоғары, орташа) — тек ақпараттық, scoring-де қолданылмайды
- Mini App-тан келген тегтерге сенбеу — `_reconstruct_tags()` арқылы сервер жағында қайта құру
