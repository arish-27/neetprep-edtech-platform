"""
V2 — Adaptive Practice + Leaderboard + Revision Vault
New tables: v2_practice_sessions, v2_revision_queue, v2_gamification
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Float, Integer, String, Text, Boolean, Date, select, and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/adaptive", tags=["v2-adaptive"])


# ── DB Models ─────────────────────────────────────────────────────────────────

class V2PracticeSession(Base):
    __tablename__ = "v2_practice_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(80))
    topic: Mapped[str] = mapped_column(String(200), default="")
    questions_answered: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)
    current_difficulty: Mapped[int] = mapped_column(Integer, default=3)
    ended: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class V2RevisionQueue(Base):
    __tablename__ = "v2_revision_queue"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text)
    subject: Mapped[str] = mapped_column(String(80))
    topic: Mapped[str] = mapped_column(String(200), default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    next_review_at: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class V2Gamification(Base):
    __tablename__ = "v2_gamification"

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    username: Mapped[str] = mapped_column(String(120), default="")
    xp: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    badges: Mapped[str] = mapped_column(String(500), default="")  # comma-separated


# ── Schemas ───────────────────────────────────────────────────────────────────

class StartPracticeRequest(BaseModel):
    subject: str
    topic: str = ""


class PracticeQuestion(BaseModel):
    session_id: str
    question_id: str
    question_text: str
    options: list[str]
    difficulty: int


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    chosen_index: int
    correct_index: int
    question_text: str
    explanation: str
    subject: str
    topic: str


class AnswerResponse(BaseModel):
    is_correct: bool
    explanation: str
    next_difficulty: int
    xp_earned: int
    session_correct: int
    session_total: int


class SessionSummary(BaseModel):
    session_id: str
    subject: str
    topic: str
    total: int
    correct: int
    accuracy_pct: float
    xp_earned: int


class RevisionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    question_text: str
    subject: str
    topic: str
    explanation: str
    review_count: int
    next_review_at: date


class LeaderboardEntry(BaseModel):
    rank: int
    student_id: str
    username: str
    xp: int
    streak_days: int
    badges: list[str]


# ── Question bank (same mock bank, extended) ──────────────────────────────────

_QUESTIONS = [
    {"id": "q1", "text": "Which is a vector quantity?", "opts": ["Speed", "Mass", "Force", "Temp"], "ans": 2, "exp": "Force has direction.", "subj": "Physics"},
    {"id": "q2", "text": "SI unit of charge?", "opts": ["Ampere", "Coulomb", "Volt", "Ohm"], "ans": 1, "exp": "Coulomb (C).", "subj": "Physics"},
    {"id": "q3", "text": "Photosynthesis occurs in?", "opts": ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"], "ans": 2, "exp": "Chloroplasts.", "subj": "Biology"},
    {"id": "q4", "text": "pH of pure water?", "opts": ["0", "7", "14", "1"], "ans": 1, "exp": "Neutral = 7.", "subj": "Chemistry"},
    {"id": "q5", "text": "F = ma is?", "opts": ["1st law", "2nd law", "3rd law", "Gravity"], "ans": 1, "exp": "Newton's 2nd law.", "subj": "Physics"},
    {"id": "q6", "text": "Powerhouse of cell?", "opts": ["Nucleus", "Mitochondria", "Golgi", "Lysosome"], "ans": 1, "exp": "Mitochondria produce ATP.", "subj": "Biology"},
    {"id": "q7", "text": "Avogadro's number?", "opts": ["6.022×10²³", "3×10⁸", "9.8", "1.6×10⁻¹⁹"], "ans": 0, "exp": "6.022×10²³ per mole.", "subj": "Chemistry"},
    {"id": "q8", "text": "DNA replication is?", "opts": ["Conservative", "Semi-conservative", "Dispersive", "None"], "ans": 1, "exp": "Semi-conservative.", "subj": "Biology"},
    {"id": "q9", "text": "Ohm's law: V = ?", "opts": ["IR", "I/R", "R/I", "I²R"], "ans": 0, "exp": "V = IR.", "subj": "Physics"},
    {"id": "q10", "text": "Most electronegative element?", "opts": ["Oxygen", "Chlorine", "Fluorine", "Nitrogen"], "ans": 2, "exp": "Fluorine is most electronegative.", "subj": "Chemistry"},
]


def _get_question(subject: str, difficulty: int, exclude: list[str]) -> dict | None:
    pool = [q for q in _QUESTIONS if q["id"] not in exclude]
    if subject and subject.lower() not in ("all", ""):
        subj_pool = [q for q in pool if q["subj"].lower() == subject.lower()]
        if subj_pool:
            pool = subj_pool
    return random.choice(pool) if pool else None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/start", response_model=PracticeQuestion)
async def start_practice(
    data: StartPracticeRequest,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    ps = V2PracticeSession(student_id=user.id, subject=data.subject, topic=data.topic)
    session.add(ps)
    await session.commit()
    await session.refresh(ps)

    q = _get_question(data.subject, 3, [])
    if not q:
        raise HTTPException(status_code=404, detail="No questions available")

    return PracticeQuestion(
        session_id=str(ps.id),
        question_id=q["id"],
        question_text=q["text"],
        options=q["opts"],
        difficulty=3,
    )


@router.post("/answer", response_model=AnswerResponse)
async def answer_question(
    data: AnswerRequest,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    try:
        ps_id = uuid.UUID(data.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id")

    ps = await session.get(V2PracticeSession, ps_id)
    if not ps or ps.student_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    is_correct = data.chosen_index == data.correct_index
    ps.questions_answered += 1
    if is_correct:
        ps.correct += 1
        ps.current_difficulty = min(5, ps.current_difficulty + 1)
    else:
        ps.current_difficulty = max(1, ps.current_difficulty - 1)
        # Add to revision queue
        rq = V2RevisionQueue(
            student_id=user.id,
            question_text=data.question_text,
            subject=data.subject,
            topic=data.topic,
            explanation=data.explanation,
            next_review_at=date.today(),
        )
        session.add(rq)

    # Update gamification
    xp_earned = 10 if is_correct else 2
    gam = await session.get(V2Gamification, user.id)
    if not gam:
        gam = V2Gamification(student_id=user.id, username=user.username, xp=0, streak_days=0)
        session.add(gam)
    gam.xp += xp_earned
    today = date.today()
    if gam.last_active_date != today:
        if gam.last_active_date and (today - gam.last_active_date).days == 1:
            gam.streak_days += 1
        elif gam.last_active_date and (today - gam.last_active_date).days > 1:
            gam.streak_days = 1
        else:
            gam.streak_days = max(1, gam.streak_days)
        gam.last_active_date = today

    await session.commit()

    return AnswerResponse(
        is_correct=is_correct,
        explanation=data.explanation,
        next_difficulty=ps.current_difficulty,
        xp_earned=xp_earned,
        session_correct=ps.correct,
        session_total=ps.questions_answered,
    )


@router.post("/end/{session_id}", response_model=SessionSummary)
async def end_session(
    session_id: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    ps = await session.get(V2PracticeSession, uuid.UUID(session_id))
    if not ps or ps.student_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    ps.ended = True
    await session.commit()
    total = ps.questions_answered
    correct = ps.correct
    return SessionSummary(
        session_id=session_id,
        subject=ps.subject,
        topic=ps.topic,
        total=total,
        correct=correct,
        accuracy_pct=round((correct / total) * 100, 1) if total else 0.0,
        xp_earned=correct * 10 + (total - correct) * 2,
    )


@router.get("/next-question/{session_id}", response_model=PracticeQuestion)
async def next_question(
    session_id: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    ps = await session.get(V2PracticeSession, uuid.UUID(session_id))
    if not ps or ps.student_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    q = _get_question(ps.subject, ps.current_difficulty, [])
    if not q:
        raise HTTPException(status_code=404, detail="No more questions")
    return PracticeQuestion(
        session_id=session_id,
        question_id=q["id"],
        question_text=q["text"],
        options=q["opts"],
        difficulty=ps.current_difficulty,
    )


# ── Revision Vault ────────────────────────────────────────────────────────────

@router.get("/revision", response_model=list[RevisionItem])
async def get_revision_queue(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    today = date.today()
    stmt = (
        select(V2RevisionQueue)
        .where(and_(V2RevisionQueue.student_id == user.id, V2RevisionQueue.next_review_at <= today))
        .order_by(V2RevisionQueue.next_review_at.asc())
        .limit(20)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.post("/revision/{item_id}/reviewed")
async def mark_reviewed(
    item_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    item = await session.get(V2RevisionQueue, item_id)
    if not item or item.student_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    item.review_count += 1
    # Spaced repetition: next review in 2^review_count days
    from datetime import timedelta
    item.next_review_at = date.today() + timedelta(days=2 ** item.review_count)
    await session.commit()
    return {"next_review_at": str(item.next_review_at)}


# ── Leaderboard ───────────────────────────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    limit: int = 20,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(V2Gamification).order_by(V2Gamification.xp.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    result = []
    for rank, row in enumerate(rows, 1):
        badges = [b for b in row.badges.split(",") if b] if row.badges else []
        result.append(LeaderboardEntry(
            rank=rank,
            student_id=str(row.student_id),
            username=row.username,
            xp=row.xp,
            streak_days=row.streak_days,
            badges=badges,
        ))
    return result


@router.get("/my-stats")
async def my_stats(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    gam = await session.get(V2Gamification, user.id)
    if not gam:
        return {"xp": 0, "streak_days": 0, "badges": [], "rank": None}
    stmt = select(V2Gamification).where(V2Gamification.xp > gam.xp)
    above = (await session.execute(stmt)).scalars().all()
    rank = len(above) + 1
    badges = [b for b in gam.badges.split(",") if b] if gam.badges else []
    return {"xp": gam.xp, "streak_days": gam.streak_days, "badges": badges, "rank": rank}
