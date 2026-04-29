from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.pagination import pagination_params
from app.models.user import User
from app.schemas.demo_video import DemoAccessResponse, DemoVideoSource
from app.schemas.lesson import LessonCreate, LessonPublic
from app.schemas.pagination import Page
from app.schemas.progress import ProgressPublic, ProgressUpdate
from app.services.course_service import get_course, require_enrollment
from app.services.lesson_service import create_lesson, get_lesson, list_lessons_by_course
from app.services.progress_service import get_progress, upsert_progress

router = APIRouter(tags=["lessons"])


@router.get("/courses/{course_id}/lessons", response_model=Page[LessonPublic])
async def lessons_by_course(
  course_id: uuid.UUID,
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  await get_course(session, course_id)
  await require_enrollment(session, user=user, course_id=course_id)
  limit, offset = pagination
  page = await list_lessons_by_course(session, course_id=course_id, limit=limit, offset=offset)
  items = [LessonPublic.model_validate(x) for x in (page.items or [])]
  return Page(items=items, meta=page.meta)


@router.get("/lessons/{lesson_id}", response_model=LessonPublic)
async def lesson_details(
  lesson_id: uuid.UUID,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  lesson = await get_lesson(session, lesson_id)
  await require_enrollment(session, user=user, course_id=lesson.course_id)
  out = LessonPublic.model_validate(lesson)
  return out


@router.get("/lessons/{lesson_id}/play", response_model=DemoAccessResponse)
async def play_lesson(
  lesson_id: uuid.UUID,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  lesson = await get_lesson(session, lesson_id)
  await require_enrollment(session, user=user, course_id=lesson.course_id)

  if not lesson.youtube_id:
    return DemoAccessResponse(access=False, reason="not_found")

  return DemoAccessResponse(access=True, reason="ok", video=DemoVideoSource(youtube_id=lesson.youtube_id))


@router.post(
  "/courses/{course_id}/lessons",
  response_model=LessonPublic,
  status_code=status.HTTP_201_CREATED,
  dependencies=[Depends(require_admin)],
)
async def create_lesson_route(course_id: uuid.UUID, data: LessonCreate, session: AsyncSession = Depends(get_async_session)):
  await get_course(session, course_id)
  return await create_lesson(session, course_id=course_id, data=data)


@router.get("/lessons/{lesson_id}/progress", response_model=ProgressPublic)
async def resume_progress(
  lesson_id: uuid.UUID,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  await get_lesson(session, lesson_id)
  progress = await get_progress(session, user_id=user.id, lesson_id=lesson_id)
  if not progress:
    # default empty progress snapshot
    progress = await upsert_progress(session, user_id=user.id, lesson_id=lesson_id, watched_seconds=0, completed=False)
  return progress


@router.put("/lessons/{lesson_id}/progress", response_model=ProgressPublic)
async def update_progress(
  lesson_id: uuid.UUID,
  data: ProgressUpdate,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  await get_lesson(session, lesson_id)
  return await upsert_progress(
    session,
    user_id=user.id,
    lesson_id=lesson_id,
    watched_seconds=data.watched_seconds,
    completed=data.completed,
  )
