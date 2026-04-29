from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EnrollmentPublic(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: uuid.UUID
  user_id: uuid.UUID
  course_id: uuid.UUID
  created_at: datetime

