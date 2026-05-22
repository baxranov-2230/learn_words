"""Add image_url to story_words

Revision ID: 007_story_word_image
Revises: 006_split_incorrect_counts
Create Date: 2026-05-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "007_story_word_image"
down_revision: Union[str, None] = "006_split_incorrect_counts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "story_words",
        sa.Column("image_url", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("story_words", "image_url")
