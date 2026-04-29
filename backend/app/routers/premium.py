from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.premium import PremiumStatusPublic, PremiumUpdateRequest

router = APIRouter(prefix="/premium", tags=["premium"])


@router.get("/status", response_model=PremiumStatusPublic)
async def status(user: User = Depends(get_current_user)):
  return PremiumStatusPublic(is_paid=bool(user.is_paid), device_id=user.device_id)


@router.post("/demo-toggle", response_model=PremiumStatusPublic)
async def demo_toggle(
  data: PremiumUpdateRequest,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  user.is_paid = bool(data.is_paid)
  session.add(user)
  await session.commit()
  await session.refresh(user)
  return PremiumStatusPublic(is_paid=bool(user.is_paid), device_id=user.device_id)

