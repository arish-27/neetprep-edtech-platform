from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


_DEFAULT_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
  # Load `backend/.env` reliably even if you start Uvicorn from the repo root.
  model_config = SettingsConfigDict(env_file=(str(_DEFAULT_ENV_FILE), ".env"), env_file_encoding="utf-8", extra="ignore")

  PROJECT_NAME: str = "NEET Learning API"
  API_V1_STR: str = "/api/v1"

  # Database
  POSTGRES_SERVER: str = "localhost"
  POSTGRES_PORT: int = 5432
  POSTGRES_USER: str = "postgres"
  POSTGRES_PASSWORD: str = "postgres"
  POSTGRES_DB: str = "neet"
  DATABASE_URL: str | None = None

  # Security
  SECRET_KEY: str = Field(default="CHANGE_ME_TO_A_LONG_RANDOM_SECRET")
  ALGORITHM: str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
  REFRESH_TOKEN_EXPIRE_DAYS: int = 7

  # CORS
  BACKEND_CORS_ORIGINS: str = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:5174,http://127.0.0.1:5174"
  )

  # Uploads
  UPLOAD_DIR: str = "uploads"
  MAX_UPLOAD_MB: int = 100

  # Logging
  LOG_LEVEL: str = "INFO"

  # Optional seed admin
  SEED_ADMIN_EMAIL: str = "admin@demo.com"
  
  # Demo UPI Payment Configuration
  DEMO_UPI_ID: str = Field(default="neetlearning@upi")
  DEMO_UPI_PAYEE_NAME: str = Field(default="NEET Learning Platform")

  # Deprecated payment gateway fields (kept optional for backwards compatibility)
  RAZORPAY_KEY_ID: str = Field(default="")
  RAZORPAY_KEY_SECRET: str = Field(default="")
  RAZORPAY_WEBHOOK_SECRET: str = Field(default="")
  SEED_ADMIN_USERNAME: str = "Admin"
  SEED_ADMIN_PASSWORD: str = "admin123"

  # Demo/dev convenience
  AUTO_SEED_DEMO_DATA: bool = True

  # AI (optional): set OPENAI_API_KEY to enable real responses, otherwise mock answers are returned.
  OPENAI_API_KEY: str | None = None
  OPENAI_MODEL: str = "gpt-4.1-mini"

  @property
  def database_url(self) -> str:
    if self.DATABASE_URL:
      return self.DATABASE_URL
    return (
      "postgresql+asyncpg://"
      f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
      f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    )

  def cors_origins(self) -> list[str]:
    # Allow settings like "*" and JSON lists.
    origins: Any = self.BACKEND_CORS_ORIGINS
    if isinstance(origins, str):
      raw = origins.strip()
      if raw.startswith("[") and raw.endswith("]"):
        try:
          parsed = json.loads(raw)
          if isinstance(parsed, list):
            return [str(o).strip() for o in parsed if str(o).strip()]
        except json.JSONDecodeError:
          pass
      if origins.strip() == "*":
        return ["*"]
      return [o.strip() for o in origins.split(",") if o.strip()]
    if isinstance(origins, list):
      return [str(o) for o in origins]
    return ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
  return Settings()


settings = get_settings()
