from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CardBase(BaseModel):
    term: str = Field(min_length=1, max_length=200)
    definition: str = Field(min_length=1)
    transcription: str | None = None
    example: str | None = None
    image_url: str | None = None
    audio_url: str | None = None
    position: int = 0


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    term: str | None = Field(default=None, min_length=1, max_length=200)
    definition: str | None = None
    transcription: str | None = None
    example: str | None = None
    image_url: str | None = None
    audio_url: str | None = None
    position: int | None = None


class CardRead(CardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    deck_id: int
    created_at: datetime
    updated_at: datetime


class CardBulkCreate(BaseModel):
    cards: list[CardCreate] = Field(min_length=1, max_length=500)
