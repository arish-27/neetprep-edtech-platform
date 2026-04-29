from __future__ import annotations

import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.progress import Progress


async def get_progress(session: AsyncSession, *, user_id: uuid.UUID, lesson_id: uuid.UUID) -> Progress | None:
  res = await session.execute(
    select(Progress).where(Progress.user_id == user_id, Progress.lesson_id == lesson_id)
  )
  return res.scalar_one_or_none()


async def upsert_progress(
  session: AsyncSession,
  *,
  user_id: uuid.UUID,
  lesson_id: uuid.UUID,
  watched_seconds: int,
  completed: bool,
) -> Progress:
  progress = await get_progress(session, user_id=user_id, lesson_id=lesson_id)
  if progress:
    progress.watched_seconds = watched_seconds
    progress.completed = completed
  else:
    progress = Progress(
      user_id=user_id,
      lesson_id=lesson_id,
      watched_seconds=watched_seconds,
      completed=completed,
    )
    session.add(progress)

  await session.commit()
  await session.refresh(progress)
  return progress


async def require_progress(session: AsyncSession, *, user_id: uuid.UUID, lesson_id: uuid.UUID) -> Progress:
  progress = await get_progress(session, user_id=user_id, lesson_id=lesson_id)
  if not progress:
    raise AppError("Progress not found", status_code=status.HTTP_404_NOT_FOUND, code="progress_not_found")
  return progress

