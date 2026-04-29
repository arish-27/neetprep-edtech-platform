from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import Subject


class TeacherSubject(Base):
  """Maps a teacher (user) to exactly one subject they are responsible for."""

  __tablename__ = "teacher_subjects"
  __table_args__ = (UniqueConstraint("user_id", name="uq_teacher_subject_user"),)

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
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  user = relationship("User", back_populates="teacher_subject")
