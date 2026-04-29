from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ValidationError

from app.core.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


class TokenPayload(BaseModel):
  sub: str
  role: str
  token_type: str
  device_id: str | None = None
  exp: int


def verify_password(plain_password: str, hashed_password: str) -> bool:
  return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password[:72])


def _create_token(
  *,
  subject: str,
  role: str,
  token_type: str,
  expires_delta: timedelta,
  device_id: str | None = None,
) -> str:
  now = datetime.now(timezone.utc)
  expire = now + expires_delta
  to_encode: dict[str, Any] = {
    "sub": subject,
    "role": role,
    "token_type": token_type,
    "iat": int(now.timestamp()),
    "exp": int(expire.timestamp()),
  }
  if device_id:
    to_encode["device_id"] = device_id
  return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(*, subject: str, role: str, device_id: str | None = None) -> str:
  return _create_token(
    subject=subject,
    role=role,
    token_type=ACCESS_TOKEN_TYPE,
    expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    device_id=device_id,
  )


def create_refresh_token(*, subject: str, role: str, device_id: str | None = None) -> str:
  return _create_token(
    subject=subject,
    role=role,
    token_type=REFRESH_TOKEN_TYPE,
    expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    device_id=device_id,
  )


def decode_token(token: str) -> TokenPayload:
  try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return TokenPayload.model_validate(payload)
  except (JWTError, ValidationError) as exc:
    raise ValueError("Invalid token") from exc
