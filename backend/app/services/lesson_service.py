from __future__ import annotations

import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.lesson import Lesson
from app.utils.pagination import paginate


async def list_lessons_by_course(session: AsyncSession, *, course_id: uuid.UUID, limit: int, offset: int):
  stmt = select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order_index.asc())
  return await paginate(session, stmt, limit=limit, offset=offset)


async def create_lesson(session: AsyncSession, *, course_id: uuid.UUID, data) -> Lesson:
  lesson = Lesson(
    course_id=course_id,
    title=data.title,
    video_url=data.video_url,
    duration=data.duration,
    order_index=data.order_index,
  )
  session.add(lesson)
  await session.commit()
  await session.refresh(lesson)
  return lesson


async def get_lesson(session: AsyncSession, lesson_id: uuid.UUID) -> Lesson:
  res = await session.execute(select(Lesson).where(Lesson.id == lesson_id))
  lesson = res.scalar_one_or_none()
  if not lesson:
    raise AppError("Lesson not found", status_code=status.HTTP_404_NOT_FOUND, code="lesson_not_found")
  return lesson

