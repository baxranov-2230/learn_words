"""add lessons and user lesson progress

Revision ID: 004_lessons
Revises: 003_courses
Create Date: 2026-04-29 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_lessons"
down_revision: Union[str, None] = "003_courses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "course_id",
            sa.Integer(),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "passing_score", sa.Integer(), nullable=False, server_default="70"
        ),
        sa.Column(
            "deck_id",
            sa.Integer(),
            sa.ForeignKey("decks.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "story_id",
            sa.Integer(),
            sa.ForeignKey("stories.id", ondelete="SET NULL"),
            nullable=True,
        ),
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
    op.create_index("ix_lessons_course_id", "lessons", ["course_id"])
    op.create_index("ix_lessons_deck_id", "lessons", ["deck_id"])
    op.create_index("ix_lessons_story_id", "lessons", ["story_id"])

    op.create_table(
        "user_lesson_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "lesson_id",
            sa.Integer(),
            sa.ForeignKey("lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("best_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "passed", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),
    )
    op.create_index(
        "ix_user_lesson_progress_user_id", "user_lesson_progress", ["user_id"]
    )
    op.create_index(
        "ix_user_lesson_progress_lesson_id", "user_lesson_progress", ["lesson_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_user_lesson_progress_lesson_id", table_name="user_lesson_progress")
    op.drop_index("ix_user_lesson_progress_user_id", table_name="user_lesson_progress")
    op.drop_table("user_lesson_progress")
    op.drop_index("ix_lessons_story_id", table_name="lessons")
    op.drop_index("ix_lessons_deck_id", table_name="lessons")
    op.drop_index("ix_lessons_course_id", table_name="lessons")
    op.drop_table("lessons")
