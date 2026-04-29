from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import Subject


class StudentPerformance(Base):
  """Aggregated per-student, per-subject performance snapshot.

  Updated on every quiz submission and lesson progress event.
  """

  __tablename__ = "student_performance"
  __table_args__ = (
    UniqueConstraint("user_id", "subject", name="uq_student_performance_user_subject"),
  )

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("users.id", ondelete="CASCADE"),
    index=True,
    nullable=False,
  )
  subject: Mapped[Subject] = mapped_column(
    Enum(Subject, name="course_subject", create_constraint=False,
         values_callable=lambda enum: [e.value for e in enum]),
    nullable=False,
    index=True,
  )

  # Quiz performance
  total_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  quiz_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  accuracy_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

  # Lesson progress
  completed_lessons: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  total_lessons: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  watched_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  progress_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

  # Time tracking
  time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )

  user = relationship("User", back_populates="student_performances")
