"""
V2 — Live Class Scheduler
New table: v2_live_classes
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import String, Text, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.enums import UserRole
from app.models.user import User

router = APIRouter(prefix="/live-classes", tags=["v2-live-classes"])


class V2LiveClass(Base):
    __tablename__ = "v2_live_classes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    teacher_name: Mapped[str] = mapped_column(String(120), default="")
    title: Mapped[str] = mapped_column(String(220))
    subject: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    meet_link: Mapped[str] = mapped_column(String(500), default="")
    starts_at: Mapped[datetime] = mapped_column(nullable=False)
    duration_min: Mapped[int] = mapped_column(default=60)
    status: Mapped[str] = mapped_column(String(20), default="scheduled")  # scheduled|live|ended
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class LiveClassCreate(BaseModel):
    title: str
    subject: str
    description: str = ""
    meet_link: str = ""
    starts_at: datetime
    duration_min: int = 60


class LiveClassPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    teacher_name: str
    title: str
    subject: str
    description: str
    meet_link: str
    starts_at: datetime
    duration_min: int
    status: str
    created_at: datetime


@router.post("", response_model=LiveClassPublic, status_code=status.HTTP_201_CREATED)
async def schedule_class(
    data: LiveClassCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=403, detail="Teacher access required")
    lc = V2LiveClass(
        teacher_id=user.id,
        teacher_name=user.username,
        title=data.title,
        subject=data.subject,
        description=data.description,
        meet_link=data.meet_link,
        starts_at=data.starts_at,
        duration_min=data.duration_min,
    )
    session.add(lc)
    await session.commit()
    await session.refresh(lc)
    return lc


@router.get("", response_model=list[LiveClassPublic])
async def list_classes(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(V2LiveClass).order_by(V2LiveClass.starts_at.asc())
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.patch("/{class_id}/status", response_model=LiveClassPublic)
async def update_status(
    class_id: uuid.UUID,
    new_status: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=403, detail="Teacher access required")
    lc = await session.get(V2LiveClass, class_id)
    if not lc:
        raise HTTPException(status_code=404, detail="Class not found")
    lc.status = new_status
    await session.commit()
    await session.refresh(lc)
    return lc
