from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LessonBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    passing_score: int = Field(default=70, ge=0, le=100)
    position: int = 0
    deck_id: int | None = None
    story_id: int | None = None


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: str | None = None
    passing_score: int | None = Field(default=None, ge=0, le=100)
    position: int | None = None
    deck_id: int | None = None
    story_id: int | None = None


class LessonRead(LessonBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int


class LessonStatus(LessonRead):
    locked: bool = True
    passed: bool = False
    best_score: int = 0
    attempts: int = 0
    last_attempt_at: datetime | None = None


class LessonAttemptIn(BaseModel):
    score: int = Field(ge=0, le=100)


class LessonAttemptResult(BaseModel):
    lesson_id: int
    best_score: int
    attempts: int
    passed: bool
    just_passed: bool = False
    next_lesson_id: int | None = None


class CourseProgress(BaseModel):
    total_lessons: int
    passed_lessons: int
    percent: int  # 0..100
    next_lesson_id: int | None = None
