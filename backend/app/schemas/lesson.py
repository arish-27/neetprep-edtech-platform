from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LessonCreate(BaseModel):
  title: str = Field(min_length=2, max_length=220)
  video_url: str = Field(min_length=5, max_length=800)
  duration: int = Field(default=0, ge=0)
  order_index: int = Field(default=0, ge=0)


class LessonPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  course_id: uuid.UUID
  title: str
  youtube_id: str | None = None
  duration: int
  order_index: int
  created_at: datetime
