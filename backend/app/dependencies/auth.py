from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.db.database import get_async_session
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
  session: AsyncSession = Depends(get_async_session),
  creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User:
  if not creds or creds.scheme.lower() != "bearer":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

  token = creds.credentials
  try:
    payload = decode_token(token)
  except ValueError:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

  if payload.token_type != ACCESS_TOKEN_TYPE:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

  try:
    user_id = uuid.UUID(payload.sub)
  except ValueError:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

  res = await session.execute(select(User).where(User.id == user_id))
  user = res.scalar_one_or_none()
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

  # Portfolio-level single-device enforcement.
  if user.device_id and payload.device_id and user.device_id != payload.device_id:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
  if user.device_id and not payload.device_id:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
  return user


async def get_optional_user(
  session: AsyncSession = Depends(get_async_session),
  creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User | None:
  if not creds or creds.scheme.lower() != "bearer":
    return None

  token = creds.credentials
  try:
    payload = decode_token(token)
  except ValueError:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

  if payload.token_type != ACCESS_TOKEN_TYPE:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

  try:
    user_id = uuid.UUID(payload.sub)
  except ValueError:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

  res = await session.execute(select(User).where(User.id == user_id))
  user = res.scalar_one_or_none()
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

  if user.device_id and payload.device_id and user.device_id != payload.device_id:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
  if user.device_id and not payload.device_id:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
  return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
  if user.role.value != "admin":
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
  return user
