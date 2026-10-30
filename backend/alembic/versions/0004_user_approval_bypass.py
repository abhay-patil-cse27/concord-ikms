"""Add is_bypassed and bypass_reason to users table for administrative override and direct provisioning

Revision ID: 0004_user_approval_bypass
Revises: 0003_user_onboarding_approval
Create Date: 2026-10-31 00:29:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004_user_approval_bypass'
down_revision: Union[str, None] = '0003_user_onboarding_approval'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'users' in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'is_bypassed' not in columns:
            op.add_column('users', sa.Column('is_bypassed', sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()))

        if 'bypass_reason' not in columns:
            op.add_column('users', sa.Column('bypass_reason', sa.String(length=500), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'users' in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'bypass_reason' in columns:
            op.drop_column('users', 'bypass_reason')
        if 'is_bypassed' in columns:
            op.drop_column('users', 'is_bypassed')
