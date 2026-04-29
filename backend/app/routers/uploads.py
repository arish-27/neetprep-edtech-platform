from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.pagination import pagination_params
from app.models.enums import Subject, UploadFileType, UserRole
from app.models.user import User
from app.schemas.pagination import Page
from app.schemas.upload import UploadPublic
from app.services.teacher_service import get_teacher_subject
from app.services.upload_service import create_upload, list_uploads

router = APIRouter(prefix="/uploads", tags=["uploads"])


def _require_uploader(user: User = Depends(get_current_user)) -> User:
    """Allow admins AND teachers to upload content."""
    if user.role not in (UserRole.admin, UserRole.teacher):
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Upload access required")
    return user


@router.post("", response_model=UploadPublic, status_code=status.HTTP_201_CREATED)
async def upload(
  title: str = Form(...),
  file_type: UploadFileType = Form(...),
  subject: Subject = Form(...),
  course_id: str | None = Form(None),
  file: UploadFile = File(...),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(_require_uploader),
):
  # Teachers can only upload for their own assigned subject
  if user.role == UserRole.teacher:
    ts = await get_teacher_subject(session, user_id=user.id)
    if not ts:
      from fastapi import HTTPException
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No subject assigned to this teacher")
    if ts.subject != subject:
      from fastapi import HTTPException
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"You can only upload for your assigned subject: {ts.subject.value}",
      )

  parsed_course: uuid.UUID | None = None
  if course_id:
    parsed_course = uuid.UUID(course_id)
  return await create_upload(
    session,
    uploader_id=user.id,
    title=title,
    file_type=file_type,
    subject=subject,
    course_id=parsed_course,
    file=file,
  )


@router.get("", response_model=Page[UploadPublic])
async def list_route(
  subject: Subject | None = Query(default=None),
  file_type: UploadFileType | None = Query(default=None),
  pagination: tuple[int, int] = Depends(pagination_params),
  session: AsyncSession = Depends(get_async_session),
):
  limit, offset = pagination
  return await list_uploads(session, subject=subject, file_type=file_type, limit=limit, offset=offset)

