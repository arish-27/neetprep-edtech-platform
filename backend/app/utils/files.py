from __future__ import annotations

import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.settings import settings
from app.core.errors import AppError


def ensure_upload_dir() -> Path:
  base = Path(settings.UPLOAD_DIR).resolve()
  base.mkdir(parents=True, exist_ok=True)
  return base


def _safe_ext(filename: str) -> str:
  ext = Path(filename).suffix.lower()
  if len(ext) > 12:
    return ""
  return ext


async def save_upload_file(file: UploadFile) -> tuple[str, int]:
  base = ensure_upload_dir()
  ext = _safe_ext(file.filename or "")
  name = f"{uuid.uuid4().hex}{ext}"
  path = base / name

  max_bytes = int(settings.MAX_UPLOAD_MB) * 1024 * 1024
  written = 0

  async with aiofiles.open(path, "wb") as out:
    while True:
      chunk = await file.read(1024 * 1024)
      if not chunk:
        break
      written += len(chunk)
      if written > max_bytes:
        try:
          await out.close()
        finally:
          try:
            os.remove(path)
          except OSError:
            pass
        raise AppError("File too large", status_code=413, code="file_too_large")
      await out.write(chunk)

  # served by StaticFiles at /static/<name>
  return f"/static/{name}", written

