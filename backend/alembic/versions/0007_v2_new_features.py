"""Add v2 feature tables: assignments, doubts, live_classes, practice, revision, gamification, chat

Revision ID: 0007_v2_new_features
Revises: 0006_fix_thumbnail_urls
Create Date: 2026-04-25
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007_v2_new_features"
down_revision = "0006_fix_thumbnail_urls"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return name in sa.inspect(bind).get_table_names()


def upgrade() -> None:
    if not _has_table("v2_assignments"):
        op.create_table(
            "v2_assignments",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(220), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("description", sa.Text(), nullable=False, server_default=""),
            sa.Column("questions", postgresql.JSON(), nullable=False, server_default="[]"),
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_assignments_teacher_id", "v2_assignments", ["teacher_id"])

    if not _has_table("v2_assignment_submissions"):
        op.create_table(
            "v2_assignment_submissions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("assignment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("v2_assignments.id", ondelete="CASCADE"), nullable=False),
            sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("answers", postgresql.JSON(), nullable=False, server_default="{}"),
            sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("total", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_assignment_submissions_assignment_id", "v2_assignment_submissions", ["assignment_id"])
        op.create_index("ix_v2_assignment_submissions_student_id", "v2_assignment_submissions", ["student_id"])

    if not _has_table("v2_doubts"):
        op.create_table(
            "v2_doubts",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("student_name", sa.String(120), nullable=False, server_default=""),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("topic", sa.String(200), nullable=False, server_default=""),
            sa.Column("question", sa.Text(), nullable=False),
            sa.Column("answer", sa.Text(), nullable=True),
            sa.Column("answered_by_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("answered_by_name", sa.String(120), nullable=True),
            sa.Column("upvotes", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("status", sa.String(20), nullable=False, server_default="open"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_v2_doubts_student_id", "v2_doubts", ["student_id"])
        op.create_index("ix_v2_doubts_subject", "v2_doubts", ["subject"])
        op.create_index("ix_v2_doubts_status", "v2_doubts", ["status"])

    if not _has_table("v2_live_classes"):
        op.create_table(
            "v2_live_classes",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("teacher_name", sa.String(120), nullable=False, server_default=""),
            sa.Column("title", sa.String(220), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("description", sa.Text(), nullable=False, server_default=""),
            sa.Column("meet_link", sa.String(500), nullable=False, server_default=""),
            sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("duration_min", sa.Integer(), nullable=False, server_default="60"),
            sa.Column("status", sa.String(20), nullable=False, server_default="scheduled"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_live_classes_teacher_id", "v2_live_classes", ["teacher_id"])
        op.create_index("ix_v2_live_classes_subject", "v2_live_classes", ["subject"])

    if not _has_table("v2_practice_sessions"):
        op.create_table(
            "v2_practice_sessions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("topic", sa.String(200), nullable=False, server_default=""),
            sa.Column("questions_answered", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("correct", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("current_difficulty", sa.Integer(), nullable=False, server_default="3"),
            sa.Column("ended", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_practice_sessions_student_id", "v2_practice_sessions", ["student_id"])

    if not _has_table("v2_revision_queue"):
        op.create_table(
            "v2_revision_queue",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("question_text", sa.Text(), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("topic", sa.String(200), nullable=False, server_default=""),
            sa.Column("explanation", sa.Text(), nullable=False, server_default=""),
            sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("next_review_at", sa.Date(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_revision_queue_student_id", "v2_revision_queue", ["student_id"])

    if not _has_table("v2_gamification"):
        op.create_table(
            "v2_gamification",
            sa.Column("student_id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("username", sa.String(120), nullable=False, server_default=""),
            sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_active_date", sa.Date(), nullable=True),
            sa.Column("badges", sa.String(500), nullable=False, server_default=""),
        )

    if not _has_table("v2_chat_messages"):
        op.create_table(
            "v2_chat_messages",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("role", sa.String(20), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_chat_messages_student_id", "v2_chat_messages", ["student_id"])


def downgrade() -> None:
    for table in ["v2_chat_messages", "v2_gamification", "v2_revision_queue",
                  "v2_practice_sessions", "v2_live_classes", "v2_doubts",
                  "v2_assignment_submissions", "v2_assignments"]:
        if _has_table(table):
            op.drop_table(table)
