from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Quiz(Base):
  __tablename__ = "quizzes"

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
  title: Mapped[str] = mapped_column(String(220))
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  course = relationship("Course", back_populates="quizzes")
  questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
  results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")

