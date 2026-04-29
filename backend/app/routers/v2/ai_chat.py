"""
V2 — AI Study Assistant Chat
New table: v2_chat_messages
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import String, Text, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.settings import settings
from app.db.base import Base
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["v2-chat"])


class V2ChatMessage(Base):
    __tablename__ = "v2_chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20))   # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    subject: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class ChatRequest(BaseModel):
    message: str
    subject: str = ""


class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    role: str
    content: str
    subject: str
    created_at: datetime


class ChatResponse(BaseModel):
    reply: str
    source: str   # "ai" | "mock"


_MOCK_REPLIES = [
    "Great question! In NEET, this concept appears frequently. The key idea is to understand the underlying principle rather than memorizing formulas.",
    "Let me explain this step by step. First, identify what's given and what's asked. Then apply the relevant formula or concept.",
    "This is a common doubt among NEET aspirants. The trick is to remember the exception to the general rule here.",
    "Think of it this way: the concept connects to what you already know about conservation laws. Does that help?",
    "For NEET, focus on the NCERT definition first, then practice application-based questions on this topic.",
]

import random


async def _get_ai_reply(message: str, subject: str, history: list[dict]) -> tuple[str, str]:
    if not settings.OPENAI_API_KEY:
        return random.choice(_MOCK_REPLIES), "mock"
    try:
        import openai  # type: ignore
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        system = (
            "You are a NEET exam preparation assistant. "
            "Answer concisely and accurately. Focus on NCERT content. "
            f"Current subject context: {subject or 'General'}."
        )
        messages = [{"role": "system", "content": system}]
        for h in history[-6:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=400,
        )
        return resp.choices[0].message.content or "I couldn't generate a response.", "ai"
    except Exception:
        return random.choice(_MOCK_REPLIES), "mock"


@router.post("/message", response_model=ChatResponse)
async def send_message(
    data: ChatRequest,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    # Load recent history
    stmt = (
        select(V2ChatMessage)
        .where(V2ChatMessage.student_id == user.id)
        .order_by(V2ChatMessage.created_at.desc())
        .limit(6)
    )
    recent = list(reversed((await session.execute(stmt)).scalars().all()))
    history = [{"role": r.role, "content": r.content} for r in recent]

    # Save user message
    user_msg = V2ChatMessage(student_id=user.id, role="user", content=data.message, subject=data.subject)
    session.add(user_msg)

    # Get reply
    reply, source = await _get_ai_reply(data.message, data.subject, history)

    # Save assistant reply
    asst_msg = V2ChatMessage(student_id=user.id, role="assistant", content=reply, subject=data.subject)
    session.add(asst_msg)
    await session.commit()

    return ChatResponse(reply=reply, source=source)


@router.get("/history", response_model=list[ChatMessage])
async def get_history(
    limit: int = 30,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(V2ChatMessage)
        .where(V2ChatMessage.student_id == user.id)
        .order_by(V2ChatMessage.created_at.asc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.delete("/history")
async def clear_history(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(V2ChatMessage).where(V2ChatMessage.student_id == user.id)
    rows = (await session.execute(stmt)).scalars().all()
    for r in rows:
        await session.delete(r)
    await session.commit()
    return {"deleted": len(rows)}
