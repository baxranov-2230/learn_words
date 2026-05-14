from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    topic: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    source_lang: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    target_lang: Mapped[str] = mapped_column(String(10), default="uz", nullable=False)
    cover_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_published: Mapped[bool] = mapped_column(default=True, nullable=False)
    position: Mapped[int] = mapped_column(default=0, nullable=False)
    language_id: Mapped[int | None] = mapped_column(
        ForeignKey("languages.id", ondelete="SET NULL"), nullable=True, index=True
    )

    language: Mapped["Language | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="courses"
    )
    decks: Mapped[list["Deck"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course"
    )
    stories: Mapped[list["Story"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course"
    )
    lessons: Mapped[list["Lesson"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.position",
    )
