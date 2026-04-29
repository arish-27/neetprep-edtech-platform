from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import Subject


# ── Teacher subject assignment ────────────────────────────────────────────────

class TeacherSubjectPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    subject: Subject
    created_at: datetime


class TeacherSubjectAssign(BaseModel):
    """Body for assigning a subject to a teacher (admin only)."""
    user_id: uuid.UUID
    subject: Subject


class TeacherSubjectSelfAssign(BaseModel):
    """Body for a teacher self-assigning their subject (no user_id needed)."""
    subject: Subject


# ── Student performance (per subject) ────────────────────────────────────────

class StudentPerformancePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    subject: Subject
    total_score: int
    total_questions: int
    quiz_attempts: int
    accuracy_pct: float
    completed_lessons: int
    total_lessons: int
    watched_seconds: int
    progress_pct: float
    time_spent_seconds: int
    updated_at: datetime


class StudentPerformanceUpsert(BaseModel):
    """Used internally to upsert a student's subject performance."""
    subject: Subject
    score_delta: int = 0
    questions_delta: int = 0
    quiz_attempt: bool = False
    completed_lessons_delta: int = 0
    total_lessons: int | None = None
    watched_seconds_delta: int = 0
    time_spent_delta: int = 0


# ── Teacher dashboard response ────────────────────────────────────────────────

class StudentSummaryForTeacher(BaseModel):
    """One student's performance as seen by their subject teacher."""
    user_id: uuid.UUID
    username: str
    email: str
    accuracy_pct: float
    quiz_attempts: int
    completed_lessons: int
    progress_pct: float
    watched_seconds: int
    is_weak: bool  # True when accuracy < 40%
    last_active: datetime | None = None


class TopicPerformance(BaseModel):
    """Aggregated performance for a topic/chapter within the teacher's subject."""
    topic: str
    avg_accuracy_pct: float
    attempt_count: int


class TeacherDashboard(BaseModel):
    """Full teacher dashboard payload."""
    subject: Subject
    total_students: int
    avg_class_score_pct: float
    top_students: list[StudentSummaryForTeacher]
    weak_students: list[StudentSummaryForTeacher]
    all_students: list[StudentSummaryForTeacher]
    recent_quiz_activity: list[RecentQuizActivity]


class RecentQuizActivity(BaseModel):
    """A single quiz result entry for the teacher's subject."""
    student_name: str
    student_email: str
    quiz_title: str
    score: int
    total_questions: int
    accuracy_pct: float
    submitted_at: datetime


# Fix forward reference
TeacherDashboard.model_rebuild()
