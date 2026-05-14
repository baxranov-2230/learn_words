from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserProgress(Base, TimestampMixin):
    __tablename__ = "user_progress"
    __table_args__ = (UniqueConstraint("user_id", "card_id", name="uq_user_card"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    card_id: Mapped[int] = mapped_column(
        ForeignKey("cards.id", ondelete="CASCADE"), index=True, nullable=False
    )
    mastery_level: Mapped[int] = mapped_column(default=0, nullable=False)  # 0..5
    repetitions: Mapped[int] = mapped_column(default=0, nullable=False)
    interval_days: Mapped[int] = mapped_column(default=0, nullable=False)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    next_review_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), index=True, nullable=True
    )
    last_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    correct_count: Mapped[int] = mapped_column(default=0, nullable=False)
    incorrect_count: Mapped[int] = mapped_column(default=0, nullable=False)

    user: Mapped["User"] = relationship(back_populates="progress")  # type: ignore[name-defined]  # noqa: F821
