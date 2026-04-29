from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageMeta(BaseModel):
  total: int
  limit: int
  offset: int
  has_more: bool


class Page(BaseModel, Generic[T]):
  items: list[T]
  meta: PageMeta

