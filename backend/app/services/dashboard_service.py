from __future__ import annotations

import uuid

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.demo_class_progress import DemoClassProgress
from app.models.enrollment import Enrollment
from app.models.enums import Subject, UserRole
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.quiz_result import QuizResult
from app.models.user import User
from app.schemas.pagination import Page, PageMeta


def _pct(*, watched_seconds: int, total_duration: int, completed_lessons: int, total_lessons: int) -> int:
  if total_duration > 0:
    return int(round(min(1.0, watched_seconds / total_duration) * 100))
  if total_lessons > 0:
    return int(round(min(1.0, completed_lessons / total_lessons) * 100))
  return 0


async def user_summary(session: AsyncSession, *, user_id: uuid.UUID) -> dict:
  enrolled_courses = int(
    (await session.execute(select(func.count()).select_from(Enrollment).where(Enrollment.user_id == user_id))).scalar_one()
  )

  lesson_watched_seconds = int(
    (
      await session.execute(
        select(func.coalesce(func.sum(Progress.watched_seconds), 0)).where(Progress.user_id == user_id)
      )
    ).scalar_one()
  )

  demo_watched_seconds = int(
    (
      await session.execute(
        select(func.coalesce(func.sum(DemoClassProgress.watched_seconds), 0)).where(DemoClassProgress.user_id == user_id)
      )
    ).scalar_one()
  )

  watched_seconds = lesson_watched_seconds + demo_watched_seconds

  completed_lessons = int(
    (
      await session.execute(
        select(func.count()).select_from(Progress).where(Progress.user_id == user_id, Progress.completed.is_(True))
      )
    ).scalar_one()
  )

  quiz_attempts = int(
    (await session.execute(select(func.count()).select_from(QuizResult).where(QuizResult.user_id == user_id))).scalar_one()
  )

  agg = await session.execute(
    select(
      func.coalesce(func.sum(QuizResult.score), 0),
      func.coalesce(func.sum(QuizResult.total_questions), 0),
    ).where(QuizResult.user_id == user_id)
  )
  total_score, total_q = agg.one()
  avg_score_pct = int(round((total_score / total_q) * 100)) if total_q else 0

  return {
    "enrolled_courses": enrolled_courses,
    "watched_seconds": watched_seconds,
    "completed_lessons": completed_lessons,
    "quiz_attempts": quiz_attempts,
    "avg_score_pct": avg_score_pct,
  }


async def list_user_quiz_results(session: AsyncSession, *, user_id: uuid.UUID, limit: int, offset: int):
  total_stmt = select(func.count()).select_from(QuizResult).where(QuizResult.user_id == user_id)
  total = int((await session.execute(total_stmt)).scalar_one())
  stmt = (
    select(QuizResult)
    .where(QuizResult.user_id == user_id)
    .order_by(QuizResult.created_at.desc())
    .limit(limit)
    .offset(offset)
  )
  items = (await session.execute(stmt)).scalars().all()
  meta = PageMeta(total=total, limit=limit, offset=offset, has_more=(offset + limit) < total)
  return Page(items=items, meta=meta)


async def list_completed_courses(session: AsyncSession, *, user_id: uuid.UUID, limit: int, offset: int):
  lessons_total = (
    select(Lesson.course_id.label("course_id"), func.count(Lesson.id).label("total_lessons"))
    .group_by(Lesson.course_id)
    .subquery()
  )

  completed_total = (
    select(Lesson.course_id.label("course_id"), func.count(Progress.id).label("completed_lessons"))
    .join(Lesson, Lesson.id == Progress.lesson_id)
    .where(Progress.user_id == user_id, Progress.completed.is_(True))
    .group_by(Lesson.course_id)
    .subquery()
  )

  base = (
    select(Course)
    .join(lessons_total, lessons_total.c.course_id == Course.id)
    .join(completed_total, completed_total.c.course_id == Course.id, isouter=True)
    .where(func.coalesce(completed_total.c.completed_lessons, 0) >= lessons_total.c.total_lessons)
    .order_by(Course.created_at.desc())
  )

  total = int((await session.execute(select(func.count()).select_from(base.order_by(None).subquery()))).scalar_one())
  items = (await session.execute(base.limit(limit).offset(offset))).scalars().all()
  meta = PageMeta(total=total, limit=limit, offset=offset, has_more=(offset + limit) < total)
  return Page(items=items, meta=meta)


