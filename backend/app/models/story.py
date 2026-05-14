from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Story(Base, TimestampMixin):
    __tablename__ = "stories"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    level: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    topic: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    source_lang: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    target_lang: Mapped[str] = mapped_column(String(10), default="uz", nullable=False)
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deck_id: Mapped[int | None] = mapped_column(
        ForeignKey("decks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_published: Mapped[bool] = mapped_column(default=False, nullable=False)

    words: Mapped[list["StoryWord"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="story",
        cascade="all, delete-orphan",
        order_by="StoryWord.position_in_text",
    )
    deck: Mapped["Deck | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="stories"
    )
    course: Mapped["Course | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="stories"
    )
