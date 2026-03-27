from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.database import create_tables
from app.routers import theory, problems, tests, progress, rating, ai, users, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="Math PISA Bot API",
    description="PISA математика боты бэкенд API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(theory.router, prefix="/api/theory", tags=["Theory"])
app.include_router(problems.router, prefix="/api/problems", tags=["Problems"])
app.include_router(tests.router, prefix="/api/tests", tags=["Tests"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(rating.router, prefix="/api/rating", tags=["Rating"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok", "service": "math-pisa-bot-api"}
