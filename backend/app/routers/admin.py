import csv
import io
import os
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.admin_test import AdminTestQuestion
from app.models.admin_user import AdminUser
from app.models.broadcast_log import BroadcastLog
from app.models.problem import Problem
from app.models.progress import Progress
from app.models.test_result import TestResult
from app.models.theory_content import TheoryContent
from app.models.user import User
from app.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    BroadcastHistoryOut,
    BroadcastRequest,
    BroadcastResponse,
    BulkImportResponse,
    DashboardStatResponse,
    ProblemAdminCreate,
    ProblemAdminOut,
    ProblemAdminUpdate,
    ProblemsListResponse,
    TestAdminCreate,
    TestAdminOut,
    TestAdminUpdate,
    TestsListResponse,
    TheoryTopicOut,
    TheoryUpdateRequest,
    ToggleFlagResponse,
    UserProfileResponse,
    UserAdminOut,
    UsersListResponse,
    PaginationMeta,
)
from app.utils.auth import create_access_token, get_current_admin, verify_password

router = APIRouter()


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(body: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == body.username).first()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Логин немесе құпиясөз қате")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Әкімші аккаунты бұғатталған")

    token = create_access_token(admin.username)
    return AdminLoginResponse(access_token=token)


@router.get("/stats", response_model=DashboardStatResponse)
async def get_admin_stats(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    since_30 = today_start - timedelta(days=29)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_problems = db.query(func.count(Problem.id)).scalar() or 0
    total_tests = db.query(func.count(TestResult.id)).scalar() or 0
    active_today = (
        db.query(func.count(User.id)).filter(User.last_activity >= today_start).scalar() or 0
    )

    users_by_day_raw = (
        db.query(func.date(User.created_at).label("day"), func.count(User.id).label("count"))
        .filter(User.created_at >= since_30)
        .group_by(func.date(User.created_at))
        .all()
    )
    users_by_day_map = {str(day): count for day, count in users_by_day_raw}
    new_users_per_day = []
    for offset in range(30):
        day = since_30 + timedelta(days=offset)
        key = day.date().isoformat()
        new_users_per_day.append({"date": key, "count": int(users_by_day_map.get(key, 0))})

    solved_by_topic = (
        db.query(Progress.topic_name, func.sum(Progress.problems_solved))
        .group_by(Progress.topic_name)
        .all()
    )
    problems_solved_per_topic = [
        {"topic": topic or "Белгісіз", "count": int(count or 0)}
        for topic, count in solved_by_topic
    ]

    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )
    recent_registrations = [
        {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "name": user.full_name,
            "level": user.level,
            "score": user.score,
            "created_at": user.created_at,
        }
        for user in recent_users
    ]

    return DashboardStatResponse(
        total_users=total_users,
        total_problems=total_problems,
        total_tests=total_tests,
        active_today=active_today,
        new_users_per_day=new_users_per_day,
        problems_solved_per_topic=problems_solved_per_topic,
        recent_registrations=recent_registrations,
    )


