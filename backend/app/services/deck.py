from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card
from app.models.deck import Deck
from app.schemas.deck import DeckCreate, DeckUpdate


async def list_decks(
    db: AsyncSession,
    *,
    owner_id: int | None,
    public_only: bool,
    search: str | None,
    source_lang: str | None,
    target_lang: str | None,
    level: str | None,
    topic: str | None,
    page: int,
    page_size: int,
) -> tuple[list[tuple[Deck, int]], int]:
    """Decks ro'yxati + har biriga cards_count.

    `owner_id` berilsa o'sha foydalanuvchining barcha decklari, aks holda
    `public_only=True` bilan public decklar qaytariladi.
    """
    filters = []
    if owner_id is not None:
        filters.append(Deck.user_id == owner_id)
    if public_only:
        filters.append(Deck.is_public.is_(True))
    if search:
        like = f"%{search}%"
        filters.append(or_(Deck.title.ilike(like), Deck.description.ilike(like)))
    if source_lang:
        filters.append(Deck.source_lang == source_lang)
    if target_lang:
        filters.append(Deck.target_lang == target_lang)
    if level:
        filters.append(Deck.level == level)
    if topic:
        filters.append(Deck.topic == topic)

    where_clause = and_(*filters) if filters else None

    count_stmt = select(func.count()).select_from(Deck)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = (await db.execute(count_stmt)).scalar_one()

    cards_count_sub = (
        select(Card.deck_id, func.count(Card.id).label("cnt"))
        .group_by(Card.deck_id)
        .subquery()
    )

    stmt = (
        select(Deck, func.coalesce(cards_count_sub.c.cnt, 0))
        .outerjoin(cards_count_sub, cards_count_sub.c.deck_id == Deck.id)
        .order_by(Deck.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    if where_clause is not None:
        stmt = stmt.where(where_clause)
    rows = (await db.execute(stmt)).all()
    items: list[tuple[Deck, int]] = [(row[0], row[1]) for row in rows]
    return items, total


async def create_deck(db: AsyncSession, owner_id: int, data: DeckCreate) -> Deck:
    deck = Deck(user_id=owner_id, **data.model_dump())
    db.add(deck)
    await db.commit()
    await db.refresh(deck)
    return deck


async def get_deck(db: AsyncSession, deck_id: int) -> Deck | None:
    return (
        await db.execute(select(Deck).where(Deck.id == deck_id))
    ).scalar_one_or_none()


async def update_deck(db: AsyncSession, deck: Deck, data: DeckUpdate) -> Deck:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(deck, field, value)
    await db.commit()
    await db.refresh(deck)
    return deck


async def delete_deck(db: AsyncSession, deck: Deck) -> None:
    await db.delete(deck)
    await db.commit()


async def clone_deck(db: AsyncSession, source: Deck, new_owner_id: int) -> Deck:
    new_deck = Deck(
        user_id=new_owner_id,
        title=f"{source.title} (copy)",
        description=source.description,
        source_lang=source.source_lang,
        target_lang=source.target_lang,
        level=source.level,
        topic=source.topic,
        is_public=False,
    )
    db.add(new_deck)
    await db.flush()

    cards = (
        await db.execute(select(Card).where(Card.deck_id == source.id).order_by(Card.position))
    ).scalars().all()
    for c in cards:
        db.add(
            Card(
                deck_id=new_deck.id,
                term=c.term,
                definition=c.definition,
                transcription=c.transcription,
                example=c.example,
                image_url=c.image_url,
                audio_url=c.audio_url,
                position=c.position,
            )
        )
    await db.commit()
    await db.refresh(new_deck)
    return new_deck


async def cards_count(db: AsyncSession, deck_id: int) -> int:
    return (
        await db.execute(select(func.count(Card.id)).where(Card.deck_id == deck_id))
    ).scalar_one()
