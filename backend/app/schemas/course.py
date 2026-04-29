from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Subject


class CourseCreate(BaseModel):
  title: str = Field(min_length=2, max_length=200)
  description: str = ""
  subject: Subject
  thumbnail_url: str | None = None


class CourseUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=2, max_length=200)
  description: str | None = None
  subject: Subject | None = None
  thumbnail_url: str | None = None


class CoursePublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  title: str
  description: str
  subject: Subject
  thumbnail_url: str | None
  created_at: datetime

