from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column


class GameType(str, Enum):
    FLASHCARDS = "flashcards"
    TEST = "test"
    MATCH = "match"
    SPELLING = "spelling"
    GRAVITY = "gravity"


from app.db.base import Base  # noqa: E402


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    deck_id: Mapped[int | None] = mapped_column(
        ForeignKey("decks.id", ondelete="SET NULL"), index=True, nullable=True
    )
    game_type: Mapped[GameType] = mapped_column(
        SAEnum(GameType, name="game_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    score: Mapped[int] = mapped_column(default=0, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(default=0, nullable=False)
    correct: Mapped[int] = mapped_column(default=0, nullable=False)
    incorrect: Mapped[int] = mapped_column(default=0, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
