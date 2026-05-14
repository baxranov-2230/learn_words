from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.deps import AdminUser, DBSession
from app.models.card import Card
from app.models.deck import Deck
from app.models.game_session import GameSession
from app.models.story import Story
from app.models.user import User, UserRole
from app.schemas.deck import DeckRead
from app.schemas.story import StoryListItem
from app.schemas.user import UserMe

router = APIRouter()


class UserPatch(BaseModel):
    is_active: bool | None = None
    role: UserRole | None = None


class AdminStats(BaseModel):
    users_total: int
    decks_total: int
    public_decks: int
    stories_total: int
    game_sessions_total: int


@router.get("/users", response_model=list[UserMe])
async def list_users(
    admin: AdminUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[UserMe]:
    rows = (
        await db.execute(
            select(User).order_by(User.id).offset((page - 1) * page_size).limit(page_size)
        )
    ).scalars().all()
    return [UserMe.model_validate(u) for u in rows]


@router.patch("/users/{user_id}", response_model=UserMe)
async def patch_user(
    user_id: int, data: UserPatch, admin: AdminUser, db: DBSession
) -> UserMe:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role
    await db.commit()
    await db.refresh(user)
    return UserMe.model_validate(user)


@router.get("/decks", response_model=list[DeckRead])
async def list_all_decks(
    admin: AdminUser,
    db: DBSession,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
) -> list[DeckRead]:
    stmt = select(Deck).order_by(Deck.created_at.desc())
    if search:
        like = f"%{search}%"
        stmt = stmt.where(Deck.title.ilike(like))
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    decks = (await db.execute(stmt)).scalars().all()

    counts_rows = (
        await db.execute(
            select(Card.deck_id, func.count(Card.id)).group_by(Card.deck_id)
        )
    ).all()
    counts = {row[0]: row[1] for row in counts_rows}
    out: list[DeckRead] = []
    for d in decks:
        payload = DeckRead.model_validate(d)
        payload.cards_count = counts.get(d.id, 0)
        out.append(payload)
    return out


@router.get("/stories", response_model=list[StoryListItem])
async def list_all_stories(
    admin: AdminUser,
    db: DBSession,
    course_id: int | None = None,
    course_id_null: bool = False,
) -> list[StoryListItem]:
    stmt = select(Story).order_by(Story.created_at.desc())
    if course_id is not None:
        stmt = stmt.where(Story.course_id == course_id)
    elif course_id_null:
        stmt = stmt.where(Story.course_id.is_(None))
    rows = (await db.execute(stmt)).scalars().all()
    return [StoryListItem.model_validate(s) for s in rows]


@router.patch("/decks/{deck_id}/unpublish", status_code=status.HTTP_204_NO_CONTENT)
async def unpublish_deck(deck_id: int, admin: AdminUser, db: DBSession) -> None:
    deck = (await db.execute(select(Deck).where(Deck.id == deck_id))).scalar_one_or_none()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    deck.is_public = False
    await db.commit()


@router.get("/stats", response_model=AdminStats)
async def stats(admin: AdminUser, db: DBSession) -> AdminStats:
    return AdminStats(
        users_total=(await db.execute(select(func.count(User.id)))).scalar_one(),
        decks_total=(await db.execute(select(func.count(Deck.id)))).scalar_one(),
        public_decks=(
            await db.execute(select(func.count(Deck.id)).where(Deck.is_public.is_(True)))
        ).scalar_one(),
        stories_total=(await db.execute(select(func.count(Story.id)))).scalar_one(),
        game_sessions_total=(
            await db.execute(select(func.count(GameSession.id)))
        ).scalar_one(),
    )
