"""Add user premium + device tracking

Revision ID: 0003_user_premium_device
Revises: 0002_question_explanation
Create Date: 2026-04-23
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_user_premium_device"
down_revision = "0002_question_explanation"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
  bind = op.get_bind()
  inspector = sa.inspect(bind)
  return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def _has_index(table_name: str, index_name: str) -> bool:
  bind = op.get_bind()
  inspector = sa.inspect(bind)
  return any(idx["name"] == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
  # Some local/dev databases might already have `is_paid` added manually.
  # Keep this migration idempotent so `alembic upgrade head` never breaks.
  if not _has_column("users", "is_paid"):
    op.add_column("users", sa.Column("is_paid", sa.Boolean(), nullable=False, server_default=sa.text("false")))

  if not _has_column("users", "device_id"):
    op.add_column("users", sa.Column("device_id", sa.String(length=80), nullable=True))

  if not _has_index("users", "ix_users_device_id"):
    op.create_index("ix_users_device_id", "users", ["device_id"], unique=False)


def downgrade() -> None:
  if _has_index("users", "ix_users_device_id"):
    op.drop_index("ix_users_device_id", table_name="users")
  if _has_column("users", "device_id"):
    op.drop_column("users", "device_id")
  if _has_column("users", "is_paid"):
    op.drop_column("users", "is_paid")
