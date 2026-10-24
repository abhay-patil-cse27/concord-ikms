"""Add owner_id and visibility to conversations, messages, and documents

Revision ID: 0002_user_data_isolation
Revises: 0001_initial_schema
Create Date: 2026-10-25 00:52:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_user_data_isolation'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update conversations table if exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'conversations' in tables:
        columns = [c['name'] for c in inspector.get_columns('conversations')]
        if 'owner_id' not in columns:
            op.add_column('conversations', sa.Column('owner_id', sa.String(length=36), nullable=True))
            # Backfill owner_id from user_id
            op.execute("UPDATE conversations SET owner_id = user_id WHERE owner_id IS NULL")
            # Create index
            op.create_index('ix_conversations_owner_id', 'conversations', ['owner_id'], unique=False)
        
        if 'visibility' not in columns:
            op.add_column('conversations', sa.Column('visibility', sa.String(length=32), nullable=False, server_default='private'))
            op.create_index('ix_conversations_visibility', 'conversations', ['visibility'], unique=False)

    if 'conversation_messages' in tables:
        columns = [c['name'] for c in inspector.get_columns('conversation_messages')]
        if 'owner_id' not in columns:
            op.add_column('conversation_messages', sa.Column('owner_id', sa.String(length=36), nullable=True))
            # Backfill owner_id from parent conversation
            op.execute("""
                UPDATE conversation_messages
                SET owner_id = (SELECT user_id FROM conversations WHERE conversations.id = conversation_messages.conversation_id)
                WHERE owner_id IS NULL
            """)
            op.create_index('ix_conversation_messages_owner_id', 'conversation_messages', ['owner_id'], unique=False)

    if 'documents' in tables:
        columns = [c['name'] for c in inspector.get_columns('documents')]
        if 'owner_id' not in columns:
            op.add_column('documents', sa.Column('owner_id', sa.String(length=36), nullable=True))
            op.execute("UPDATE documents SET owner_id = uploader_id WHERE owner_id IS NULL")
            op.create_index('ix_documents_owner_id', 'documents', ['owner_id'], unique=False)
        if 'visibility' not in columns:
            op.add_column('documents', sa.Column('visibility', sa.String(length=32), nullable=False, server_default='department'))
            op.create_index('ix_documents_visibility', 'documents', ['visibility'], unique=False)


def downgrade() -> None:
    pass
