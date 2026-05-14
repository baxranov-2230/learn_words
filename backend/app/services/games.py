import random
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card
from app.models.deck import Deck
from app.models.game_session import GameSession, GameType
from app.models.user import User
from app.schemas.game import (
    FlashcardItem,
    GameSessionCreate,
    LeaderboardEntry,
    TestQuestion,
)
from app.services.streak import touch_streak


async def fetch_cards(db: AsyncSession, deck_id: int, limit: int) -> list[Card]:
    cards = (
        await db.execute(
            select(Card).where(Card.deck_id == deck_id).order_by(Card.position, Card.id)
        )
    ).scalars().all()
    if not cards:
        return []
    if len(cards) <= limit:
        random.shuffle(cards)
        return cards
    return random.sample(cards, k=limit)


def session_token() -> str:
    return secrets.token_urlsafe(16)


def build_flashcards(cards: list[Card]) -> list[FlashcardItem]:
    return [
        FlashcardItem(
            card_id=c.id,
            term=c.term,
            definition=c.definition,
            transcription=c.transcription,
        )
        for c in cards
    ]


def build_test_questions(cards: list[Card]) -> list[TestQuestion]:
    all_defs = [c.definition for c in cards]
    questions: list[TestQuestion] = []
    for c in cards:
        wrong = [d for d in all_defs if d != c.definition]
        random.shuffle(wrong)
        options = [c.definition, *wrong[:3]]
        # Agar deckda 4 dan kam unique bo'lsa, options 1-2 ta bo'lib qolishi mumkin
        random.shuffle(options)
        questions.append(
            TestQuestion(
                card_id=c.id,
                term=c.term,
                definition=c.definition,
                options=options,
            )
        )
    return questions


async def save_session(
    db: AsyncSession, user_id: int, data: GameSessionCreate
) -> GameSession:
    session = GameSession(
        user_id=user_id,
        deck_id=data.deck_id,
        game_type=data.game_type,
        score=data.score,
        duration_seconds=data.duration_seconds,
        correct=data.correct,
        incorrect=data.incorrect,
    )
    db.add(session)
    await touch_streak(db, user_id)
    await db.commit()
    await db.refresh(session)
    return session


async def leaderboard(
    db: AsyncSession,
    *,
    game_type: GameType,
    deck_id: int | None,
    limit: int = 10,
) -> list[LeaderboardEntry]:
    stmt = (
        select(GameSession, User.username)
        .join(User, User.id == GameSession.user_id)
        .where(GameSession.game_type == game_type)
        .order_by(GameSession.score.desc(), GameSession.duration_seconds.asc())
        .limit(limit)
    )
    if deck_id is not None:
        stmt = stmt.where(GameSession.deck_id == deck_id)
    rows = (await db.execute(stmt)).all()
    return [
        LeaderboardEntry(
            user_id=session.user_id,
            username=username,
            score=session.score,
            duration_seconds=session.duration_seconds,
            completed_at=session.completed_at,
        )
        for session, username in rows
    ]


async def deck_accessible(db: AsyncSession, deck_id: int, user_id: int) -> Deck | None:
    deck = (
        await db.execute(select(Deck).where(Deck.id == deck_id))
    ).scalar_one_or_none()
    if not deck:
        return None
    if deck.is_public or deck.user_id == user_id:
        return deck
    return None
