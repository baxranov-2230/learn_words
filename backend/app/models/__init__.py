from app.models.card import Card
from app.models.course import Course
from app.models.deck import Deck
from app.models.game_session import GameSession
from app.models.language import Language
from app.models.lesson import Lesson, UserLessonProgress
from app.models.story import Story
from app.models.story_word import StoryWord
from app.models.user import User
from app.models.user_progress import UserProgress
from app.models.user_streak import UserStreak


def register_models() -> None:
    """Import-only function — ensures all models are registered with Base.metadata."""
    return None


__all__ = [
    "Card",
    "Course",
    "Deck",
    "GameSession",
    "Language",
    "Lesson",
    "Story",
    "StoryWord",
    "User",
    "UserLessonProgress",
    "UserProgress",
    "UserStreak",
    "register_models",
]
