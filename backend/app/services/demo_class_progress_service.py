from __future__ import annotations

import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.demo_class_progress import DemoClassProgress


async def get_demo_class_progress(session: AsyncSession, *, user_id: uuid.UUID, class_id: str) -> DemoClassProgress | None:
  res = await session.execute(
    select(DemoClassProgress).where(DemoClassProgress.user_id == user_id, DemoClassProgress.class_id == class_id)
  )
  return res.scalar_one_or_none()


async def upsert_demo_class_progress(
  session: AsyncSession,
  *,
  user_id: uuid.UUID,
  class_id: str,
  watched_seconds: int,
  completed: bool,
) -> DemoClassProgress:
  progress = await get_demo_class_progress(session, user_id=user_id, class_id=class_id)
  if progress:
    progress.watched_seconds = watched_seconds
    progress.completed = completed
  else:
    progress = DemoClassProgress(
      user_id=user_id,
      class_id=class_id,
      watched_seconds=watched_seconds,
      completed=completed,
    )
    session.add(progress)

  await session.commit()
  await session.refresh(progress)
  return progress


async def require_demo_class_progress(
  session: AsyncSession, *, user_id: uuid.UUID, class_id: str
) -> DemoClassProgress:
  progress = await get_demo_class_progress(session, user_id=user_id, class_id=class_id)
  if not progress:
    raise AppError(
      "Demo class progress not found",
      status_code=status.HTTP_404_NOT_FOUND,
      code="demo_progress_not_found",
    )
  return progress