async def admin_students_summary(session: AsyncSession, *, limit: int, offset: int):
  total_stmt = select(func.count()).select_from(User).where(User.role == UserRole.student)
  total = int((await session.execute(total_stmt)).scalar_one())

  stmt = (
    select(User)
    .where(User.role == UserRole.student)
    .order_by(User.created_at.desc())
    .limit(limit)
    .offset(offset)
  )
  users = (await session.execute(stmt)).scalars().all()
  user_ids = [u.id for u in users]

  if not user_ids:
    return Page(items=[], meta=PageMeta(total=total, limit=limit, offset=offset, has_more=False))

  progress_agg = await session.execute(
    select(
      Progress.user_id,
      func.coalesce(func.sum(Progress.watched_seconds), 0).label("watched_seconds"),
      func.coalesce(func.sum(case((Progress.completed.is_(True), 1), else_=0)), 0).label("completed_lessons"),
      func.coalesce(func.max(Progress.updated_at), func.max(Progress.created_at)).label("last_active_at"),
    )
    .where(Progress.user_id.in_(user_ids))
    .group_by(Progress.user_id)
  )
  progress_map = {row.user_id: row for row in progress_agg.all()}

  demo_progress_agg = await session.execute(
    select(
      DemoClassProgress.user_id,
      func.coalesce(func.sum(DemoClassProgress.watched_seconds), 0).label("watched_seconds"),
      func.coalesce(func.sum(case((DemoClassProgress.completed.is_(True), 1), else_=0)), 0).label("completed_lessons"),
      func.coalesce(func.max(DemoClassProgress.updated_at), func.max(DemoClassProgress.created_at)).label("last_active_at"),
    )
    .where(DemoClassProgress.user_id.in_(user_ids))
    .group_by(DemoClassProgress.user_id)
  )
  demo_progress_map = {row.user_id: row for row in demo_progress_agg.all()}

  quiz_agg = await session.execute(
    select(
      QuizResult.user_id,
      func.count(QuizResult.id).label("attempts"),
      func.coalesce(func.sum(QuizResult.score), 0).label("score_sum"),
      func.coalesce(func.sum(QuizResult.total_questions), 0).label("total_sum"),
      func.coalesce(func.max(QuizResult.created_at), None).label("last_quiz_at"),
    )
    .where(QuizResult.user_id.in_(user_ids))
    .group_by(QuizResult.user_id)
  )
  quiz_map = {row.user_id: row for row in quiz_agg.all()}

  items = []
  for u in users:
    p = progress_map.get(u.id)
    dp = demo_progress_map.get(u.id)
    q = quiz_map.get(u.id)
    score_pct = 0
    if q and q.total_sum:
      score_pct = int(round((q.score_sum / q.total_sum) * 100))

    watched_seconds = int(getattr(p, "watched_seconds", 0) or 0) + int(getattr(dp, "watched_seconds", 0) or 0)
    completed_lessons = int(getattr(p, "completed_lessons", 0) or 0) + int(getattr(dp, "completed_lessons", 0) or 0)
    last_progress_at = None
    if getattr(p, "last_active_at", None) and getattr(dp, "last_active_at", None):
      last_progress_at = max(getattr(p, "last_active_at"), getattr(dp, "last_active_at"))
    else:
      last_progress_at = getattr(p, "last_active_at", None) or getattr(dp, "last_active_at", None)

    items.append(
      {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "created_at": u.created_at,
        "watched_seconds": watched_seconds,
        "completed_lessons": completed_lessons,
        "quiz_attempts": int(q.attempts) if q else 0,
        "avg_score_pct": score_pct,
        "last_active_at": last_progress_at or getattr(q, "last_quiz_at", None),
      }
    )

  meta = PageMeta(total=total, limit=limit, offset=offset, has_more=(offset + limit) < total)
  return Page(items=items, meta=meta)


