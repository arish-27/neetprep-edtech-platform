from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import Subject


class Course(Base):
  __tablename__ = "courses"

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  title: Mapped[str] = mapped_column(String(200), index=True)
  description: Mapped[str] = mapped_column(Text, default="")
  subject: Mapped[Subject] = mapped_column(
    Enum(Subject, name="course_subject", values_callable=lambda enum: [e.value for e in enum]),
    index=True,
  )
  thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index")
  quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
  enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
  uploads = relationship("Upload", back_populates="course")