@router.get("/problems", response_model=ProblemsListResponse)
async def list_problems(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    topic: str | None = Query(None),
    level: str | None = Query(None),
    q: str | None = Query(None),
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Problem)
    if topic:
        query = query.filter(Problem.topic == topic)
    if level:
        query = query.filter(Problem.difficulty == level)
    if q:
        pattern = f"%{q}%"
        query = query.filter((Problem.question.ilike(pattern)) | (Problem.solution.ilike(pattern)))

    total = query.count()
    items = (
        query.order_by(Problem.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return ProblemsListResponse(
        items=items,
        meta=PaginationMeta(total=total, page=page, page_size=page_size),
    )


@router.post("/problems", response_model=ProblemAdminOut)
async def create_problem(
    body: ProblemAdminCreate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    new_problem = Problem(
        topic=body.topic,
        question=body.question,
        formula=body.formula,
        correct_answer=body.correct_answer,
        solution=body.solution,
        difficulty=body.difficulty,
        tags=body.tags,
        image_url=body.image_url,
        table_data=body.table_data,
    )
    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)
    return new_problem


@router.put("/problems/{problem_id}", response_model=ProblemAdminOut)
async def update_problem(
    problem_id: int,
    body: ProblemAdminUpdate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")

    payload = body.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(problem, key, value)
    db.commit()
    db.refresh(problem)
    return problem


@router.delete("/problems/{problem_id}")
async def delete_problem(
    problem_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")
    db.delete(problem)
    db.commit()
    return {"status": "deleted"}


@router.post("/problems/bulk", response_model=BulkImportResponse)
async def bulk_import_problems(
    file: UploadFile = File(...),
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Тек CSV файл жүктеңіз")

    data = await file.read()
    text = data.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    required = {"topic", "question", "correct_answer", "difficulty"}
    if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
        raise HTTPException(status_code=400, detail="CSV бағандары толық емес")

    created = 0
    errors = []
    for index, row in enumerate(reader, start=2):
        try:
            if row.get("difficulty") not in {"1", "2", "3", "4", "5", "6"}:
                raise ValueError("Деңгей жарамсыз")

            problem = Problem(
                topic=(row.get("topic") or "").strip(),
                question=(row.get("question") or "").strip(),
                formula=(row.get("formula") or "").strip() or None,
                correct_answer=(row.get("correct_answer") or "").strip(),
                solution=(row.get("solution") or "").strip() or None,
                difficulty=row.get("difficulty"),
                tags=[t.strip() for t in (row.get("tags") or "").split("|") if t.strip()],
            )
            if not problem.topic or not problem.question or not problem.correct_answer:
                raise ValueError("Міндетті өрістер бос")

            db.add(problem)
            created += 1
        except Exception as exc:
            errors.append({"row": index, "error": str(exc)})

    db.commit()
    return BulkImportResponse(created=created, errors=errors)


@router.get("/tests", response_model=TestsListResponse)
async def list_admin_tests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    topic: str | None = Query(None),
    q: str | None = Query(None),
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(AdminTestQuestion)
    if topic:
        query = query.filter(AdminTestQuestion.topic == topic)
    if q:
        query = query.filter(AdminTestQuestion.question.ilike(f"%{q}%"))

    total = query.count()
    items = (
        query.order_by(AdminTestQuestion.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return TestsListResponse(
        items=items,
        meta=PaginationMeta(total=total, page=page, page_size=page_size),
    )


@router.post("/tests/sync")
async def sync_admin_tests_from_bank(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.routers.tests import TEST_BANK

    existing_questions = {
        row[0]
        for row in db.query(AdminTestQuestion.question).all()
        if row[0]
    }

    created = 0
    skipped = 0
    for item in TEST_BANK:
        question = item.get("question", "")
        options = item.get("options", [])
        if not question or len(options) != 4:
            skipped += 1
            continue

        if question in existing_questions:
            skipped += 1
            continue

        correct_idx = int(item.get("correct_answer", 0))
        if correct_idx < 0 or correct_idx > 3:
            correct_idx = 0

        db.add(
            AdminTestQuestion(
                topic=item.get("topic", "atomic_structure"),
                question=question,
                option_a=options[0],
                option_b=options[1],
                option_c=options[2],
                option_d=options[3],
                correct_option=["A", "B", "C", "D"][correct_idx],
                explanation=item.get("explanation"),
            )
        )
        existing_questions.add(question)
        created += 1

    db.commit()
    return {"status": "ok", "created": created, "skipped": skipped}


@router.post("/tests", response_model=TestAdminOut)
async def create_admin_test(
    body: TestAdminCreate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    item = AdminTestQuestion(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/tests/{test_id}", response_model=TestAdminOut)
async def update_admin_test(
    test_id: int,
    body: TestAdminUpdate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    test = db.query(AdminTestQuestion).filter(AdminTestQuestion.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест табылмады")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(test, key, value)
    db.commit()
    db.refresh(test)
    return test


@router.delete("/tests/{test_id}")
async def delete_admin_test(
    test_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    test = db.query(AdminTestQuestion).filter(AdminTestQuestion.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест табылмады")
    db.delete(test)
    db.commit()
    return {"status": "deleted"}


@router.get("/theory", response_model=list[TheoryTopicOut])
async def list_theory(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(TheoryContent).order_by(TheoryContent.topic_id.asc()).all()


@router.put("/theory/{topic_id}", response_model=TheoryTopicOut)
async def update_theory_topic(
    topic_id: str,
    body: TheoryUpdateRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    topic = db.query(TheoryContent).filter(TheoryContent.topic_id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Теория тақырыбы табылмады")

    if body.title:
        topic.title = body.title
    topic.blocks = [b.model_dump() for b in body.blocks]
    db.commit()
    db.refresh(topic)
    return topic


@router.get("/users", response_model=UsersListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    level: str | None = Query(None),
    active: bool | None = Query(None),
    q: str | None = Query(None),
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if level:
        query = query.filter(User.level == level)
    if active is not None:
        query = query.filter(User.is_active == active)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            (User.username.ilike(pattern))
            | (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
        )

    total = query.count()
    items = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return UsersListResponse(
        items=items,
        meta=PaginationMeta(total=total, page=page, page_size=page_size),
    )


@router.get("/users/export")
async def export_users_csv(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id.asc()).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "telegram_id",
            "username",
            "first_name",
            "last_name",
            "level",
            "score",
            "streak",
            "is_active",
            "is_banned",
            "notifications_enabled",
            "created_at",
        ]
    )
    for user in users:
        writer.writerow(
            [
                user.id,
                user.telegram_id,
                user.username or "",
                user.first_name or "",
                user.last_name or "",
                user.level,
                user.score,
                user.streak,
                user.is_active,
                user.is_banned,
                user.notifications_enabled,
                user.created_at.isoformat() if user.created_at else "",
            ]
        )

    buffer.seek(0)
    filename = f"users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/users/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")

    tests = db.query(TestResult).filter(TestResult.user_id == user.id).all()
    progress = db.query(Progress).filter(Progress.user_id == user.id).all()
    tests_summary = {
        "taken": len(tests),
        "avg_percentage": round(sum(t.percentage for t in tests) / len(tests), 1) if tests else 0,
        "last_test_at": tests[-1].created_at if tests else None,
    }
    progress_summary = {
        "topics_count": len(progress),
        "problems_solved": sum(p.problems_solved for p in progress),
        "avg_completion": round(sum(p.completion_percent for p in progress) / len(progress), 1)
        if progress
        else 0,
    }
    return UserProfileResponse(
        user=UserAdminOut.model_validate(user),
        tests_summary=tests_summary,
        progress_summary=progress_summary,
    )


@router.patch("/users/{user_id}/ban", response_model=ToggleFlagResponse)
async def toggle_user_ban(
    user_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    user.is_banned = not bool(user.is_banned)
    db.commit()
    return ToggleFlagResponse(status="ok", value=user.is_banned)


@router.patch("/users/{user_id}/notifications", response_model=ToggleFlagResponse)
async def toggle_user_notifications(
    user_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    user.notifications_enabled = not bool(user.notifications_enabled)
    db.commit()
    return ToggleFlagResponse(status="ok", value=user.notifications_enabled)


@router.post("/broadcast", response_model=BroadcastResponse)
async def send_broadcast(
    body: BroadcastRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    token = os.getenv("TELEGRAM_BOT_TOKEN", "") or os.getenv("BOT_TOKEN", "")
    if not token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN орнатылмаған")

    users_query = db.query(User).filter(User.is_banned == False)
    if body.audience == "active":
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        users_query = users_query.filter(User.last_activity >= cutoff)
    elif body.audience == "inactive":
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        users_query = users_query.filter(User.last_activity < cutoff)
    elif body.audience == "by_level":
        users_query = users_query.filter(User.level == body.level)

    targets = users_query.all()
    total_targets = len(targets)
    delivered = 0
    failed = 0

    async with httpx.AsyncClient(timeout=12.0) as client:
        for user in targets:
            try:
                resp = await client.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={
                        "chat_id": user.telegram_id,
                        "text": body.message,
                        "parse_mode": "HTML",
                    },
                )
                if resp.status_code == 200:
                    delivered += 1
                else:
                    failed += 1
            except Exception:
                failed += 1

    log = BroadcastLog(
        audience=body.audience,
        audience_level=body.level,
        message=body.message,
        total_targets=total_targets,
        delivered=delivered,
        failed=failed,
    )
    db.add(log)
    db.commit()

    return BroadcastResponse(
        status="sent",
        total_targets=total_targets,
        delivered=delivered,
        failed=failed,
    )


@router.get("/broadcast/history", response_model=list[BroadcastHistoryOut])
async def get_broadcast_history(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(BroadcastLog).order_by(BroadcastLog.created_at.desc()).limit(100).all()
