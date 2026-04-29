from pydantic import BaseModel

from app.schemas.user import UserPublic


class TokenResponse(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"
  user: UserPublic


class RefreshRequest(BaseModel):
  refresh_token: str
  device_id: str | None = None


class AccessTokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
