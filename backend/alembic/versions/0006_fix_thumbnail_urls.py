"""Replace hqdefault.jpg with mqdefault.jpg in course thumbnail_url

Revision ID: 0006_fix_thumbnail_urls
Revises: 0005_teacher_role_performance
Create Date: 2026-04-24
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0006_fix_thumbnail_urls"
down_revision = "0005_teacher_role_performance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Replace hqdefault.jpg → mqdefault.jpg for all course thumbnails.
    # mqdefault.jpg (320×180) is guaranteed to exist for every YouTube video,
    # whereas hqdefault.jpg (480×360) only exists for videos with a custom thumbnail.
    op.execute(
        sa.text(
            "UPDATE courses "
            "SET thumbnail_url = REPLACE(thumbnail_url, 'hqdefault.jpg', 'mqdefault.jpg') "
            "WHERE thumbnail_url LIKE '%hqdefault.jpg%'"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "UPDATE courses "
            "SET thumbnail_url = REPLACE(thumbnail_url, 'mqdefault.jpg', 'hqdefault.jpg') "
            "WHERE thumbnail_url LIKE '%mqdefault.jpg%'"
        )
    )
