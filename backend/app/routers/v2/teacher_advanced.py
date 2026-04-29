"""
V2 — Advanced Teacher Features
Tables: v2_content_plans, v2_question_bank, v2_mock_tests, v2_announcements,
        v2_resources, v2_teacher_settings
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Boolean, Integer, String, Text, select, and_
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.enums import UserRole
from app.models.user import User

# ── DB Models ─────────────────────────────────────────────────────────────────

class V2ContentPlan(Base):
    __tablename__ = "v2_content_plans"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(220))
    week_number: Mapped[int] = mapped_column(Integer, default=1)
    topics: Mapped[list] = mapped_column(JSON, default=list)   # [{topic, status, notes}]
    target_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now(), onupdate=func.now())


class V2QuestionBank(Base):
    __tablename__ = "v2_question_bank"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(80), index=True)
    topic: Mapped[str] = mapped_column(String(200), default="")
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[list] = mapped_column(JSON)          # [str, str, str, str]
    correct_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    tags: Mapped[str] = mapped_column(String(300), default="")   # comma-separated
    source: Mapped[str] = mapped_column(String(20), default="manual")  # manual | ai
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class V2MockTest(Base):
    __tablename__ = "v2_mock_tests"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(220))
    subject: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text, default="")
    duration_min: Mapped[int] = mapped_column(Integer, default=60)
    total_marks: Mapped[int] = mapped_column(Integer, default=180)
    negative_marking: Mapped[bool] = mapped_column(Boolean, default=True)
    questions: Mapped[list] = mapped_column(JSON, default=list)  # list of question dicts
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class V2Announcement(Base):
    __tablename__ = "v2_announcements"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    teacher_name: Mapped[str] = mapped_column(String(120), default="")
    subject: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(220))
    body: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # low|normal|high|urgent
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class V2Resource(Base):
    __tablename__ = "v2_resources"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(80), index=True)
    topic: Mapped[str] = mapped_column(String(200), default="")
    title: Mapped[str] = mapped_column(String(220))
    resource_type: Mapped[str] = mapped_column(String(30), index=True)  # pdf|video|link|note
    url: Mapped[str] = mapped_column(String(600))
    description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class V2TeacherSettings(Base):
    __tablename__ = "v2_teacher_settings"
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    notification_doubts: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_submissions: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_announcements: Mapped[bool] = mapped_column(Boolean, default=True)
    default_difficulty: Mapped[int] = mapped_column(Integer, default=3)
    auto_publish_ai_questions: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now(), onupdate=func.now())


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_teacher(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=403, detail="Teacher access required")
    return user


# ═══════════════════════════════════════════════════════════════════════════════
# CONTENT PLANNER  /v2/content-plans
# ═══════════════════════════════════════════════════════════════════════════════

content_router = APIRouter(prefix="/content-plans", tags=["v2-content-plans"])


class TopicItem(BaseModel):
    topic: str
    status: str = "pending"   # pending | in_progress | done
    notes: str = ""


class ContentPlanCreate(BaseModel):
    title: str
    subject: str
    week_number: int = 1
    topics: list[TopicItem] = []
    target_date: str | None = None


class ContentPlanUpdate(BaseModel):
    title: str | None = None
    topics: list[TopicItem] | None = None
    target_date: str | None = None


class ContentPlanPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    subject: str
    title: str
    week_number: int
    topics: list
    target_date: str | None
    created_at: datetime
    updated_at: datetime


@content_router.post("", response_model=ContentPlanPublic, status_code=201)
async def create_plan(data: ContentPlanCreate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    p = V2ContentPlan(teacher_id=user.id, subject=data.subject, title=data.title,
                      week_number=data.week_number, topics=[t.model_dump() for t in data.topics],
                      target_date=data.target_date)
    session.add(p); await session.commit(); await session.refresh(p); return p


@content_router.get("", response_model=list[ContentPlanPublic])
async def list_plans(session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    rows = (await session.execute(select(V2ContentPlan).where(V2ContentPlan.teacher_id == user.id).order_by(V2ContentPlan.week_number))).scalars().all()
    return list(rows)


@content_router.patch("/{plan_id}", response_model=ContentPlanPublic)
async def update_plan(plan_id: uuid.UUID, data: ContentPlanUpdate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    p = await session.get(V2ContentPlan, plan_id)
    if not p or p.teacher_id != user.id: raise HTTPException(404, "Plan not found")
    if data.title is not None: p.title = data.title
    if data.topics is not None: p.topics = [t.model_dump() for t in data.topics]
    if data.target_date is not None: p.target_date = data.target_date
    await session.commit(); await session.refresh(p); return p


@content_router.delete("/{plan_id}", status_code=204)
async def delete_plan(plan_id: uuid.UUID, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    p = await session.get(V2ContentPlan, plan_id)
    if not p or p.teacher_id != user.id: raise HTTPException(404, "Plan not found")
    await session.delete(p); await session.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# QUESTION BANK  /v2/question-bank
# ═══════════════════════════════════════════════════════════════════════════════

qbank_router = APIRouter(prefix="/question-bank", tags=["v2-question-bank"])


class QuestionBankCreate(BaseModel):
    subject: str
    topic: str = ""
    question_text: str
    options: list[str]
    correct_index: int
    explanation: str = ""
    difficulty: int = 3
    tags: str = ""
    source: str = "manual"


class QuestionBankPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    subject: str
    topic: str
    question_text: str
    options: list
    correct_index: int
    explanation: str
    difficulty: int
    tags: str
    source: str
    created_at: datetime


@qbank_router.post("", response_model=QuestionBankPublic, status_code=201)
async def add_question(data: QuestionBankCreate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    q = V2QuestionBank(teacher_id=user.id, **data.model_dump())
    session.add(q); await session.commit(); await session.refresh(q); return q


@qbank_router.post("/bulk", response_model=list[QuestionBankPublic], status_code=201)
async def bulk_add(questions: list[QuestionBankCreate], session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    items = [V2QuestionBank(teacher_id=user.id, **q.model_dump()) for q in questions]
    session.add_all(items); await session.commit()
    for i in items: await session.refresh(i)
    return items


@qbank_router.get("", response_model=list[QuestionBankPublic])
async def list_questions(
    subject: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    difficulty: int | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(_require_teacher),
):
    stmt = select(V2QuestionBank).where(V2QuestionBank.teacher_id == user.id).order_by(V2QuestionBank.created_at.desc()).limit(limit)
    if subject: stmt = stmt.where(V2QuestionBank.subject == subject)
    if topic: stmt = stmt.where(V2QuestionBank.topic.ilike(f"%{topic}%"))
    if difficulty: stmt = stmt.where(V2QuestionBank.difficulty == difficulty)
    return list((await session.execute(stmt)).scalars().all())


@qbank_router.delete("/{question_id}", status_code=204)
async def delete_question(question_id: uuid.UUID, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    q = await session.get(V2QuestionBank, question_id)
    if not q or q.teacher_id != user.id: raise HTTPException(404, "Question not found")
    await session.delete(q); await session.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# MOCK TEST CREATOR  /v2/mock-tests
# ═══════════════════════════════════════════════════════════════════════════════

mocktest_router = APIRouter(prefix="/mock-tests-v2", tags=["v2-mock-tests"])


class MockTestCreate(BaseModel):
    title: str
    subject: str
    description: str = ""
    duration_min: int = 60
    total_marks: int = 180
    negative_marking: bool = True
    questions: list[dict] = []


class MockTestPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    subject: str
    description: str
    duration_min: int
    total_marks: int
    negative_marking: bool
    questions: list
    is_published: bool
    created_at: datetime


@mocktest_router.post("", response_model=MockTestPublic, status_code=201)
async def create_test(data: MockTestCreate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    t = V2MockTest(teacher_id=user.id, **data.model_dump())
    session.add(t); await session.commit(); await session.refresh(t); return t


@mocktest_router.get("", response_model=list[MockTestPublic])
async def list_tests(session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    rows = (await session.execute(select(V2MockTest).where(V2MockTest.teacher_id == user.id).order_by(V2MockTest.created_at.desc()))).scalars().all()
    return list(rows)


@mocktest_router.patch("/{test_id}/publish", response_model=MockTestPublic)
async def publish_test(test_id: uuid.UUID, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    t = await session.get(V2MockTest, test_id)
    if not t or t.teacher_id != user.id: raise HTTPException(404, "Test not found")
    t.is_published = not t.is_published
    await session.commit(); await session.refresh(t); return t


@mocktest_router.delete("/{test_id}", status_code=204)
async def delete_test(test_id: uuid.UUID, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    t = await session.get(V2MockTest, test_id)
    if not t or t.teacher_id != user.id: raise HTTPException(404, "Test not found")
    await session.delete(t); await session.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# ANNOUNCEMENTS  /v2/announcements
# ═══════════════════════════════════════════════════════════════════════════════

announce_router = APIRouter(prefix="/announcements", tags=["v2-announcements"])


class AnnouncementCreate(BaseModel):
    subject: str
    title: str
    body: str
    priority: str = "normal"
    pinned: bool = False


class AnnouncementPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    teacher_name: str
    subject: str
    title: str
    body: str
    priority: str
    pinned: bool
    created_at: datetime


@announce_router.post("", response_model=AnnouncementPublic, status_code=201)
async def create_announcement(data: AnnouncementCreate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    a = V2Announcement(teacher_id=user.id, teacher_name=user.username, **data.model_dump())
    session.add(a); await session.commit(); await session.refresh(a); return a


@announce_router.get("", response_model=list[AnnouncementPublic])
async def list_announcements(
    subject: str | None = Query(default=None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(V2Announcement).order_by(V2Announcement.pinned.desc(), V2Announcement.created_at.desc()).limit(50)
    if subject: stmt = stmt.where(V2Announcement.subject == subject)
    return list((await session.execute(stmt)).scalars().all())


@announce_router.delete("/{ann_id}", status_code=204)
async def delete_announcement(ann_id: uuid.UUID, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    a = await session.get(V2Announcement, ann_id)
    if not a or a.teacher_id != user.id: raise HTTPException(404, "Announcement not found")
    await session.delete(a); await session.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# RESOURCE LIBRARY  /v2/resources
# ═══════════════════════════════════════════════════════════════════════════════

resource_router = APIRouter(prefix="/resources", tags=["v2-resources"])


class ResourceCreate(BaseModel):
    subject: str
    topic: str = ""
    title: str
    resource_type: str   # pdf | video | link | note
    url: str
    description: str = ""
    tags: str = ""


class ResourcePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    teacher_id: uuid.UUID
    subject: str
    topic: str
    title: str
    resource_type: str
    url: str
    description: str
    tags: str
    created_at: datetime


@resource_router.post("", response_model=ResourcePublic, status_code=201)
async def add_resource(data: ResourceCreate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    r = V2Resource(teacher_id=user.id, **data.model_dump())
    session.add(r); await session.commit(); await session.refresh(r); return r


@resource_router.get("", response_model=list[ResourcePublic])
async def list_resources(
    subject: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(V2Resource).order_by(V2Resource.created_at.desc()).limit(100)
    if subject: stmt = stmt.where(V2Resource.subject == subject)
    if resource_type: stmt = stmt.where(V2Resource.resource_type == resource_type)
    return list((await session.execute(stmt)).scalars().all())


@resource_router.delete("/{resource_id}", status_code=204)
async def delete_resource(resource_id: uuid.UUID, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    r = await session.get(V2Resource, resource_id)
    if not r or r.teacher_id != user.id: raise HTTPException(404, "Resource not found")
    await session.delete(r); await session.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# TEACHER SETTINGS  /v2/teacher-settings
# ═══════════════════════════════════════════════════════════════════════════════

settings_router = APIRouter(prefix="/teacher-settings", tags=["v2-teacher-settings"])


class TeacherSettingsUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    notification_doubts: bool | None = None
    notification_submissions: bool | None = None
    notification_announcements: bool | None = None
    default_difficulty: int | None = None
    auto_publish_ai_questions: bool | None = None


class TeacherSettingsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    teacher_id: uuid.UUID
    display_name: str
    bio: str
    notification_doubts: bool
    notification_submissions: bool
    notification_announcements: bool
    default_difficulty: int
    auto_publish_ai_questions: bool
    updated_at: datetime


@settings_router.get("", response_model=TeacherSettingsPublic)
async def get_settings(session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    s = await session.get(V2TeacherSettings, user.id)
    if not s:
        s = V2TeacherSettings(teacher_id=user.id, display_name=user.username)
        session.add(s); await session.commit(); await session.refresh(s)
    return s


@settings_router.put("", response_model=TeacherSettingsPublic)
async def update_settings(data: TeacherSettingsUpdate, session: AsyncSession = Depends(get_async_session), user: User = Depends(_require_teacher)):
    s = await session.get(V2TeacherSettings, user.id)
    if not s:
        s = V2TeacherSettings(teacher_id=user.id, display_name=user.username)
        session.add(s)
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(s, field, val)
    await session.commit(); await session.refresh(s); return s
