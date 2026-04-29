from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Question(Base):
  __tablename__ = "questions"

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  quiz_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
  question_text: Mapped[str] = mapped_column(Text)
  options: Mapped[list[str]] = mapped_column(JSON, nullable=False)
  correct_answer: Mapped[int] = mapped_column(Integer)
  explanation: Mapped[str] = mapped_column(Text, default="")
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  quiz = relationship("Quiz", back_populates="questions")
