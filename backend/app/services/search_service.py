from __future__ import annotations

from sqlalchemy import Select, and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.enums import Subject
from app.utils.pagination import paginate


async def search_courses(session: AsyncSession, *, q: str, subject: Subject | None, limit: int, offset: int):
  stmt: Select = select(Course).order_by(Course.created_at.desc())
  clauses = []
  if subject:
    clauses.append(Course.subject == subject)
  query = q.strip()
  if query:
    like = f"%{query}%"
    clauses.append(or_(Course.title.ilike(like), Course.description.ilike(like)))
  if clauses:
    stmt = stmt.where(and_(*clauses))
  return await paginate(session, stmt, limit=limit, offset=offset)

