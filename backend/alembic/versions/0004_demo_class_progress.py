"""Add demo class progress tracking

Revision ID: 0004_demo_class_progress
Revises: 0003_user_premium_device
Create Date: 2026-04-23
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_demo_class_progress"
down_revision = "0003_user_premium_device"
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
  bind = op.get_bind()
  inspector = sa.inspect(bind)
  return table_name in inspector.get_table_names()


def _has_index(table_name: str, index_name: str) -> bool:
  bind = op.get_bind()
  inspector = sa.inspect(bind)
  return any(idx["name"] == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
  if not _has_table("demo_class_progress"):
    op.create_table(
      "demo_class_progress",
      sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
      sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
      sa.Column("class_id", sa.String(length=64), nullable=False),
      sa.Column("watched_seconds", sa.Integer(), nullable=False, server_default="0"),
      sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
      sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
      sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
      sa.UniqueConstraint("user_id", "class_id", name="uq_demo_progress_user_class"),
    )

  if not _has_index("demo_class_progress", "ix_demo_class_progress_user_id"):
    op.create_index("ix_demo_class_progress_user_id", "demo_class_progress", ["user_id"], unique=False)
  if not _has_index("demo_class_progress", "ix_demo_class_progress_class_id"):
    op.create_index("ix_demo_class_progress_class_id", "demo_class_progress", ["class_id"], unique=False)


def downgrade() -> None:
  if _has_table("demo_class_progress"):
    if _has_index("demo_class_progress", "ix_demo_class_progress_class_id"):
      op.drop_index("ix_demo_class_progress_class_id", table_name="demo_class_progress")
    if _has_index("demo_class_progress", "ix_demo_class_progress_user_id"):
      op.drop_index("ix_demo_class_progress_user_id", table_name="demo_class_progress")
    op.drop_table("demo_class_progress")

