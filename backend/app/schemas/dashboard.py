from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import Subject


class DashboardSummary(BaseModel):
  enrolled_courses: int
  watched_seconds: int
  completed_lessons: int
  quiz_attempts: int
  avg_score_pct: int


class StudentProgressAdmin(BaseModel):
  id: uuid.UUID
  username: str
  email: str
  created_at: datetime
  watched_seconds: int
  completed_lessons: int
  quiz_attempts: int
  avg_score_pct: int
  last_active_at: datetime | None = None


class SubjectProgress(BaseModel):
  subject: Subject
  progress_pct: int
  watched_seconds: int
  completed_lessons: int
  total_lessons: int
  total_duration: int


class CourseProgress(BaseModel):
  course_id: uuid.UUID
  progress_pct: int
  watched_seconds: int
  completed_lessons: int
  total_lessons: int
  total_duration: int
