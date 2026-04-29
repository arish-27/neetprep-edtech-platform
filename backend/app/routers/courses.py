from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.pagination import pagination_params
from app.models.enums import Subject
from app.models.user import User
from app.schemas.course import CourseCreate, CoursePublic
from app.schemas.enrollment import EnrollmentPublic
from app.schemas.pagination import Page
from app.services.course_service import create_course, enroll_user, get_course, list_courses, list_enrolled_courses

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=Page[CoursePublic])
async def get_courses(
  subject: Subject | None = Query(default=None),
  q: str | None = Query(default=None, max_length=120),
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
):
  limit, offset = pagination
  return await list_courses(session, subject=subject, q=q, limit=limit, offset=offset)


@router.get("/enrolled", response_model=Page[CoursePublic])
async def my_courses(
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  limit, offset = pagination
  return await list_enrolled_courses(session, user_id=user.id, limit=limit, offset=offset)


@router.post("", response_model=CoursePublic, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_course_route(data: CourseCreate, session: AsyncSession = Depends(get_async_session)):
  return await create_course(session, data)


@router.get("/{course_id}", response_model=CoursePublic)
async def course_details(course_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
  return await get_course(session, course_id)


@router.post("/{course_id}/enroll", response_model=EnrollmentPublic)
async def enroll(
  course_id: uuid.UUID,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  await get_course(session, course_id)
  return await enroll_user(session, user_id=user.id, course_id=course_id)

