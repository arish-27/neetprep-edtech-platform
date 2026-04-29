from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.pagination import Page, PageMeta


async def paginate(session: AsyncSession, stmt: Select, *, limit: int, offset: int):
  total_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
  total = int((await session.execute(total_stmt)).scalar_one())

  result = await session.execute(stmt.limit(limit).offset(offset))
  items = result.scalars().all()

  meta = PageMeta(total=total, limit=limit, offset=offset, has_more=(offset + limit) < total)
  return Page(items=items, meta=meta)

