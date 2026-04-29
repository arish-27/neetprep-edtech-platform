from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import Subject, UploadFileType


class Upload(Base):
  __tablename__ = "uploads"

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  title: Mapped[str] = mapped_column(String(220))
  file_url: Mapped[str] = mapped_column(String(600))
  file_type: Mapped[UploadFileType] = mapped_column(Enum(UploadFileType, name="upload_file_type"), index=True)
  subject: Mapped[Subject] = mapped_column(
    Enum(Subject, name="upload_subject", values_callable=lambda enum: [e.value for e in enum]),
    index=True,
  )

  uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("users.id", ondelete="SET NULL"),
    index=True,
    nullable=True,
  )
  course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  uploader = relationship("User", back_populates="uploads")
  course = relationship("Course", back_populates="uploads")
