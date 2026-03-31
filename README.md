# ⚛️ Нанотехнология негіздері — Telegram Mini App

Telegram Mini App для изучения основ нанотехнологий в курсе физики средних школ. Интерфейс на казахском языке, элективный курс: атом құрылысы, кванттық физика, наноматериалдар, қолданыстар.

Стек: React 18 + Vite + TailwindCSS, FastAPI + SQLAlchemy, aiogram 3, Groq AI (llama-3.3-70b), KaTeX.

---

## Мүмкіндіктер

- ⚛️ Теория — 4 тақырып × 3 подтема × формулалар (LaTeX)
- 🔬 Есептер — 1-ден 6-ға дейін деңгей, қадам-қадам шешім
- 🧠 Тесттер — 10 сұрақ, таймер, күнделікті сынақ (+50 XP бонус)
- 🤖 AI репетитор — қазақ тілінде физика/нанотехнология жауаптары
- 📊 Прогресс — тақырып бойынша үлгерім, streak, XP жүйесі
- 🏆 Рейтинг — апта/ай/жалпы кестелер
- 🏅 Жетістіктер — медальдар мен бейджіктер
- 🔔 Бот хабарландырулары — streak еске салу, мотивация

## Тех стек

| Қабат | Технология |
|-------|-----------|
| Frontend Mini App | React 18, Vite 5, TailwindCSS 3 |
| Telegram SDK | `@twa-dev/sdk` |
| Backend API | FastAPI, SQLAlchemy 2, Pydantic 2 |
| Database | SQLite (PostgreSQL-compatible) |
| Telegram Bot | aiogram 3 |
| AI | Groq (llama-3.3-70b) |
| Формулалар | KaTeX |
| Deploy | Docker Compose, Cloudflare Pages, Render, Railway |

## Тақырыптар

| ID | Тақырып (каз.) | Сипаттама |
|----|----------------|-----------|
| `atomic_structure` | Атом құрылысы | Бор моделі, де Бройль, Гейзенберг |
| `quantum_basics` | Кванттық физика негіздері | Шрёдингер, фотоэффект, туннельдік эффект |
| `nanomaterials` | Наноматериалдар | Фуллерен, графен, нанотүтіктер, S/V қатынасы |
| `nano_applications` | Нанотехнология қолданыстары | Наноботтар, кванттық нүктелер, күн батареялары |

## Жүргізу

### Backend (API docs: localhost:8000/docs)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (Vite dev server :3000)

```bash
cd frontend
npm install && npm run dev
```

### Bot

```bash
cd bot
pip install -r requirements.txt
python main.py
```

### Admin panel (:5174)

```bash
cd admin
npm install && npm run dev
```

### Docker (барлық сервистер)

```bash
docker-compose up --build
```

## Ортаның айнымалылары (.env)

```env
BOT_TOKEN=
TELEGRAM_BOT_TOKEN=
MINI_APP_URL=https://your-miniapp-url
GROQ_API_KEY=
BACKEND_URL=http://localhost:8000
DATABASE_URL=sqlite:///./physics_nanotechnology_bot.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
JWT_SECRET_KEY=change_me_super_secret
ADMIN_TELEGRAM_IDS=123456789
VITE_API_URL=/api
```

## API негізгі endpoint-тары

| Метод | Endpoint | Мақсат |
|-------|----------|--------|
| GET | `/api/theory/topics` | 4 физика тақырыбы |
| GET | `/api/theory/topics/{id}` | Тақырып контенті |
| GET | `/api/problems` | Есептер (difficulty, topic фильтрі) |
| POST | `/api/problems/{id}/check` | Жауап тексеру |
| GET | `/api/tests/random` | Кездейсоқ тест |
| POST | `/api/tests/submit` | Тест нәтижесін сақтау |
| GET | `/api/progress/{telegram_id}` | Оқушы прогресі |
| GET | `/api/rating/leaderboard` | Рейтинг кестесі |
| POST | `/api/ai/ask` | AI репетиторға сұрақ |

## Проблемалар шешу

| Мәселе | Шешім |
|--------|-------|
| Бот жауап бермейді | `BOT_TOKEN` тексеру, бір ғана polling процесс |
| Mini App ашылмайды | `MINI_APP_URL` HTTPS болуы керек |
| AI қатесі | `GROQ_API_KEY` тексеру |
| CORS қатесі | Backend CORS origin-ды жаңарту |

## Деплой

- **Frontend** — Cloudflare Pages (`npm run pages:deploy`) немесе Vercel
- **Backend** — Render (render.yaml конфигурациясы бар)
- **Bot** — Railway (railway.json конфигурациясы бар)

## Лицензия

MIT
