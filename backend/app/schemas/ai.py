from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import Subject


class AiProvider(str):
  # string alias for docs; we still return literals below
  pass


class AiChatMessage(BaseModel):
  role: Literal["user", "assistant"]
  content: str = Field(min_length=1, max_length=4000)


class AiChatRequest(BaseModel):
  messages: list[AiChatMessage] = Field(min_length=1, max_length=24)
  subject: Subject | None = None
  context: str | None = Field(default=None, max_length=4000)


class AiChatResponse(BaseModel):
  reply: str
  provider: Literal["mock", "openai"]
  model: str | None = None


class AiSummaryRequest(BaseModel):
  title: str = Field(min_length=2, max_length=200)
  description: str | None = Field(default=None, max_length=4000)
  subject: Subject | None = None


class AiSummaryResponse(BaseModel):
  summary: str
  key_points: list[str]
  common_mistakes: list[str]
  provider: Literal["mock", "openai"]
  model: str | None = None


class AiQuizGenerateRequest(BaseModel):
  topic: str = Field(min_length=2, max_length=160)
  subject: Subject = Subject.physics
  num_questions: int = Field(default=5, ge=3, le=10)


class AiQuizGenerateResponse(BaseModel):
  quiz_id: str
  title: str
  question_count: int
  provider: Literal["mock", "openai"]
  model: str | None = None


class AiRecommendationResponse(BaseModel):
  weak_subject: Subject
  recommended_class_ids: list[str]
  note: str
  provider: Literal["mock", "openai"]
  model: str | None = None

