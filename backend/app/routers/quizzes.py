from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.pagination import pagination_params
from app.models.course import Course
from app.models.user import User
from app.schemas.pagination import Page
from app.schemas.quiz import (
  QuestionAdmin,
  QuestionCreate,
  QuestionPublic,
  QuizAdmin,
  QuizCreate,
  QuizPublic,
  QuizResultPublic,
  QuizSubmitRequest,
  QuizSubmitResponse,
)
from app.services.course_service import get_course
from app.services.quiz_service import (
  add_question,
  create_quiz,
  get_quiz,
  get_quiz_by_course,
  list_results,
  submit_quiz,
)
from app.services.teacher_service import upsert_student_performance

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/course/{course_id}", response_model=QuizPublic)
async def quiz_by_course(course_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
  await get_course(session, course_id)
  quiz = await get_quiz_by_course(session, course_id=course_id)
  if not quiz:
    raise HTTPException(status_code=404, detail="Quiz not found")
  return await get_quiz(session, quiz.id)


@router.post(
  "/course/{course_id}",
  response_model=QuizAdmin,
  status_code=status.HTTP_201_CREATED,
  dependencies=[Depends(require_admin)],
)
async def create_quiz_route(course_id: uuid.UUID, data: QuizCreate, session: AsyncSession = Depends(get_async_session)):
  await get_course(session, course_id)
  quiz = await create_quiz(session, course_id=course_id, title=data.title)
  return await get_quiz(session, quiz.id)


@router.post(
  "/{quiz_id}/questions",
  response_model=QuestionAdmin,
  status_code=status.HTTP_201_CREATED,
  dependencies=[Depends(require_admin)],
)
async def add_question_route(quiz_id: uuid.UUID, data: QuestionCreate, session: AsyncSession = Depends(get_async_session)):
  q = await add_question(session, quiz_id=quiz_id, data=data)
  return q


@router.get("/{quiz_id}", response_model=QuizPublic)
async def get_quiz_public(quiz_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
  quiz = await get_quiz(session, quiz_id)
  return QuizPublic(
    id=quiz.id,
    course_id=quiz.course_id,
    title=quiz.title,
    created_at=quiz.created_at,
    questions=[QuestionPublic.model_validate(q) for q in quiz.questions],
  )


@router.get(
  "/{quiz_id}/admin",
  response_model=QuizAdmin,
  dependencies=[Depends(require_admin)],
)
async def get_quiz_admin(quiz_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
  return await get_quiz(session, quiz_id)


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
async def submit(
  quiz_id: uuid.UUID,
  data: QuizSubmitRequest,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  result, accuracy = await submit_quiz(session, user_id=user.id, quiz_id=quiz_id, answers=data.answers)

  # Update subject-level student performance after quiz submission
  try:
    quiz = await get_quiz(session, quiz_id)
    course_res = await session.execute(select(Course).where(Course.id == quiz.course_id))
    course = course_res.scalar_one_or_none()
    if course:
      await upsert_student_performance(
        session,
        user_id=user.id,
        subject=course.subject,
        score_delta=result.score,
        questions_delta=result.total_questions,
        quiz_attempt=True,
        time_spent_delta=0,
      )
  except Exception:
    # Never fail the quiz submission because of analytics update
    pass

  return QuizSubmitResponse(result=result, accuracy_pct=accuracy)


@router.get("/{quiz_id}/results", response_model=Page[QuizResultPublic])
async def results(
  quiz_id: uuid.UUID,
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  limit, offset = pagination
  return await list_results(session, user_id=user.id, quiz_id=quiz_id, limit=limit, offset=offset)
