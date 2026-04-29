from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.course import Course
from app.models.enums import Subject
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.ai import (
  AiChatRequest,
  AiChatResponse,
  AiQuizGenerateRequest,
  AiQuizGenerateResponse,
  AiRecommendationResponse,
  AiSummaryRequest,
  AiSummaryResponse,
)
from app.services.ai_service import chat_reply, generate_quiz as ai_generate_quiz, summarize
from app.services.dashboard_service import subject_progress

router = APIRouter(prefix="/ai", tags=["ai"])


def _require_premium(user: User) -> None:
  if user.role.value == "admin":
    return
  if not user.is_paid:
    raise AppError("Premium required", status_code=status.HTTP_403_FORBIDDEN, code="premium_required")


@router.post("/chat", response_model=AiChatResponse)
async def chat(req: AiChatRequest, user: User = Depends(get_current_user)):
  _require_premium(user)
  text, provider, model = await chat_reply(messages=req.messages, subject=req.subject, context=req.context)
  return AiChatResponse(reply=text, provider=provider, model=model)


@router.post("/summary", response_model=AiSummaryResponse)
async def summary(req: AiSummaryRequest, user: User = Depends(get_current_user)):
  _require_premium(user)
  out, provider, model = await summarize(title=req.title, description=req.description, subject=req.subject)
  return AiSummaryResponse(
    summary=out.summary,
    key_points=out.key_points,
    common_mistakes=out.common_mistakes,
    provider=provider,
    model=model,
  )


@router.post("/quiz/generate", response_model=AiQuizGenerateResponse)
async def generate_quiz(
  req: AiQuizGenerateRequest,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  _require_premium(user)

  # Pick an existing course for the subject (or create a lightweight practice course).
  res = await session.execute(
    select(Course).where(Course.subject == req.subject).order_by(Course.created_at.desc()).limit(1)
  )
  course = res.scalar_one_or_none()
  if not course:
    course = Course(
      title=f"{req.subject.value}: AI Practice",
      description="Auto-generated quizzes for quick NEET revision (portfolio demo).",
      subject=req.subject,
      thumbnail_url=None,
    )
    session.add(course)
    await session.commit()
    await session.refresh(course)

  generated, provider, model = await ai_generate_quiz(
    topic=req.topic, subject=req.subject, num_questions=req.num_questions
  )

  quiz = Quiz(course_id=course.id, title=generated.title)
  session.add(quiz)
  await session.flush()

  for q in generated.questions:
    session.add(
      Question(
        quiz_id=quiz.id,
        question_text=q.question_text,
        options=q.options,
        correct_answer=q.correct_answer,
        explanation=q.explanation,
      )
    )

  await session.commit()
  await session.refresh(quiz)

  return AiQuizGenerateResponse(
    quiz_id=str(quiz.id),
    title=quiz.title,
    question_count=len(generated.questions),
    provider=provider,
    model=model,
  )


@router.get("/recommendations", response_model=AiRecommendationResponse)
async def recommendations(
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  _require_premium(user)

  rows = await subject_progress(session, user_id=user.id)
  weak_subject: Subject = Subject.physics
  if rows:
    # Choose subject with lowest progress_pct.
    rows_sorted = sorted(rows, key=lambda r: int(r.get("progress_pct", 0)))
    weak_subject = rows_sorted[0].get("subject") or Subject.physics

  class_by_subject = {
    Subject.physics: "rec_phy_kinematics",
    Subject.biology: "rec_bio_human_physiology",
    Subject.chemistry: "live_neet_crash_course",
  }

  rec_id = class_by_subject.get(weak_subject, "rec_phy_kinematics")
  note = f"Focus on {weak_subject.value} next. Join a short class and then attempt a quiz to reinforce weak areas."

  return AiRecommendationResponse(
    weak_subject=weak_subject,
    recommended_class_ids=[rec_id],
    note=note,
    provider="mock",
    model=None,
  )
