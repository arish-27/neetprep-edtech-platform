"""
V2 — Doubt Management
New table: v2_doubts
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import String, Text, Integer, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.enums import UserRole
from app.models.user import User

router = APIRouter(prefix="/doubts", tags=["v2-doubts"])


class V2Doubt(Base):
    __tablename__ = "v2_doubts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    student_name: Mapped[str] = mapped_column(String(120), default="")
    subject: Mapped[str] = mapped_column(String(80), index=True)
    topic: Mapped[str] = mapped_column(String(200), default="")
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    answered_by_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)  # open | answered
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    answered_at: Mapped[datetime | None] = mapped_column(nullable=True)


class DoubtCreate(BaseModel):
    subject: str
    topic: str = ""
    question: str


class DoubtAnswer(BaseModel):
    answer: str


class DoubtPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    subject: str
    topic: str
    question: str
    answer: str | None
    answered_by_name: str | None
    upvotes: int
    status: str
    created_at: datetime
    answered_at: datetime | None


@router.post("", response_model=DoubtPublic, status_code=status.HTTP_201_CREATED)
async def create_doubt(
    data: DoubtCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    d = V2Doubt(
        student_id=user.id,
        student_name=user.username,
        subject=data.subject,
        topic=data.topic,
        question=data.question,
    )
    session.add(d)
    await session.commit()
    await session.refresh(d)
    return d


@router.get("", response_model=list[DoubtPublic])
async def list_doubts(
    subject: str | None = Query(default=None),
    doubt_status: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, le=100),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(V2Doubt).order_by(V2Doubt.upvotes.desc(), V2Doubt.created_at.desc()).limit(limit)
    if subject:
        stmt = stmt.where(V2Doubt.subject == subject)
    if doubt_status:
        stmt = stmt.where(V2Doubt.status == doubt_status)
    # Students see all doubts; teachers see only their subject
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.post("/{doubt_id}/answer", response_model=DoubtPublic)
async def answer_doubt(
    doubt_id: uuid.UUID,
    data: DoubtAnswer,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=403, detail="Teacher access required")
    d = await session.get(V2Doubt, doubt_id)
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    d.answer = data.answer
    d.answered_by_id = user.id
    d.answered_by_name = user.username
    d.status = "answered"
    d.answered_at = func.now()
    await session.commit()
    await session.refresh(d)
    return d


@router.post("/{doubt_id}/upvote", response_model=DoubtPublic)
async def upvote_doubt(
    doubt_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    d = await session.get(V2Doubt, doubt_id)
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    d.upvotes += 1
    await session.commit()
    await session.refresh(d)
    return d
