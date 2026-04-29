from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.pagination import pagination_params
from app.models.enums import Subject
from app.schemas.course import CoursePublic
from app.schemas.pagination import Page
from app.services.search_service import search_courses

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/courses", response_model=Page[CoursePublic])
async def search(
  q: str = Query(..., min_length=1, max_length=120),
  subject: Subject | None = Query(default=None),
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
):
  limit, offset = pagination
  return await search_courses(session, q=q, subject=subject, limit=limit, offset=offset)

