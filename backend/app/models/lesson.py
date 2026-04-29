from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.utils.youtube import extract_youtube_id


class Lesson(Base):
  __tablename__ = "lessons"
  __table_args__ = (UniqueConstraint("course_id", "order_index", name="uq_lesson_course_order"),)

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
  title: Mapped[str] = mapped_column(String(220))
  video_url: Mapped[str] = mapped_column(String(800))
  duration: Mapped[int] = mapped_column(Integer, default=0)  # seconds
  order_index: Mapped[int] = mapped_column(Integer, default=0)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  course = relationship("Course", back_populates="lessons")
  progress = relationship("Progress", back_populates="lesson", cascade="all, delete-orphan")

  @property
  def youtube_id(self) -> str | None:
    return extract_youtube_id(self.video_url)
