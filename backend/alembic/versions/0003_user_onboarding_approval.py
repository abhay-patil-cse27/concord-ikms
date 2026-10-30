"""Add approval_status and registration_number to users for 2-tier approval queue

Revision ID: 0003_user_onboarding_approval
Revises: 0002_user_data_isolation
Create Date: 2026-10-30 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003_user_onboarding_approval'
down_revision: Union[str, None] = '0002_user_data_isolation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'users' in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'approval_status' not in columns:
            op.add_column('users', sa.Column('approval_status', sa.String(length=50), nullable=False, server_default='approved'))
            op.create_index('ix_users_approval_status', 'users', ['approval_status'], unique=False)

        if 'registration_number' not in columns:
            op.add_column('users', sa.Column('registration_number', sa.String(length=50), nullable=True))
            op.create_index('ix_users_registration_number', 'users', ['registration_number'], unique=False)

        if 'tier1_approved_by' not in columns:
            op.add_column('users', sa.Column('tier1_approved_by', sa.String(length=36), nullable=True))

        if 'tier2_approved_by' not in columns:
            op.add_column('users', sa.Column('tier2_approved_by', sa.String(length=36), nullable=True))

        if 'rejection_reason' not in columns:
            op.add_column('users', sa.Column('rejection_reason', sa.String(length=500), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'users' in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'rejection_reason' in columns:
            op.drop_column('users', 'rejection_reason')
        if 'tier2_approved_by' in columns:
            op.drop_column('users', 'tier2_approved_by')
        if 'tier1_approved_by' in columns:
            op.drop_column('users', 'tier1_approved_by')
        if 'registration_number' in columns:
            op.drop_index('ix_users_registration_number', table_name='users')
            op.drop_column('users', 'registration_number')
        if 'approval_status' in columns:
            op.drop_index('ix_users_approval_status', table_name='users')
            op.drop_column('users', 'approval_status')

