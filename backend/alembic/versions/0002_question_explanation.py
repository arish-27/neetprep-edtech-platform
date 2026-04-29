"""Add question explanation

Revision ID: 0002_question_explanation
Revises: 0001_init
Create Date: 2026-04-19
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002_question_explanation"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.add_column("questions", sa.Column("explanation", sa.Text(), nullable=False, server_default=""))


def downgrade() -> None:
  op.drop_column("questions", "explanation")

