from __future__ import annotations

import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.quiz_result import QuizResult
from app.utils.pagination import paginate


async def get_quiz_by_course(session: AsyncSession, *, course_id: uuid.UUID) -> Quiz | None:
  res = await session.execute(
    select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.created_at.desc()).limit(1)
  )
  return res.scalar_one_or_none()


async def get_quiz(session: AsyncSession, quiz_id: uuid.UUID) -> Quiz:
  res = await session.execute(
    select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions))
  )
  quiz = res.scalar_one_or_none()
  if not quiz:
    raise AppError("Quiz not found", status_code=status.HTTP_404_NOT_FOUND, code="quiz_not_found")
  return quiz


async def create_quiz(session: AsyncSession, *, course_id: uuid.UUID, title: str) -> Quiz:
  quiz = Quiz(course_id=course_id, title=title)
  session.add(quiz)
  await session.commit()
  await session.refresh(quiz)
  return quiz


async def add_question(session: AsyncSession, *, quiz_id: uuid.UUID, data) -> Question:
  quiz = await get_quiz(session, quiz_id)
  if data.correct_answer >= len(data.options):
    raise AppError("correct_answer out of range", status_code=status.HTTP_400_BAD_REQUEST, code="invalid_question")
  q = Question(
    quiz_id=quiz.id,
    question_text=data.question_text,
    options=data.options,
    correct_answer=data.correct_answer,
    explanation=getattr(data, "explanation", "") or "",
  )
  session.add(q)
  await session.commit()
  await session.refresh(q)
  return q


async def submit_quiz(
  session: AsyncSession,
  *,
  user_id: uuid.UUID,
  quiz_id: uuid.UUID,
  answers: dict[str, int],
) -> tuple[QuizResult, int]:
  quiz = await get_quiz(session, quiz_id)
  total = len(quiz.questions)
  if total == 0:
    raise AppError("Quiz has no questions", status_code=status.HTTP_400_BAD_REQUEST, code="empty_quiz")

  score = 0
  for q in quiz.questions:
    picked = answers.get(str(q.id))
    if picked is None:
      continue
    if int(picked) == int(q.correct_answer):
      score += 1

  result = QuizResult(user_id=user_id, quiz_id=quiz_id, score=score, total_questions=total)
  session.add(result)
  await session.commit()
  await session.refresh(result)

  accuracy = round((score / total) * 100)
  return result, accuracy


async def list_results(session: AsyncSession, *, user_id: uuid.UUID, quiz_id: uuid.UUID, limit: int, offset: int):
  stmt = (
    select(QuizResult)
    .where(QuizResult.user_id == user_id, QuizResult.quiz_id == quiz_id)
    .order_by(QuizResult.created_at.desc())
  )
  return await paginate(session, stmt, limit=limit, offset=offset)
