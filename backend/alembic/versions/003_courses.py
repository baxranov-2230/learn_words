"""add courses table and link decks/stories

Revision ID: 003_courses
Revises: 002_story_deck_link
Create Date: 2026-04-29 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_courses"
down_revision: Union[str, None] = "002_story_deck_link"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.String(length=10), nullable=True),
        sa.Column("topic", sa.String(length=100), nullable=True),
        sa.Column("source_lang", sa.String(length=10), nullable=False, server_default="en"),
        sa.Column("target_lang", sa.String(length=10), nullable=False, server_default="uz"),
        sa.Column("cover_color", sa.String(length=20), nullable=True),
        sa.Column(
            "author_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_courses_level", "courses", ["level"])
    op.create_index("ix_courses_topic", "courses", ["topic"])

    op.add_column("decks", sa.Column("course_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_decks_course_id_courses",
        "decks",
        "courses",
        ["course_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_decks_course_id", "decks", ["course_id"])

    op.add_column("stories", sa.Column("course_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_stories_course_id_courses",
        "stories",
        "courses",
        ["course_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_stories_course_id", "stories", ["course_id"])


def downgrade() -> None:
    op.drop_index("ix_stories_course_id", table_name="stories")
    op.drop_constraint("fk_stories_course_id_courses", "stories", type_="foreignkey")
    op.drop_column("stories", "course_id")

    op.drop_index("ix_decks_course_id", table_name="decks")
    op.drop_constraint("fk_decks_course_id_courses", "decks", type_="foreignkey")
    op.drop_column("decks", "course_id")

    op.drop_index("ix_courses_topic", table_name="courses")
    op.drop_index("ix_courses_level", table_name="courses")
    op.drop_table("courses")
