from __future__ import annotations

from pydantic import BaseModel


class PremiumStatusPublic(BaseModel):
  is_paid: bool
  device_id: str | None = None


class PremiumUpdateRequest(BaseModel):
  is_paid: bool

