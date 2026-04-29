"""Add teacher role, teacher_subjects, and student_performance tables

Revision ID: 0005_teacher_role_performance
Revises: 0004_demo_class_progress
Create Date: 2026-04-24
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_teacher_role_performance"
down_revision = "0004_demo_class_progress"
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


def _enum_has_value(enum_name: str, value: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid "
            "WHERE t.typname = :enum_name AND e.enumlabel = :value"
        ),
        {"enum_name": enum_name, "value": value},
    )
    return result.fetchone() is not None


def upgrade() -> None:
    # ── 1. Add 'teacher' to the user_role enum (idempotent) ──────────────────
    if not _enum_has_value("user_role", "teacher"):
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher'")

    # ── 2. teacher_subjects table ─────────────────────────────────────────────
    if not _has_table("teacher_subjects"):
        # Use raw SQL to avoid SQLAlchemy trying to CREATE the enum type
        op.execute(sa.text("""
            CREATE TABLE teacher_subjects (
                id UUID PRIMARY KEY NOT NULL,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                subject course_subject NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT uq_teacher_subject_user UNIQUE (user_id)
            )
        """))
        op.execute(sa.text("CREATE INDEX ix_teacher_subjects_user_id ON teacher_subjects (user_id)"))
        op.execute(sa.text("CREATE INDEX ix_teacher_subjects_subject ON teacher_subjects (subject)"))

    # ── 3. student_performance table ──────────────────────────────────────────
    if not _has_table("student_performance"):
        op.execute(sa.text("""
            CREATE TABLE student_performance (
                id UUID PRIMARY KEY NOT NULL,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                subject course_subject NOT NULL,
                total_score INTEGER NOT NULL DEFAULT 0,
                total_questions INTEGER NOT NULL DEFAULT 0,
                quiz_attempts INTEGER NOT NULL DEFAULT 0,
                accuracy_pct FLOAT NOT NULL DEFAULT 0,
                completed_lessons INTEGER NOT NULL DEFAULT 0,
                total_lessons INTEGER NOT NULL DEFAULT 0,
                watched_seconds INTEGER NOT NULL DEFAULT 0,
                progress_pct FLOAT NOT NULL DEFAULT 0,
                time_spent_seconds INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT uq_student_performance_user_subject UNIQUE (user_id, subject)
            )
        """))
        op.execute(sa.text("CREATE INDEX ix_student_performance_user_id ON student_performance (user_id)"))
        op.execute(sa.text("CREATE INDEX ix_student_performance_subject ON student_performance (subject)"))


def downgrade() -> None:
    if _has_table("student_performance"):
        op.drop_table("student_performance")
    if _has_table("teacher_subjects"):
        op.drop_table("teacher_subjects")
    # Note: PostgreSQL does not support removing enum values; skip enum downgrade.
