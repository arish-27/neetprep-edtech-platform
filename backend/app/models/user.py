from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import UserRole


class User(Base):
  __tablename__ = "users"

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  username: Mapped[str] = mapped_column(String(80), index=True)
  email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
  hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
  role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), default=UserRole.student, index=True)
  is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  device_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
  progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
  demo_class_progress = relationship("DemoClassProgress", back_populates="user", cascade="all, delete-orphan")
  quiz_results = relationship("QuizResult", back_populates="user", cascade="all, delete-orphan")
  teacher_subject = relationship("TeacherSubject", back_populates="user", uselist=False, cascade="all, delete-orphan")
  student_performances = relationship("StudentPerformance", back_populates="user", cascade="all, delete-orphan")
  uploads = relationship("Upload", back_populates="uploader")
