# ⚛️ Physics Bot — Telegram Mini App for Learning Physics

Physics Bot is a Telegram Mini App designed for school-level physics learning. The user-facing experience is in Kazakh, while the engineering workflow and docs are in English.

It combines a React web app, a FastAPI backend, a Telegram bot (aiogram), and optional AI tutoring through OpenAI.

## Table of Contents

- [Project Goals](#project-goals)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Run Modes](#run-modes)
- [Telegram Setup](#telegram-setup)
- [API Overview](#api-overview)
- [Admin Panel](#admin-panel)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Roadmap Ideas](#roadmap-ideas)
- [License](#license)

---

## Project Goals

- Make physics content accessible in Kazakh.
- Provide theory, practice, and testing in one flow.
- Track learning progress and motivation via streak/rating.
- Offer AI-assisted explanations with math formulas.

## Tech Stack

| Layer | Technology |
|------|------------|
| Frontend Mini App | React 18, Vite, TailwindCSS |
| Telegram WebApp SDK | `@twa-dev/sdk` |
| Backend API | FastAPI, Pydantic |
| Database | SQLite, SQLAlchemy |
| Telegram Bot | aiogram 3 |
| AI Integration | OpenAI GPT-4o (proxy through backend) |
| Formula Rendering | KaTeX |
| Deployment | Docker Compose |

## Core Features

- 📘 Theory topics by section (mechanics, thermodynamics, electromagnetism, optics, quantum, nuclear).
- 🧮 Problems by difficulty (`easy`, `medium`, `hard`).
- 🧠 Randomized tests with instant scoring.
- 📊 Progress tracking (scores, solved tasks, streak).
- 🏆 Leaderboard/rating views.
- ❓ AI tutor chat in Kazakh with LaTeX-friendly output.
- 🔔 Bot-side engagement utilities (commands, reminders/notifications).

## System Architecture

End-to-end flow:

1. User opens Telegram bot and launches Mini App.
2. Frontend reads Telegram WebApp context and calls backend APIs.
3. Backend validates requests, reads/writes database, and returns content/results.
4. AI requests are proxied through backend service (OpenAI key stays server-side).
5. Bot handlers provide command UX and messaging outside Mini App screens.

## Project Structure

```text
physics-bot/
├── frontend/            # Telegram Mini App (React)
├── backend/             # FastAPI application
│   └── app/
│       ├── routers/     # API route modules
│       ├── models/      # SQLAlchemy models
│       ├── schemas/     # Pydantic schemas
│       ├── services/    # AI/progress/business logic
│       └── database/    # DB engine/session/init
├── bot/                 # aiogram bot
│   ├── handlers/        # Command/message handlers
│   └── keyboards/       # Reply/inline keyboards
├── admin/               # Admin web interface
└── docker-compose.yml   # Multi-service local/prod orchestration
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Telegram bot token from [@BotFather](https://t.me/BotFather)

### 1) Configure environment

```bash
cp .env.example .env
```

Fill required variables in `.env` (see [Environment Variables](#environment-variables)).

### 2) Start backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open docs at `http://localhost:8000/docs`.

### 3) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Default local URL is usually `http://localhost:5173` (or as configured by Vite).

### 4) Start bot

```bash
cd bot
pip install -r requirements.txt
python main.py
```

### 5) (Optional) Start admin panel

```bash
cd admin
npm install
npm run dev
```

## Environment Variables

Typical values used across services:

```env
# Telegram
BOT_TOKEN=
TELEGRAM_BOT_TOKEN=
MINI_APP_URL=https://your-public-miniapp-url

# OpenAI
OPENAI_API_KEY=

# Backend
BACKEND_URL=http://localhost:8000
DATABASE_URL=sqlite:///./physics_bot.db

# Admin auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
JWT_SECRET_KEY=change_me_super_secret
```

## Run Modes

### A) Local multi-terminal development

- Terminal 1: backend
- Terminal 2: frontend
- Terminal 3: bot
- Terminal 4: admin (optional)

### B) Docker Compose

```bash
docker-compose up --build
```

Typical service endpoints:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Telegram Setup

1. Open [@BotFather](https://t.me/BotFather)
2. Create or select your bot
3. Set Mini App menu button URL with `/setmenubutton`
4. Add domain allowlist using `/setdomain`

Mini App URL must be HTTPS. For local testing, use a tunnel:

```bash
ngrok http 5173
```

Set the generated HTTPS URL as `MINI_APP_URL` and in BotFather settings.

## API Overview

Main route groups in backend:

- `/theory` — topic list/content
- `/problems` — filtering, random, checks
- `/tests` — random test generation, submit result
- `/progress` — user learning stats updates
- `/rating` — leaderboard/top users
- `/ai` — AI tutoring endpoint (OpenAI proxy)
- `/admin` — protected admin operations

Example endpoints used by the app:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/theory/topics` | Get theory topic list |
| GET | `/api/theory/topics/{id}` | Get topic content |
| GET | `/api/problems` | Get problems with filters |
| POST | `/api/problems/{id}/check` | Validate answer |
| GET | `/api/tests/random` | Fetch random quiz |
| POST | `/api/tests/submit` | Save test result |
| GET | `/api/progress/{telegram_id}` | Get user progress |
| GET | `/api/rating/leaderboard` | Get ranking table |
| POST | `/api/ai/ask` | Ask AI tutor |

## Admin Panel

The admin app is intended for content and operations management:

- Manage theory content blocks
- Manage problems/tests
- Review users and progress summaries
- Send notifications/broadcasts

Recommended: run admin behind authentication and only over trusted networks in development.

## Development Workflow

1. Add or update content/models in backend.
2. Expose/adjust API schema and router.
3. Integrate/update frontend page and API client.
4. Validate Telegram bot entry points/commands.
5. Verify formula rendering and language consistency.

## Troubleshooting

### Bot does not respond

- Verify `BOT_TOKEN` is valid.
- Ensure only one bot process is polling updates.

### Mini App opens blank page

- Check `MINI_APP_URL` points to active HTTPS frontend.
- Inspect browser devtools console for runtime errors.

### OpenAI request fails

- Verify `OPENAI_API_KEY` and account access to model.
- Check backend logs for upstream API errors/timeouts.

### CORS errors

- Update backend CORS configuration to include frontend origin.

### Telegram WebApp user is missing in local browser

- `initDataUnsafe` is empty outside Telegram context; this is expected.
- Use fallback/mock flows for browser-only UI testing.

## Security Notes

- Do not commit `.env` with real credentials.
- Rotate tokens/keys if they were exposed.
- Replace default admin credentials before any deployment.
- Restrict CORS origins in production.
- Keep OpenAI key server-side only (never expose in frontend bundle).

## Roadmap Ideas

- Adaptive difficulty based on user performance
- Richer analytics dashboard and achievements
- Content localization tooling for educators
- Scheduled weekly challenge tests

## License

MIT
