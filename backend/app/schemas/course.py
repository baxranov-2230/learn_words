from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CourseBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    level: str | None = None
    topic: str | None = None
    source_lang: str = "en"
    target_lang: str = "uz"
    cover_color: str | None = None
    is_published: bool = True
    position: int = 0
    language_id: int | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    level: str | None = None
    topic: str | None = None
    source_lang: str | None = None
    target_lang: str | None = None
    cover_color: str | None = None
    is_published: bool | None = None
    position: int | None = None
    language_id: int | None = None


class CourseRead(CourseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    author_id: int | None
    created_at: datetime
    decks_count: int = 0
    stories_count: int = 0


class CourseDeckItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    level: str | None
    is_public: bool
    cards_count: int = 0


class CourseStoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    level: str | None
    is_published: bool


class CourseDetail(CourseRead):
    decks: list[CourseDeckItem] = []
    stories: list[CourseStoryItem] = []
