"""Add advanced teacher feature tables

Revision ID: 0008_teacher_advanced_features
Revises: 0007_v2_new_features
Create Date: 2026-04-26
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0008_teacher_advanced_features"
down_revision = "0007_v2_new_features"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return name in sa.inspect(bind).get_table_names()


def upgrade() -> None:
    if not _has_table("v2_content_plans"):
        op.create_table(
            "v2_content_plans",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("title", sa.String(220), nullable=False),
            sa.Column("week_number", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("topics", postgresql.JSON(), nullable=False, server_default="[]"),
            sa.Column("target_date", sa.String(20), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_content_plans_teacher_id", "v2_content_plans", ["teacher_id"])

    if not _has_table("v2_question_bank"):
        op.create_table(
            "v2_question_bank",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("topic", sa.String(200), nullable=False, server_default=""),
            sa.Column("question_text", sa.Text(), nullable=False),
            sa.Column("options", postgresql.JSON(), nullable=False),
            sa.Column("correct_index", sa.Integer(), nullable=False),
            sa.Column("explanation", sa.Text(), nullable=False, server_default=""),
            sa.Column("difficulty", sa.Integer(), nullable=False, server_default="3"),
            sa.Column("tags", sa.String(300), nullable=False, server_default=""),
            sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_question_bank_teacher_id", "v2_question_bank", ["teacher_id"])
        op.create_index("ix_v2_question_bank_subject", "v2_question_bank", ["subject"])

    if not _has_table("v2_mock_tests"):
        op.create_table(
            "v2_mock_tests",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("title", sa.String(220), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("description", sa.Text(), nullable=False, server_default=""),
            sa.Column("duration_min", sa.Integer(), nullable=False, server_default="60"),
            sa.Column("total_marks", sa.Integer(), nullable=False, server_default="180"),
            sa.Column("negative_marking", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("questions", postgresql.JSON(), nullable=False, server_default="[]"),
            sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_mock_tests_teacher_id", "v2_mock_tests", ["teacher_id"])

    if not _has_table("v2_announcements"):
        op.create_table(
            "v2_announcements",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("teacher_name", sa.String(120), nullable=False, server_default=""),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("title", sa.String(220), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("priority", sa.String(20), nullable=False, server_default="normal"),
            sa.Column("pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_announcements_teacher_id", "v2_announcements", ["teacher_id"])
        op.create_index("ix_v2_announcements_subject", "v2_announcements", ["subject"])

    if not _has_table("v2_resources"):
        op.create_table(
            "v2_resources",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("subject", sa.String(80), nullable=False),
            sa.Column("topic", sa.String(200), nullable=False, server_default=""),
            sa.Column("title", sa.String(220), nullable=False),
            sa.Column("resource_type", sa.String(30), nullable=False),
            sa.Column("url", sa.String(600), nullable=False),
            sa.Column("description", sa.Text(), nullable=False, server_default=""),
            sa.Column("tags", sa.String(300), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_v2_resources_teacher_id", "v2_resources", ["teacher_id"])
        op.create_index("ix_v2_resources_subject", "v2_resources", ["subject"])
        op.create_index("ix_v2_resources_type", "v2_resources", ["resource_type"])

    if not _has_table("v2_teacher_settings"):
        op.create_table(
            "v2_teacher_settings",
            sa.Column("teacher_id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("display_name", sa.String(120), nullable=False, server_default=""),
            sa.Column("bio", sa.Text(), nullable=False, server_default=""),
            sa.Column("notification_doubts", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("notification_submissions", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("notification_announcements", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("default_difficulty", sa.Integer(), nullable=False, server_default="3"),
            sa.Column("auto_publish_ai_questions", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )


def downgrade() -> None:
    for t in ["v2_teacher_settings", "v2_resources", "v2_announcements",
              "v2_mock_tests", "v2_question_bank", "v2_content_plans"]:
        if _has_table(t):
            op.drop_table(t)
