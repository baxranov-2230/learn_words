from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, DBSession
from app.models.card import Card
from app.models.deck import Deck
from app.models.user_progress import UserProgress
from app.models.user_streak import UserStreak
from app.schemas.progress import (
    DueCard,
    ProgressSummary,
    ReviewRequest,
    ReviewResponse,
    WeakCard,
)
from app.services.srs import review as srs_review
from app.services.streak import touch_streak

router = APIRouter()


@router.post("/review", response_model=ReviewResponse)
async def submit_review(
    data: ReviewRequest, current: CurrentUser, db: DBSession
) -> ReviewResponse:
    card = (await db.execute(select(Card).where(Card.id == data.card_id))).scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    deck = (
        await db.execute(select(Deck).where(Deck.id == card.deck_id))
    ).scalar_one_or_none()
    if not deck or (not deck.is_public and deck.user_id != current.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    progress = (
        await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == current.id, UserProgress.card_id == card.id
            )
        )
    ).scalar_one_or_none()

    if progress is None:
        progress = UserProgress(
            user_id=current.id,
            card_id=card.id,
            mastery_level=0,
            repetitions=0,
            interval_days=0,
            ease_factor=2.5,
            correct_count=0,
            incorrect_count=0,
        )
        db.add(progress)

    result = srs_review(
        quality=data.quality,
        prev_repetitions=progress.repetitions,
        prev_interval_days=progress.interval_days,
        prev_ease_factor=progress.ease_factor,
    )
    progress.repetitions = result.repetitions
    progress.interval_days = result.interval_days
    progress.ease_factor = result.ease_factor
    progress.mastery_level = result.mastery_level
    now = datetime.now(UTC)
    progress.last_reviewed_at = now
    progress.next_review_at = now + timedelta(days=result.interval_days)

    if data.quality >= 3:
        progress.correct_count += 1
    else:
        progress.incorrect_count += 1
        if data.source == 'test':
            progress.test_incorrect += 1
        else:
            progress.flashcard_incorrect += 1

    await touch_streak(db, current.id)
    await db.commit()
    await db.refresh(progress)

    return ReviewResponse(
        card_id=card.id,
        mastery_level=progress.mastery_level,
        repetitions=progress.repetitions,
        interval_days=progress.interval_days,
        ease_factor=progress.ease_factor,
        next_review_at=progress.next_review_at,
    )


@router.get("/due", response_model=list[DueCard])
async def get_due(
    current: CurrentUser,
    db: DBSession,
    limit: int = Query(20, ge=1, le=200),
    deck_id: int | None = None,
) -> list[DueCard]:
    now = datetime.now(UTC)
    stmt = (
        select(Card, UserProgress)
        .join(UserProgress, UserProgress.card_id == Card.id)
        .where(
            UserProgress.user_id == current.id,
            UserProgress.next_review_at <= now,
        )
        .order_by(UserProgress.next_review_at.asc())
        .limit(limit)
    )
    if deck_id is not None:
        stmt = stmt.where(Card.deck_id == deck_id)
    rows = (await db.execute(stmt)).all()
    return [
        DueCard(
            id=card.id,
            deck_id=card.deck_id,
            term=card.term,
            definition=card.definition,
            transcription=card.transcription,
            next_review_at=prog.next_review_at,
            mastery_level=prog.mastery_level,
        )
        for card, prog in rows
    ]


@router.get("/me", response_model=ProgressSummary)
async def my_progress(current: CurrentUser, db: DBSession) -> ProgressSummary:
    now = datetime.now(UTC)
    total_cards = (
        await db.execute(
            select(func.count()).select_from(UserProgress).where(
                UserProgress.user_id == current.id
            )
        )
    ).scalar_one()
    learning = (
        await db.execute(
            select(func.count()).select_from(UserProgress).where(
                UserProgress.user_id == current.id,
                UserProgress.mastery_level.between(1, 4),
            )
        )
    ).scalar_one()
    mastered = (
        await db.execute(
            select(func.count()).select_from(UserProgress).where(
                UserProgress.user_id == current.id,
                UserProgress.mastery_level == 5,
            )
        )
    ).scalar_one()
    due_now = (
        await db.execute(
            select(func.count()).select_from(UserProgress).where(
                UserProgress.user_id == current.id,
                UserProgress.next_review_at <= now,
            )
        )
    ).scalar_one()
    streak = (
        await db.execute(select(UserStreak).where(UserStreak.user_id == current.id))
    ).scalar_one_or_none()
    return ProgressSummary(
        total_cards=total_cards,
        learning=learning,
        mastered=mastered,
        due_now=due_now,
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        last_activity_date=streak.last_activity_date if streak else None,
    )


@router.get("/weak", response_model=list[WeakCard])
async def get_weak_cards(
    current: CurrentUser,
    db: DBSession,
    source: str | None = Query(default=None, pattern='^(flashcard|test)$'),
    limit: int = Query(200, ge=1, le=500),
) -> list[WeakCard]:
    """Flashcard yoki test bo'yicha bilmaganlar."""
    base = [
        UserProgress.user_id == current.id,
        UserProgress.mastery_level < 4,
    ]
    if source == 'flashcard':
        base.append(UserProgress.flashcard_incorrect > 0)
        order_col = UserProgress.flashcard_incorrect
    elif source == 'test':
        base.append(UserProgress.test_incorrect > 0)
        order_col = UserProgress.test_incorrect
    else:
        base.append(UserProgress.incorrect_count > 0)
        order_col = UserProgress.incorrect_count

    stmt = (
        select(Card, UserProgress)
        .join(UserProgress, UserProgress.card_id == Card.id)
        .where(*base)
        .order_by(order_col.desc(), UserProgress.mastery_level.asc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()
    return [
        WeakCard(
            id=card.id,
            deck_id=card.deck_id,
            term=card.term,
            definition=card.definition,
            transcription=card.transcription,
            mastery_level=prog.mastery_level,
            incorrect_count=prog.incorrect_count,
            correct_count=prog.correct_count,
            flashcard_incorrect=prog.flashcard_incorrect,
            test_incorrect=prog.test_incorrect,
            last_reviewed_at=prog.last_reviewed_at,
        )
        for card, prog in rows
    ]
