"""link stories to decks

Revision ID: 002_story_deck_link
Revises: 001_initial
Create Date: 2026-04-29 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_story_deck_link"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "stories",
        sa.Column("deck_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_stories_deck_id_decks",
        "stories",
        "decks",
        ["deck_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_stories_deck_id", "stories", ["deck_id"])


def downgrade() -> None:
    op.drop_index("ix_stories_deck_id", table_name="stories")
    op.drop_constraint("fk_stories_deck_id_decks", "stories", type_="foreignkey")
    op.drop_column("stories", "deck_id")
