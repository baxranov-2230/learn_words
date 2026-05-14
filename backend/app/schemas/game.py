from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.game_session import GameType


class GameStartRequest(BaseModel):
    deck_id: int
    limit: int = 200


class FlashcardItem(BaseModel):
    card_id: int
    term: str
    definition: str
    transcription: str | None = None


class TestQuestion(BaseModel):
    card_id: int
    term: str
    definition: str  # to'g'ri javob (write/true-false uchun)
    options: list[str]  # multiple-choice uchun (4 ta)


class GameStartResponse(BaseModel):
    session_token: str  # frontda foydalaniladi (UI tracking)
    deck_id: int
    items: list[FlashcardItem] | list[TestQuestion]


class GameSessionCreate(BaseModel):
    deck_id: int | None = None
    game_type: GameType
    score: int = 0
    duration_seconds: int = 0
    correct: int = 0
    incorrect: int = 0


class GameSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    deck_id: int | None
    game_type: GameType
    score: int
    duration_seconds: int
    correct: int
    incorrect: int
    completed_at: datetime


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    score: int
    duration_seconds: int
    completed_at: datetime
