# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Math PISA Bot — a Telegram Mini App for school-level math learning based on the PISA assessment model.

- User-facing language: **Kazakh**. Engineering language: English.
- Formula format: LaTeX (`$...$` inline, `$$...$$` block), rendered with KaTeX.
- Core stack: React 18 + Vite 5 + TailwindCSS 3, FastAPI + SQLAlchemy 2 + Pydantic 2, aiogram 3, Groq (llama-3.3-70b via OpenAI SDK), SQLite.
- No test suite exists. No linting/formatting configs.

## Local Development Commands

```bash
# Backend (API docs at localhost:8000/docs) — must run from backend/
cd backend && source .venv/bin/activate && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend — Vite dev server on :3000, proxies /api → localhost:8000
cd frontend && npm install && npm run dev

# Bot
cd bot && pip install -r requirements.txt && python main.py

# Admin panel — Vite dev server on :5174
cd admin && npm install && npm run dev

# Docker (all services: frontend :3000, backend :8000, admin :5174)
docker-compose up --build
```

### Deployment

```bash
# Frontend — Cloudflare Pages (also has vercel.json for Vercel)
cd frontend && npm run build && npm run pages:deploy

# Backend — Render (configured in render.yaml, region: frankfurt, free plan)
# Auto-deploys from git. Manual: push to main.

# Bot — Railway (configured in bot/railway.json)
```

## Architecture

### Four services

