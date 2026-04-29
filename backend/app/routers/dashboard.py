from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.pagination import pagination_params
from app.models.user import User
from app.schemas.dashboard import CourseProgress, DashboardSummary, StudentProgressAdmin, SubjectProgress
from app.schemas.course import CoursePublic
from app.schemas.pagination import Page
from app.schemas.quiz import QuizResultPublic
from app.services.dashboard_service import (
  admin_students_summary,
  list_completed_courses,
  list_user_course_progress,
  list_user_quiz_results,
  subject_progress,
  user_summary,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def summary(session: AsyncSession = Depends(get_async_session), user: User = Depends(get_current_user)):
  data = await user_summary(session, user_id=user.id)
  return DashboardSummary(**data)


@router.get("/subject-progress", response_model=list[SubjectProgress])
async def subjects_progress(session: AsyncSession = Depends(get_async_session), user: User = Depends(get_current_user)):
  return await subject_progress(session, user_id=user.id)


@router.get("/course-progress", response_model=Page[CourseProgress])
async def course_progress(
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  limit, offset = pagination
  return await list_user_course_progress(session, user_id=user.id, limit=limit, offset=offset)


@router.get("/completed-courses", response_model=Page[CoursePublic])
async def completed_courses(
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  limit, offset = pagination
  return await list_completed_courses(session, user_id=user.id, limit=limit, offset=offset)


@router.get("/quiz-performance", response_model=Page[QuizResultPublic])
async def quiz_performance(
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  limit, offset = pagination
  return await list_user_quiz_results(session, user_id=user.id, limit=limit, offset=offset)


admin_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@admin_router.get("/students", response_model=Page[StudentProgressAdmin])
async def students(
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
):
  limit, offset = pagination
  return await admin_students_summary(session, limit=limit, offset=offset)
