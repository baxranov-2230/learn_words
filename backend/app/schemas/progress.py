from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewRequest(BaseModel):
    card_id: int
    quality: int = Field(ge=0, le=5)


class ReviewResponse(BaseModel):
    card_id: int
    mastery_level: int
    repetitions: int
    interval_days: int
    ease_factor: float
    next_review_at: datetime | None


class DueCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    deck_id: int
    term: str
    definition: str
    transcription: str | None = None
    next_review_at: datetime | None = None
    mastery_level: int = 0


class ProgressSummary(BaseModel):
    total_cards: int
    learning: int  # mastery 1..4
    mastered: int  # mastery 5
    due_now: int
    current_streak: int
    longest_streak: int
    last_activity_date: date | None
