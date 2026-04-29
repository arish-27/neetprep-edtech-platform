from __future__ import annotations

import uuid

from fastapi import status
from sqlalchemy import Select, and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.enums import Subject
from app.models.user import User
from app.utils.pagination import paginate


def _course_filters(subject: Subject | None, q: str | None):
  clauses = []
  if subject:
    clauses.append(Course.subject == subject)
  if q:
    like = f"%{q.strip()}%"
    clauses.append(or_(Course.title.ilike(like), Course.description.ilike(like)))
  return clauses


async def list_courses(
  session: AsyncSession,
  *,
  subject: Subject | None,
  q: str | None,
  limit: int,
  offset: int,
):
  stmt: Select = select(Course).order_by(Course.created_at.desc())
  clauses = _course_filters(subject, q)
  if clauses:
    stmt = stmt.where(and_(*clauses))
  return await paginate(session, stmt, limit=limit, offset=offset)


async def get_course(session: AsyncSession, course_id: uuid.UUID) -> Course:
  res = await session.execute(select(Course).where(Course.id == course_id))
  course = res.scalar_one_or_none()
  if not course:
    raise AppError("Course not found", status_code=status.HTTP_404_NOT_FOUND, code="course_not_found")
  return course


async def create_course(session: AsyncSession, data) -> Course:
  course = Course(
    title=data.title,
    description=data.description,
    subject=data.subject,
    thumbnail_url=data.thumbnail_url,
  )
  session.add(course)
  await session.commit()
  await session.refresh(course)
  return course


async def enroll_user(session: AsyncSession, *, user_id: uuid.UUID, course_id: uuid.UUID) -> Enrollment:
  res = await session.execute(
    select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
  )
  existing = res.scalar_one_or_none()
  if existing:
    return existing

  enrollment = Enrollment(user_id=user_id, course_id=course_id)
  session.add(enrollment)
  await session.commit()
  await session.refresh(enrollment)
  return enrollment


async def require_enrollment(session: AsyncSession, *, user: User, course_id: uuid.UUID) -> None:
  if user.role.value == "admin":
    return

  res = await session.execute(
    select(Enrollment.id).where(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
  )
  existing = res.scalar_one_or_none()
  if not existing:
    raise AppError("Enroll to access this content", status_code=status.HTTP_403_FORBIDDEN, code="not_enrolled")


async def list_enrolled_courses(session: AsyncSession, *, user_id: uuid.UUID, limit: int, offset: int):
  stmt = (
    select(Course)
    .join(Enrollment, Enrollment.course_id == Course.id)
    .where(Enrollment.user_id == user_id)
    .order_by(Enrollment.created_at.desc())
  )
  return await paginate(session, stmt, limit=limit, offset=offset)
