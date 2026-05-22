from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StoryWord(Base):
    __tablename__ = "story_words"

    id: Mapped[int] = mapped_column(primary_key=True)
    story_id: Mapped[int] = mapped_column(
        ForeignKey("stories.id", ondelete="CASCADE"), index=True, nullable=False
    )
    word: Mapped[str] = mapped_column(String(200), nullable=False)
    translation: Mapped[str] = mapped_column(String(500), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    position_in_text: Mapped[int] = mapped_column(default=0, nullable=False)

    story: Mapped["Story"] = relationship(back_populates="words")  # type: ignore[name-defined]  # noqa: F821
