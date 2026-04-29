import logging

from app.core.settings import settings


def configure_logging() -> None:
  level = getattr(logging, str(settings.LOG_LEVEL).upper(), logging.INFO)
  logging.basicConfig(
    level=level,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
  )

