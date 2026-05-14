from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StoryWordBase(BaseModel):
    word: str = Field(min_length=1, max_length=200)
    translation: str = Field(min_length=1, max_length=500)
    note: str | None = None
    position_in_text: int = 0


class StoryWordCreate(StoryWordBase):
    pass


class StoryWordRead(StoryWordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    story_id: int


class StoryBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    audio_url: str | None = None
    level: str | None = None
    topic: str | None = None
    source_lang: str = "en"
    target_lang: str = "uz"
    is_published: bool = False
    deck_id: int | None = None
    course_id: int | None = None


class StoryCreate(StoryBase):
    words: list[StoryWordCreate] = []
    auto_create_deck: bool = False
    deck_is_public: bool = True
    deck_description: str | None = None


class StoryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    audio_url: str | None = None
    level: str | None = None
    topic: str | None = None
    source_lang: str | None = None
    target_lang: str | None = None
    is_published: bool | None = None
    deck_id: int | None = None
    course_id: int | None = None
    words: list[StoryWordCreate] | None = None


class StoryRead(StoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    author_id: int | None
    created_at: datetime
    words: list[StoryWordRead] = []


class StoryListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    audio_url: str | None = None
    level: str | None
    topic: str | None
    source_lang: str
    target_lang: str
    is_published: bool
    deck_id: int | None
    course_id: int | None
    created_at: datetime


class QuizQuestion(BaseModel):
    word: str
    correct: str
    options: list[str]


class StoryQuiz(BaseModel):
    story_id: int
    questions: list[QuizQuestion]
