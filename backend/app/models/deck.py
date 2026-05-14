from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Deck(Base, TimestampMixin):
    __tablename__ = "decks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_lang: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    target_lang: Mapped[str] = mapped_column(String(10), nullable=False, default="uz")
    level: Mapped[str | None] = mapped_column(String(10), nullable=True)  # A1..C2
    topic: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_public: Mapped[bool] = mapped_column(default=False, nullable=False)
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True
    )

    user: Mapped["User"] = relationship(back_populates="decks")  # type: ignore[name-defined]  # noqa: F821
    cards: Mapped[list["Card"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="deck", cascade="all, delete-orphan", order_by="Card.position"
    )
    stories: Mapped[list["Story"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="deck"
    )
    course: Mapped["Course | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="decks"
    )
