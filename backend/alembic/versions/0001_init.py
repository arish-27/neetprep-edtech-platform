"""Initial schema

Revision ID: 0001_init
Revises:
Create Date: 2026-04-19
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
  user_role = sa.Enum("student", "admin", name="user_role")
  course_subject = sa.Enum("Physics", "Chemistry", "Biology", name="course_subject")
  upload_file_type = sa.Enum("pdf", "video", name="upload_file_type")
  upload_subject = sa.Enum("Physics", "Chemistry", "Biology", name="upload_subject")

  op.create_table(
    "users",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("username", sa.String(length=80), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("hashed_password", sa.String(length=255), nullable=False),
    sa.Column("role", user_role, nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
  )
  op.create_index("ix_users_email", "users", ["email"], unique=True)
  op.create_index("ix_users_username", "users", ["username"], unique=False)
  op.create_index("ix_users_role", "users", ["role"], unique=False)

  op.create_table(
    "courses",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("title", sa.String(length=200), nullable=False),
    sa.Column("description", sa.Text(), nullable=False, server_default=""),
    sa.Column("subject", course_subject, nullable=False),
    sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
  )
  op.create_index("ix_courses_title", "courses", ["title"], unique=False)
  op.create_index("ix_courses_subject", "courses", ["subject"], unique=False)

  op.create_table(
    "lessons",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
    sa.Column("title", sa.String(length=220), nullable=False),
    sa.Column("video_url", sa.String(length=800), nullable=False),
    sa.Column("duration", sa.Integer(), nullable=False, server_default="0"),
    sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("course_id", "order_index", name="uq_lesson_course_order"),
  )
  op.create_index("ix_lessons_course_id", "lessons", ["course_id"], unique=False)

  op.create_table(
    "enrollments",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),
  )
  op.create_index("ix_enrollments_user_id", "enrollments", ["user_id"], unique=False)
  op.create_index("ix_enrollments_course_id", "enrollments", ["course_id"], unique=False)

  op.create_table(
    "quizzes",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
    sa.Column("title", sa.String(length=220), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
  )
  op.create_index("ix_quizzes_course_id", "quizzes", ["course_id"], unique=False)

  op.create_table(
    "questions",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
    sa.Column("question_text", sa.Text(), nullable=False),
    sa.Column("options", sa.JSON(), nullable=False),
    sa.Column("correct_answer", sa.Integer(), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
  )
  op.create_index("ix_questions_quiz_id", "questions", ["quiz_id"], unique=False)

  op.create_table(
    "progress",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
    sa.Column("watched_seconds", sa.Integer(), nullable=False, server_default="0"),
    sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),
  )
  op.create_index("ix_progress_user_id", "progress", ["user_id"], unique=False)
  op.create_index("ix_progress_lesson_id", "progress", ["lesson_id"], unique=False)

  op.create_table(
    "quiz_results",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
    sa.Column("score", sa.Integer(), nullable=False),
    sa.Column("total_questions", sa.Integer(), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
  )
  op.create_index("ix_quiz_results_user_id", "quiz_results", ["user_id"], unique=False)
  op.create_index("ix_quiz_results_quiz_id", "quiz_results", ["quiz_id"], unique=False)

  op.create_table(
    "uploads",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
    sa.Column("title", sa.String(length=220), nullable=False),
    sa.Column("file_url", sa.String(length=600), nullable=False),
    sa.Column("file_type", upload_file_type, nullable=False),
    sa.Column("subject", upload_subject, nullable=False),
    sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="SET NULL"), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
  )
  op.create_index("ix_uploads_file_type", "uploads", ["file_type"], unique=False)
  op.create_index("ix_uploads_subject", "uploads", ["subject"], unique=False)
  op.create_index("ix_uploads_uploaded_by", "uploads", ["uploaded_by"], unique=False)


def downgrade() -> None:
  op.drop_index("ix_uploads_uploaded_by", table_name="uploads")
  op.drop_index("ix_uploads_subject", table_name="uploads")
  op.drop_index("ix_uploads_file_type", table_name="uploads")
  op.drop_table("uploads")

  op.drop_index("ix_quiz_results_quiz_id", table_name="quiz_results")
  op.drop_index("ix_quiz_results_user_id", table_name="quiz_results")
  op.drop_table("quiz_results")

  op.drop_index("ix_progress_lesson_id", table_name="progress")
  op.drop_index("ix_progress_user_id", table_name="progress")
  op.drop_table("progress")

  op.drop_index("ix_questions_quiz_id", table_name="questions")
  op.drop_table("questions")

  op.drop_index("ix_quizzes_course_id", table_name="quizzes")
  op.drop_table("quizzes")

  op.drop_index("ix_enrollments_course_id", table_name="enrollments")
  op.drop_index("ix_enrollments_user_id", table_name="enrollments")
  op.drop_table("enrollments")

  op.drop_index("ix_lessons_course_id", table_name="lessons")
  op.drop_table("lessons")

  op.drop_index("ix_courses_subject", table_name="courses")
  op.drop_index("ix_courses_title", table_name="courses")
  op.drop_table("courses")

  op.drop_index("ix_users_role", table_name="users")
  op.drop_index("ix_users_username", table_name="users")
  op.drop_index("ix_users_email", table_name="users")
  op.drop_table("users")

  op.execute("DROP TYPE IF EXISTS upload_subject")
  op.execute("DROP TYPE IF EXISTS upload_file_type")
  op.execute("DROP TYPE IF EXISTS course_subject")
  op.execute("DROP TYPE IF EXISTS user_role")

