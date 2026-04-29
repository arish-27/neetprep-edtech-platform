from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import Subject


class DemoClassType(str, Enum):
  recorded = "recorded"
  live = "live"


class DemoClassPublic(BaseModel):
  id: str = Field(min_length=2, max_length=64)
  type: DemoClassType
  subject: Subject
  title: str = Field(min_length=2, max_length=140)
  instructor: str = Field(min_length=2, max_length=80)
  duration_min: int = Field(ge=1, le=600)

  # Used only for "live" classes.
  starts_at: datetime | None = None
  ends_at: datetime | None = None


class DemoVideoSource(BaseModel):
  provider: Literal["youtube"] = "youtube"
  youtube_id: str = Field(min_length=6, max_length=32)


class DemoAccessResponse(BaseModel):
  access: bool
  reason: Literal["ok", "upgrade_required", "not_found"] | None = None
  video: DemoVideoSource | None = None

