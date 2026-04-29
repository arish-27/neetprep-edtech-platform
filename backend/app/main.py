from __future__ import annotations

import logging

from fastapi import Depends, FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.errors import AppError
from app.core.logging import configure_logging
from app.core.settings import settings
from app.db.database import engine
from app.routers import api_router
from app.utils.files import ensure_upload_dir

configure_logging()
logger = logging.getLogger("app")


app = FastAPI(
  title=settings.PROJECT_NAME,
  version="0.1.0",
)

origins = settings.cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # We use Authorization headers (not cookies), so credentials are unnecessary.
    # Keeping this False also avoids the invalid "* + credentials" CORS combo.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.API_V1_STR) 


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
  return JSONResponse(status_code=exc.status_code, content={"detail": exc.message, "code": exc.code})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception):
  logger.exception("Unhandled server error")
  return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.on_event("startup")
async def startup() -> None:
  ensure_upload_dir()
  logger.info("Uploads directory ready at %s", settings.UPLOAD_DIR)

  # Fail fast with a clear message if migrations are not applied.
  required_user_columns = {"is_paid", "device_id"}
  required_tables = {"demo_class_progress"}
  async with engine.connect() as conn:
    res = await conn.execute(text("select column_name from information_schema.columns where table_name='users'"))
    existing_columns = {row[0] for row in res}

    res = await conn.execute(text("select table_name from information_schema.tables where table_name='demo_class_progress'"))
    existing_tables = {row[0] for row in res}

  missing_bits: list[str] = []
  missing_columns = sorted(required_user_columns - existing_columns)
  if missing_columns:
    missing_bits.extend([f"users.{c}" for c in missing_columns])
  missing_tables = sorted(required_tables - existing_tables)
  if missing_tables:
    missing_bits.extend([f"table {t}" for t in missing_tables])

  if missing_bits:
    missing = ", ".join(missing_bits)
    raise RuntimeError(
      "Database schema is out of date (missing "
      f"{missing}). Run `cd backend` then `alembic upgrade head` and restart the API."
    )

  if settings.AUTO_SEED_DEMO_DATA:
    from app.seed import seed as seed_demo_data  # noqa: E402

    try:
      await seed_demo_data()
      logger.info("Demo data ready (auto-seed enabled).")
    except Exception:
      logger.exception("Auto-seed failed (app will still start, but UI may be empty).")


@app.get("/health")
async def health():
  return {"status": "ok"}


# Demo/portfolio-friendly alias (non-versioned) to match frontend prompts that call `/check-access`.
# The canonical route still exists at: `/api/v1/check-access`.
from app.routers.demo_video import check_access as check_access_v1  # noqa: E402
from app.schemas.demo_video import DemoAccessResponse  # noqa: E402
from app.dependencies.auth import get_optional_user  # noqa: E402
from app.models.user import User  # noqa: E402


@app.get("/check-access", response_model=DemoAccessResponse, tags=["demo"])
async def check_access_root(
  class_id: str,
  x_demo_paid: str | None = Header(default=None, alias="X-Demo-Paid"),
  user: User | None = Depends(get_optional_user),
):
  return await check_access_v1(class_id=class_id, x_demo_paid=x_demo_paid, user=user)


# Serve uploaded files (local storage)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")
