from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.teacher import (
    StudentPerformancePublic,
    TeacherDashboard,
    TeacherSubjectAssign,
    TeacherSubjectPublic,
    TeacherSubjectSelfAssign,
)
from app.services.teacher_service import (
    assign_teacher_subject,
    get_student_subject_performance,
    get_teacher_dashboard,
    get_teacher_subject,
)

router = APIRouter(prefix="/teacher", tags=["teacher"])


def _require_teacher(user: User = Depends(get_current_user)) -> User:
    """Dependency: only teachers (and admins) may access teacher endpoints."""
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required",
        )
    return user


# ── Teacher dashboard ─────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=TeacherDashboard)
async def teacher_dashboard(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(_require_teacher),
):
    return await get_teacher_dashboard(session, teacher_id=user.id)


# ── Teacher subject info ──────────────────────────────────────────────────────

@router.get("/subject", response_model=TeacherSubjectPublic)
async def my_subject(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(_require_teacher),
):
    ts = await get_teacher_subject(session, user_id=user.id)
    if not ts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subject assigned. Contact an admin.",
        )
    return ts


# ── Teacher self-assign subject (on signup) ───────────────────────────────────

@router.post("/subject/self-assign", response_model=TeacherSubjectPublic, status_code=status.HTTP_201_CREATED)
async def self_assign_subject(
    data: TeacherSubjectSelfAssign,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(_require_teacher),
):
    """
    Allows a teacher to assign their own subject (used during signup).
    Only sets the subject if none is assigned yet.
    """
    existing = await get_teacher_subject(session, user_id=user.id)
    if existing:
        return existing
    return await assign_teacher_subject(session, user_id=user.id, subject=data.subject)


# ── Student performance (student's own view) ──────────────────────────────────

@router.get("/student/performance", response_model=list[StudentPerformancePublic])
async def student_performance(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    return await get_student_subject_performance(session, user_id=user.id)


# ── Admin: assign subject to teacher ─────────────────────────────────────────

admin_router = APIRouter(prefix="/admin/teacher", tags=["admin-teacher"])


@admin_router.post("/assign-subject", response_model=TeacherSubjectPublic, status_code=status.HTTP_201_CREATED)
async def assign_subject(
    data: TeacherSubjectAssign,
    session: AsyncSession = Depends(get_async_session),
    _admin: User = Depends(require_admin),
):
    """Admin endpoint: assign a subject to a teacher user."""
    return await assign_teacher_subject(session, user_id=data.user_id, subject=data.subject)