- **frontend/** — Telegram Mini App. React + Zustand + axios. Sends `X-Telegram-Init-Data` header on every API request (interceptor in `src/api/client.js`). Deployed via Cloudflare Pages.
- **backend/** — FastAPI REST API. All routes under `/api/`. Thin routers → `app/services/` for business logic. SQLite DB auto-creates, migrates columns, and seeds data on startup (`create_tables()` in lifespan).
- **bot/** — aiogram 3 long-polling bot. Communicates with backend via httpx. Runs hourly `notification_loop` background task for engagement reminders.
- **admin/** — Separate React app (React 18 + Vite + Tailwind + Recharts + react-hook-form/zod). JWT auth against `/api/admin/login`. Manages theory content, problems, tests, users, broadcasts.

### Backend internals

- **AI service** (`app/services/gemini_service.py`): Filename is misleading — actually uses **Groq API** via `AsyncOpenAI(base_url="https://api.groq.com/openai/v1")`. Model: `llama-3.3-70b-versatile`, temp 0.3, max 1000 tokens. System prompt enforces Kazakh-only math responses with jailbreak detection.
- **Database** (`app/database/database.py`): `create_tables()` on startup: create all tables → `_migrate_sqlite()` (ALTER TABLE for missing columns) → seed admin user from env → seed test bank → seed 4 PISA theory topics → seed visual content. All idempotent. Supports PostgreSQL via `DATABASE_URL` env var (falls back to SQLite).
- **Auth** (`app/utils/auth.py`): Two auth modes: (1) Telegram ID auth — extracts from `x-telegram-init-data` header, checks against `ADMIN_TELEGRAM_IDS` env var. (2) JWT admin auth — HS256, 12h expiry, for admin panel login. Password hashing: SHA256 with JWT_SECRET_KEY as pepper. No Telegram initData validation on backend — trusts frontend header.
- **Progress** (`app/services/progress_service.py`): `get_or_create_user()`, `update_streak()` (increment if active yesterday, reset if >1 day gap — uses Kazakhstan timezone UTC+5), `calculate_user_score()` (sum of test percentages).
- **Achievements** (`app/services/achievement_service.py`): Badge/achievement unlock rules based on XP thresholds, streak milestones, and test completions.
- **Analytics** (`app/services/analytics_service.py`): Topic mastery calculations per user.
- **Models**: User, Problem, AdminTestQuestion, TheoryContent (JSON blocks), TestResult, Progress, ChatHistory, BroadcastLog, AdminUser, TopicMastery, UserAchievement. User → TestResult/Progress have cascade delete. ChatHistory has no FK. JSON columns used for flexible data (tags, table_data, answers, blocks).
- **Seed data** comes from three places: inline constants in routers (SEED_PROBLEMS in problems.py, TEST_BANK in tests.py), `database.py` seed functions, and `database/seed_visual_content.py`.

### Backend API routes (`/api/`)

| Group | Key endpoints |
|-------|--------------|
| `/users` | `POST /register`, `GET /{id}/avatar` (proxies Telegram API), `POST /level`, `GET /inactive`, `PATCH /{id}/notifications` |
| `/theory` | `GET /topics` (4 PISA domains), `GET /topics/{id}` (hardcoded subtopics + formulas) |
| `/problems` | `GET /` (filter by difficulty/topic), `POST /{id}/check` (normalizes comma→period, case-insensitive) |
| `/tests` | `GET /daily` (date-seeded deterministic set), `GET /random`, `POST /submit` (calculates XP + streak + daily bonus 50xp) |
| `/progress` | `GET /{telegram_id}`, `POST /update` |
| `/rating` | `GET /leaderboard?period=week\|month` (aggregates test percentages), `GET /rank/{id}` |
| `/ai` | `POST /ask` (with jailbreak check), `GET /history/{id}`, `DELETE /history/{id}`, `POST /hint` |
| `/admin` | JWT-protected. Full CRUD for problems/tests/theory/users. `POST /broadcast`, `GET /stats`, `POST /problems/bulk` (CSV import). |

### Frontend internals

- **Routing**: React Router 6 in `App.jsx`. Routes: `/` (Home), `/theory`, `/problems`, `/test`, `/progress`, `/rating`, `/ask-ai`, `/help`, `/achievements`, `/admin`. Onboarding gate via `localStorage.onboarding_completed` — blocks all routes until completed.
- **State**: `store/userStore.js` (user + isAuthenticated), `store/progressStore.js` (topics cache, score, streak). Zustand, no persist middleware.
- **API layer**: `src/api/client.js` (axios, baseURL from `VITE_API_URL` or `/api`, 15s timeout, auto-attaches Telegram initData). Individual API modules in `src/api/` for each domain (9 files).
- **FormulaRenderer** (`src/components/FormulaRenderer.jsx`): Core component used across 5+ pages. Regex-parses mixed text+LaTeX (`$$...$$`, `$...$`, `\[...\]`, `\(...\)`). Has `glow` prop for styled display.
- **Telegram SDK** (`src/hooks/useTelegram.js`): Wraps `WebApp.ready()`, `expand()`, `setHeaderColor('#0F0F1A')`, haptic feedback, back button, confirm dialogs. Auto-registers user via `/api/users/register` on mount.
- **Admin page**: Restricted by hardcoded `ADMIN_IDS` array in `Admin.jsx` — separate from admin panel, this is an in-app admin view.
- **Vite config**: `envDir: '../'` (reads .env from project root), dev proxy `/api` → `localhost:8000`.
- **Tailwind theme**: Dark mode only (class on `<html>`). Custom colors (bg: #0F0F1A, surface: #1A1A2E, primary: #6C63FF, secondary: #FF6584). Font: Inter. Custom animations: fade-in, slide-up, scale-in, shimmer. Custom shadows: glow-primary, glow-success.

### Bot internals

- **Handlers** (7 routers in `handlers/`): start (register + stats display), profile, rating (top-10 with medals), streak (visual bar 🟩⬜), help (static), menu (text button routing → mini app redirect), notifications (hourly loop fetches `/api/users/inactive`, sends random motivational messages).
- **Keyboards** (`keyboards/`): `main_kb.py` — persistent reply keyboard 2×2+1 layout with WebAppInfo button. `inline_kb.py` — inline buttons for app open, profile refresh, notification disable callbacks.
- **Communication**: All backend calls via `httpx.AsyncClient` with 5-10s timeout. Silent failure pattern (try/except pass).

### Admin panel internals

- **Auth**: JWT stored in localStorage (`admin_jwt_token`). Axios interceptor adds `Bearer` header. 401 response → `clearAuthToken()` → redirect to `/login`. ProtectedRoute wrapper guards all routes.
- **Pages** (6): Login (zod validation), Dashboard, Problems (CRUD + bulk CSV upload), Tests, Theory, Users (ban/notification toggles + CSV export), Notifications (broadcast history).
- **Theory editor**: Drag-and-drop block editor (hello-pangea/dnd). Block types: text, formula, example, image, divider. Live KaTeX preview via `FormulaPreview.jsx`.
- **Shared components**: Sidebar, TopBar, DataTable (reusable), Modal, ConfirmDialog, LaTeXHelper.
- **Vite config**: Does NOT set `envDir` — defaults `VITE_API_URL` to `http://localhost:8000` in `api/client.js`.

## PISA Math Model

Four content domains with `topic_id` keys: `quantity`, `change_and_relationships`, `space_and_shape`, `uncertainty_and_data`. Backend normalizes Kazakh topic names to these English IDs in `database.py`.

Six competency levels (1=basic → 6=advanced reasoning). User default level: 3. Problems and user levels both use this 1-6 scale.

## Engineering Conventions

- User-facing content in Kazakh; code/docs in English.
- Frontend: 100% Tailwind utilities (no .module.css). Mobile-first, Telegram WebView compatible. Haptic feedback on interactions via `useTelegram` hook.
- Backend: Thin routers → services. Pydantic v2 schemas for all request/response (`model_config = {"from_attributes": True}` for ORM mapping). LaTeX validation checks brace/$ balance in admin schemas. All models use `datetime.now(timezone.utc)` for timestamps.
- `.env` sits at project root (this directory), loaded by backend and bot via python-dotenv, by frontend via Vite `envDir: '../'`. Admin panel does **not** set `envDir` — it defaults `VITE_API_URL` to `http://localhost:8000` in code.
- Backend dependency injection: `db: Session = Depends(get_db)` in all router functions.
- Button component (`frontend/src/components/Button.jsx`) supports 5 variants: primary, secondary, ghost, danger, success.

## Environment Variables

Required in `.env`:
```
BOT_TOKEN, TELEGRAM_BOT_TOKEN, MINI_APP_URL, GROQ_API_KEY,
BACKEND_URL (default http://localhost:8000), DATABASE_URL (default sqlite:///./math_pisa_bot.db),
ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET_KEY, ADMIN_TELEGRAM_IDS (comma-separated Telegram user IDs for admin access)
```
Frontend/Admin: `VITE_API_URL` (frontend defaults to `/api` via proxy; admin defaults to `http://localhost:8000`).
