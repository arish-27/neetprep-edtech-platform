"""
V2 — Assignment Builder
New tables: v2_assignments, v2_assignment_submissions
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, Boolean
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.enums import UserRole
from app.models.user import User

router = APIRouter(prefix="/assignments", tags=["v2-assignments"])


# ── New DB models (additive only) ─────────────────────────────────────────────

class V2Assignment(Base):
    __tablename__ = "v2_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(220))
    subject: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text, default="")
    questions: Mapped[list] = mapped_column(JSON, default=list)   # list of GeneratedQuestion dicts
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class V2AssignmentSubmission(Base):
    __tablename__ = "v2_assignment_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("v2_assignments.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)   # {question_id: option_index}
    score: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Schemas ───────────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    title: str
    subject: str
    description: str = ""
    questions: list[dict]
    due_at: datetime | None = None


class AssignmentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    subject: str
    description: str
    questions: list[dict]
    due_at: datetime | None
    created_at: datetime


class SubmitAssignmentRequest(BaseModel):
    answers: dict[str, int]   # question_id → chosen option index (0-based)


class SubmitAssignmentResponse(BaseModel):
    score: int
    total: int
    accuracy_pct: float
    results: list[dict]   # per-question: correct/wrong + explanation


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=AssignmentPublic, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: AssignmentCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=403, detail="Teacher access required")
    a = V2Assignment(
        teacher_id=user.id,
        title=data.title,
        subject=data.subject,
        description=data.description,
        questions=data.questions,
        due_at=data.due_at,
    )
    session.add(a)
    await session.commit()
    await session.refresh(a)
    return a


@router.get("", response_model=list[AssignmentPublic])
async def list_assignments(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    if user.role in (UserRole.teacher, UserRole.admin):
        stmt = select(V2Assignment).where(V2Assignment.teacher_id == user.id).order_by(V2Assignment.created_at.desc())
    else:
        stmt = select(V2Assignment).order_by(V2Assignment.created_at.desc())
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.get("/{assignment_id}", response_model=AssignmentPublic)
async def get_assignment(
    assignment_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    a = await session.get(V2Assignment, assignment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return a


@router.post("/{assignment_id}/submit", response_model=SubmitAssignmentResponse)
async def submit_assignment(
    assignment_id: uuid.UUID,
    data: SubmitAssignmentRequest,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    a = await session.get(V2Assignment, assignment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    score = 0
    results = []
    for q in a.questions:
        qid = str(q.get("id", ""))
        chosen = data.answers.get(qid)
        opts = q.get("options", [])
        correct_idx = next((i for i, o in enumerate(opts) if o.get("is_correct")), None)
        is_correct = chosen is not None and chosen == correct_idx
        if is_correct:
            score += 1
        results.append({
            "question_id": qid,
            "question_text": q.get("question_text", ""),
            "chosen": chosen,
            "correct_index": correct_idx,
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    total = len(a.questions)
    sub = V2AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=user.id,
        answers=data.answers,
        score=score,
        total=total,
    )
    session.add(sub)
    await session.commit()

    return SubmitAssignmentResponse(
        score=score,
        total=total,
        accuracy_pct=round((score / total) * 100, 1) if total else 0.0,
        results=results,
    )
