"""split incorrect counts by source

Revision ID: 006_split_incorrect_counts
Revises: e80637ab55dd
Create Date: 2026-05-21
"""
from alembic import op
import sqlalchemy as sa

revision = '006_split_incorrect_counts'
down_revision = 'e80637ab55dd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user_progress', sa.Column('flashcard_incorrect', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('user_progress', sa.Column('test_incorrect', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('user_progress', 'test_incorrect')
    op.drop_column('user_progress', 'flashcard_incorrect')
