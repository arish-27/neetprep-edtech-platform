from __future__ import annotations

import uuid

from fastapi import status
from fastapi import UploadFile
from sqlalchemy import Select, and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.enums import Subject, UploadFileType
from app.models.upload import Upload
from app.utils.files import save_upload_file
from app.utils.pagination import paginate


async def create_upload(
  session: AsyncSession,
  *,
  uploader_id: uuid.UUID,
  title: str,
  file_type: UploadFileType,
  subject: Subject,
  course_id: uuid.UUID | None,
  file: UploadFile,
) -> Upload:
  if not file.filename:
    raise AppError("Missing filename", status_code=status.HTTP_400_BAD_REQUEST, code="missing_filename")

  file_url, _bytes = await save_upload_file(file)
  upload = Upload(
    title=title,
    file_url=file_url,
    file_type=file_type,
    subject=subject,
    uploaded_by=uploader_id,
    course_id=course_id,
  )
  session.add(upload)
  await session.commit()
  await session.refresh(upload)
  return upload


async def list_uploads(
  session: AsyncSession,
  *,
  subject: Subject | None,
  file_type: UploadFileType | None,
  limit: int,
  offset: int,
):
  stmt: Select = select(Upload).order_by(Upload.created_at.desc())
  clauses = []
  if subject:
    clauses.append(Upload.subject == subject)
  if file_type:
    clauses.append(Upload.file_type == file_type)
  if clauses:
    stmt = stmt.where(and_(*clauses))
  return await paginate(session, stmt, limit=limit, offset=offset)

