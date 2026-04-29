from __future__ import annotations

import uuid

from fastapi import status
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.enums import Subject, UserRole
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.quiz import Quiz
from app.models.quiz_result import QuizResult
from app.models.student_performance import StudentPerformance
from app.models.teacher_subject import TeacherSubject
from app.models.user import User
from app.schemas.teacher import (
    RecentQuizActivity,
    StudentSummaryForTeacher,
    TeacherDashboard,
)


# ── Teacher subject assignment ────────────────────────────────────────────────

async def get_teacher_subject(session: AsyncSession, *, user_id: uuid.UUID) -> TeacherSubject | None:
    res = await session.execute(
        select(TeacherSubject).where(TeacherSubject.user_id == user_id)
    )
    return res.scalar_one_or_none()


async def assign_teacher_subject(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    subject: Subject,
) -> TeacherSubject:
    """Assign (or update) a teacher's subject. One teacher → one subject."""
    # Verify the user exists and is a teacher
    res = await session.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise AppError("User not found", status_code=status.HTTP_404_NOT_FOUND, code="user_not_found")
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise AppError(
            "User is not a teacher",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="not_a_teacher",
        )

    existing = await get_teacher_subject(session, user_id=user_id)
    if existing:
        existing.subject = subject
        await session.commit()
        await session.refresh(existing)
        return existing

    ts = TeacherSubject(user_id=user_id, subject=subject)
    session.add(ts)
    await session.commit()
    await session.refresh(ts)
    return ts


# ── Student performance upsert ────────────────────────────────────────────────

async def upsert_student_performance(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    subject: Subject,
    score_delta: int = 0,
    questions_delta: int = 0,
    quiz_attempt: bool = False,
    completed_lessons_delta: int = 0,
    total_lessons_override: int | None = None,
    watched_seconds_delta: int = 0,
    time_spent_delta: int = 0,
) -> StudentPerformance:
    """Atomically upsert a student's subject-level performance record."""
    res = await session.execute(
        select(StudentPerformance).where(
            and_(
                StudentPerformance.user_id == user_id,
                StudentPerformance.subject == subject,
            )
        )
    )
    perf = res.scalar_one_or_none()

    if perf is None:
        perf = StudentPerformance(
            user_id=user_id,
            subject=subject,
        )
        session.add(perf)

    perf.total_score += score_delta
    perf.total_questions += questions_delta
    if quiz_attempt:
        perf.quiz_attempts += 1
    perf.completed_lessons += completed_lessons_delta
    if total_lessons_override is not None:
        perf.total_lessons = total_lessons_override
    perf.watched_seconds += watched_seconds_delta
    perf.time_spent_seconds += time_spent_delta

    # Recompute derived fields
    if perf.total_questions > 0:
        perf.accuracy_pct = round((perf.total_score / perf.total_questions) * 100, 1)
    if perf.total_lessons > 0:
        perf.progress_pct = round(
            min(1.0, perf.completed_lessons / perf.total_lessons) * 100, 1
        )

    await session.commit()
    await session.refresh(perf)
    return perf


# ── Teacher dashboard ─────────────────────────────────────────────────────────

async def get_teacher_dashboard(
    session: AsyncSession,
    *,
    teacher_id: uuid.UUID,
) -> TeacherDashboard:
    """Build the full teacher dashboard for the teacher's assigned subject."""
    ts = await get_teacher_subject(session, user_id=teacher_id)
    if not ts:
        raise AppError(
            "No subject assigned to this teacher. Ask an admin to assign one.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="no_subject_assigned",
        )

    subject = ts.subject

    # ── All students with performance data for this subject ───────────────────
    stmt = (
        select(User, StudentPerformance)
        .join(
            StudentPerformance,
            and_(
                StudentPerformance.user_id == User.id,
                StudentPerformance.subject == subject,
            ),
        )
        .where(User.role == UserRole.student)
        .order_by(StudentPerformance.accuracy_pct.desc())
    )
    rows = (await session.execute(stmt)).all()

    all_students: list[StudentSummaryForTeacher] = []
    for user, perf in rows:
        all_students.append(
            StudentSummaryForTeacher(
                user_id=user.id,
                username=user.username,
                email=user.email,
                accuracy_pct=perf.accuracy_pct,
                quiz_attempts=perf.quiz_attempts,
                completed_lessons=perf.completed_lessons,
                progress_pct=perf.progress_pct,
                watched_seconds=perf.watched_seconds,
                is_weak=perf.accuracy_pct < 40.0,
                last_active=perf.updated_at,
            )
        )

    total_students = len(all_students)
    avg_class_score = (
        round(sum(s.accuracy_pct for s in all_students) / total_students, 1)
        if total_students
        else 0.0
    )

    # Top 5 by accuracy
    top_students = sorted(all_students, key=lambda s: s.accuracy_pct, reverse=True)[:5]
    # Weak students (accuracy < 40%)
    weak_students = [s for s in all_students if s.is_weak]

    # ── Recent quiz activity for this subject ─────────────────────────────────
    recent_stmt = (
        select(QuizResult, User, Quiz)
        .join(User, User.id == QuizResult.user_id)
        .join(Quiz, Quiz.id == QuizResult.quiz_id)
        .join(Course, Course.id == Quiz.course_id)
        .where(
            and_(
                Course.subject == subject,
                User.role == UserRole.student,
            )
        )
        .order_by(QuizResult.created_at.desc())
        .limit(20)
    )
    recent_rows = (await session.execute(recent_stmt)).all()

    recent_activity: list[RecentQuizActivity] = []
    for qr, user, quiz in recent_rows:
        acc = round((qr.score / qr.total_questions) * 100, 1) if qr.total_questions else 0.0
        recent_activity.append(
            RecentQuizActivity(
                student_name=user.username,
                student_email=user.email,
                quiz_title=quiz.title,
                score=qr.score,
                total_questions=qr.total_questions,
                accuracy_pct=acc,
                submitted_at=qr.created_at,
            )
        )

    return TeacherDashboard(
        subject=subject,
        total_students=total_students,
        avg_class_score_pct=avg_class_score,
        top_students=top_students,
        weak_students=weak_students,
        all_students=all_students,
        recent_quiz_activity=recent_activity,
    )


# ── Student performance for student's own view ───────────────────────────────

async def get_student_subject_performance(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
) -> list[StudentPerformance]:
    """Return all subject-level performance records for a student."""
    res = await session.execute(
        select(StudentPerformance)
        .where(StudentPerformance.user_id == user_id)
        .order_by(StudentPerformance.subject)
    )
    return list(res.scalars().all())
