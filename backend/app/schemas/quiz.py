from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizCreate(BaseModel):
  title: str = Field(min_length=2, max_length=220)


class QuestionCreate(BaseModel):
  question_text: str = Field(min_length=5)
  options: list[str] = Field(min_length=2)
  correct_answer: int = Field(ge=0)
  explanation: str = ""


class QuestionPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  question_text: str
  options: list[str]
  correct_answer: int
  explanation: str = ""


class QuestionAdmin(QuestionPublic):
  pass


class QuizPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  course_id: uuid.UUID
  title: str
  created_at: datetime
  questions: list[QuestionPublic] = []


class QuizAdmin(QuizPublic):
  questions: list[QuestionAdmin] = []


class QuizSubmitRequest(BaseModel):
  answers: dict[str, int]


class QuizResultPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  user_id: uuid.UUID
  quiz_id: uuid.UUID
  score: int
  total_questions: int
  created_at: datetime


class QuizSubmitResponse(BaseModel):
  result: QuizResultPublic
  accuracy_pct: int
