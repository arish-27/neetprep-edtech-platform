from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class QuizResult(Base):
  __tablename__ = "quiz_results"

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
  quiz_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
  score: Mapped[int] = mapped_column(Integer)
  total_questions: Mapped[int] = mapped_column(Integer)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  user = relationship("User", back_populates="quiz_results")
  quiz = relationship("Quiz", back_populates="results")

