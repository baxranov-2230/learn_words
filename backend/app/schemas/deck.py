from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DeckBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    source_lang: str = Field(default="en", max_length=10)
    target_lang: str = Field(default="uz", max_length=10)
    level: str | None = Field(default=None, max_length=10)
    topic: str | None = Field(default=None, max_length=100)
    is_public: bool = False
    course_id: int | None = None


class DeckCreate(DeckBase):
    pass


class DeckUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    source_lang: str | None = None
    target_lang: str | None = None
    level: str | None = None
    topic: str | None = None
    is_public: bool | None = None
    course_id: int | None = None


class DeckRead(DeckBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    cards_count: int = 0


class DeckList(BaseModel):
    items: list[DeckRead]
    total: int
    page: int
    page_size: int