async def subject_progress(session: AsyncSession, *, user_id: uuid.UUID):
  """
  Returns per-subject progress for the current user based on enrolled courses only.
  Progress starts at 0 until the user enrolls & watches lessons.
  """
  stmt = (
    select(
      Course.subject.label("subject"),
      func.count(Lesson.id).label("total_lessons"),
      func.coalesce(func.sum(Lesson.duration), 0).label("total_duration"),
      func.coalesce(func.sum(Progress.watched_seconds), 0).label("watched_seconds"),
      func.coalesce(func.sum(case((Progress.completed.is_(True), 1), else_=0)), 0).label("completed_lessons"),
    )
    .join(Enrollment, (Enrollment.course_id == Course.id) & (Enrollment.user_id == user_id))
    .join(Lesson, Lesson.course_id == Course.id)
    .join(Progress, (Progress.lesson_id == Lesson.id) & (Progress.user_id == user_id), isouter=True)
    .group_by(Course.subject)
  )

  rows = (await session.execute(stmt)).all()
  row_map = {r.subject: r for r in rows}

  items = []
  for s in Subject:
    r = row_map.get(s)
    watched_seconds = int(getattr(r, "watched_seconds", 0) or 0)
    completed_lessons = int(getattr(r, "completed_lessons", 0) or 0)
    total_lessons = int(getattr(r, "total_lessons", 0) or 0)
    total_duration = int(getattr(r, "total_duration", 0) or 0)
    items.append(
      {
        "subject": s,
        "progress_pct": _pct(
          watched_seconds=watched_seconds,
          total_duration=total_duration,
          completed_lessons=completed_lessons,
          total_lessons=total_lessons,
        ),
        "watched_seconds": watched_seconds,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "total_duration": total_duration,
      }
    )

  return items


async def list_user_course_progress(session: AsyncSession, *, user_id: uuid.UUID, limit: int, offset: int):
  total_stmt = select(func.count()).select_from(Enrollment).where(Enrollment.user_id == user_id)
  total = int((await session.execute(total_stmt)).scalar_one())
  if total == 0:
    return Page(items=[], meta=PageMeta(total=0, limit=limit, offset=offset, has_more=False))

  course_ids = (
    await session.execute(
      select(Enrollment.course_id)
      .where(Enrollment.user_id == user_id)
      .order_by(Enrollment.created_at.desc())
      .limit(limit)
      .offset(offset)
    )
  ).scalars().all()

  if not course_ids:
    meta = PageMeta(total=total, limit=limit, offset=offset, has_more=False)
    return Page(items=[], meta=meta)

  totals = await session.execute(
    select(
      Lesson.course_id.label("course_id"),
      func.count(Lesson.id).label("total_lessons"),
      func.coalesce(func.sum(Lesson.duration), 0).label("total_duration"),
    )
    .where(Lesson.course_id.in_(course_ids))
    .group_by(Lesson.course_id)
  )
  totals_map = {r.course_id: r for r in totals.all()}

  prog = await session.execute(
    select(
      Lesson.course_id.label("course_id"),
      func.coalesce(func.sum(Progress.watched_seconds), 0).label("watched_seconds"),
      func.coalesce(func.sum(case((Progress.completed.is_(True), 1), else_=0)), 0).label("completed_lessons"),
    )
    .join(Lesson, Lesson.id == Progress.lesson_id)
    .where(Progress.user_id == user_id, Lesson.course_id.in_(course_ids))
    .group_by(Lesson.course_id)
  )
  prog_map = {r.course_id: r for r in prog.all()}

  items = []
  for course_id in course_ids:
    t = totals_map.get(course_id)
    p = prog_map.get(course_id)
    watched_seconds = int(getattr(p, "watched_seconds", 0) or 0)
    completed_lessons = int(getattr(p, "completed_lessons", 0) or 0)
    total_lessons = int(getattr(t, "total_lessons", 0) or 0)
    total_duration = int(getattr(t, "total_duration", 0) or 0)
    items.append(
      {
        "course_id": course_id,
        "progress_pct": _pct(
          watched_seconds=watched_seconds,
          total_duration=total_duration,
          completed_lessons=completed_lessons,
          total_lessons=total_lessons,
        ),
        "watched_seconds": watched_seconds,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "total_duration": total_duration,
      }
    )

  meta = PageMeta(total=total, limit=limit, offset=offset, has_more=(offset + limit) < total)
  return Page(items=items, meta=meta)
