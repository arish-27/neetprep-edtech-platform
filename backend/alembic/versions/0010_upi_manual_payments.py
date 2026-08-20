"""add_upi_manual_payments

Revision ID: 0010_upi_manual_payments
Revises: a238ca2ed9fd
Create Date: 2026-08-20 19:35:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '0010_upi_manual_payments'
down_revision = 'a238ca2ed9fd'
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    columns = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # 1. Update payments status column to varchar(50) if using enum
    bind = op.get_bind()
    
    # Add new columns to payments if not present
    if not _has_column('payments', 'transaction_id'):
        op.add_column('payments', sa.Column('transaction_id', sa.String(length=255), nullable=True))
        op.create_index(op.f('ix_payments_transaction_id'), 'payments', ['transaction_id'], unique=False)
        
    if not _has_column('payments', 'payment_date'):
        op.add_column('payments', sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()))

    if not _has_column('payments', 'screenshot_url'):
        op.add_column('payments', sa.Column('screenshot_url', sa.String(length=500), nullable=True))

    if not _has_column('payments', 'plan_name'):
        op.add_column('payments', sa.Column('plan_name', sa.String(length=255), nullable=True))

    if not _has_column('payments', 'admin_notes'):
        op.add_column('payments', sa.Column('admin_notes', sa.String(length=1000), nullable=True))

    if not _has_column('payments', 'reviewed_by'):
        op.add_column('payments', sa.Column('reviewed_by', sa.UUID(), nullable=True))
        op.create_foreign_key('fk_payments_reviewed_by_users', 'payments', 'users', ['reviewed_by'], ['id'], ondelete='SET NULL')

    if not _has_column('payments', 'reviewed_at'):
        op.add_column('payments', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

    # Convert status and payment_method to VARCHAR for flexibility
    try:
        op.execute("ALTER TABLE payments ALTER COLUMN status TYPE VARCHAR(50) USING status::VARCHAR(50)")
    except Exception:
        pass

    try:
        op.execute("ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(50) USING payment_method::VARCHAR(50)")
    except Exception:
        pass


def downgrade() -> None:
    pass
