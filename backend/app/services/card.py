from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate


async def list_cards(db: AsyncSession, deck_id: int) -> list[Card]:
    return (
        (
            await db.execute(
                select(Card).where(Card.deck_id == deck_id).order_by(Card.position, Card.id)
            )
        )
        .scalars()
        .all()
    )


async def create_card(db: AsyncSession, deck_id: int, data: CardCreate) -> Card:
    card = Card(deck_id=deck_id, **data.model_dump())
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card


async def bulk_create_cards(
    db: AsyncSession, deck_id: int, items: list[CardCreate]
) -> list[Card]:
    cards = [Card(deck_id=deck_id, **item.model_dump()) for item in items]
    db.add_all(cards)
    await db.commit()
    for c in cards:
        await db.refresh(c)
    return cards


async def get_card(db: AsyncSession, card_id: int) -> Card | None:
    return (await db.execute(select(Card).where(Card.id == card_id))).scalar_one_or_none()


async def update_card(db: AsyncSession, card: Card, data: CardUpdate) -> Card:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    await db.commit()
    await db.refresh(card)
    return card


async def delete_card(db: AsyncSession, card: Card) -> None:
    await db.delete(card)
    await db.commit()
