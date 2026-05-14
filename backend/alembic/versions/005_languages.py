"""add languages and link courses

Revision ID: 005_languages
Revises: 004_lessons
Create Date: 2026-04-30 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_languages"
down_revision: Union[str, None] = "004_lessons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "languages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("native_name", sa.String(length=100), nullable=True),
        sa.Column("flag", sa.String(length=10), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
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
        sa.UniqueConstraint("code", name="uq_languages_code"),
    )
    op.create_index("ix_languages_code", "languages", ["code"])

    op.add_column("courses", sa.Column("language_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_courses_language_id_languages",
        "courses",
        "languages",
        ["language_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_courses_language_id", "courses", ["language_id"])


def downgrade() -> None:
    op.drop_index("ix_courses_language_id", table_name="courses")
    op.drop_constraint("fk_courses_language_id_languages", "courses", type_="foreignkey")
    op.drop_column("courses", "language_id")
    op.drop_index("ix_languages_code", table_name="languages")
    op.drop_table("languages")
