from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DemoClassProgressUpdate(BaseModel):
  watched_seconds: int = Field(ge=0)
  completed: bool = False


class DemoClassProgressPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  user_id: uuid.UUID
  class_id: str
  watched_seconds: int
  completed: bool
  created_at: datetime
  updated_at: datetime

