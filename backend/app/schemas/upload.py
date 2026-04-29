from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Subject, UploadFileType


class UploadPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  title: str
  file_url: str
  file_type: UploadFileType
  subject: Subject
  uploaded_by: uuid.UUID
  course_id: uuid.UUID | None
  created_at: datetime


class UploadCreateMeta(BaseModel):
  title: str = Field(min_length=2, max_length=220)
  file_type: UploadFileType
  subject: Subject
  course_id: uuid.UUID | None = None

