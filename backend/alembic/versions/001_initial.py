"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-04-28 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("native_language", sa.String(length=10), nullable=True),
        sa.Column("learning_language", sa.String(length=10), nullable=True),
        sa.Column(
            "role",
            sa.Enum("user", "admin", name="user_role"),
            nullable=False,
            server_default="user",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "decks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_lang", sa.String(length=10), nullable=False, server_default="en"),
        sa.Column("target_lang", sa.String(length=10), nullable=False, server_default="uz"),
        sa.Column("level", sa.String(length=10), nullable=True),
        sa.Column("topic", sa.String(length=100), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_decks_user_id", "decks", ["user_id"])
    op.create_index("ix_decks_is_public", "decks", ["is_public"])

    op.create_table(
        "cards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("deck_id", sa.Integer(), sa.ForeignKey("decks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("term", sa.String(length=200), nullable=False),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column("transcription", sa.String(length=200), nullable=True),
        sa.Column("example", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("audio_url", sa.String(length=500), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_cards_deck_id", "cards", ["deck_id"])

    op.create_table(
        "stories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("level", sa.String(length=10), nullable=True),
        sa.Column("topic", sa.String(length=100), nullable=True),
        sa.Column("source_lang", sa.String(length=10), nullable=False, server_default="en"),
        sa.Column("target_lang", sa.String(length=10), nullable=False, server_default="uz"),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_stories_level", "stories", ["level"])
    op.create_index("ix_stories_topic", "stories", ["topic"])

    op.create_table(
        "story_words",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("story_id", sa.Integer(), sa.ForeignKey("stories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("word", sa.String(length=200), nullable=False),
        sa.Column("translation", sa.String(length=500), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("position_in_text", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_story_words_story_id", "story_words", ["story_id"])

    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("card_id", sa.Integer(), sa.ForeignKey("cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mastery_level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("repetitions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ease_factor", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("next_review_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("incorrect_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "card_id", name="uq_user_card"),
    )
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])
    op.create_index("ix_user_progress_card_id", "user_progress", ["card_id"])
    op.create_index("ix_user_progress_next_review_at", "user_progress", ["next_review_at"])

    op.create_table(
        "game_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("deck_id", sa.Integer(), sa.ForeignKey("decks.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "game_type",
            sa.Enum(
                "flashcards", "test", "match", "spelling", "gravity",
                name="game_type",
            ),
            nullable=False,
        ),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("incorrect", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_game_sessions_user_id", "game_sessions", ["user_id"])
    op.create_index("ix_game_sessions_deck_id", "game_sessions", ["deck_id"])

    op.create_table(
        "user_streaks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_streaks_user_id", "user_streaks", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_table("user_streaks")
    op.drop_table("game_sessions")
    op.drop_table("user_progress")
    op.drop_table("story_words")
    op.drop_table("stories")
    op.drop_table("cards")
    op.drop_table("decks")
    op.drop_table("users")
    sa.Enum(name="game_type").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)
