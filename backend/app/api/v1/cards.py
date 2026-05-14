from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DBSession
from app.models.user import UserRole
from app.schemas.card import CardBulkCreate, CardCreate, CardRead, CardUpdate
from app.services import card as card_service
from app.services import deck as deck_service

router = APIRouter()


async def _ensure_deck_owner(db, deck_id: int, current):
    deck = await deck_service.get_deck(db, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current.id and current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    return deck


async def _ensure_deck_readable(db, deck_id: int, current):
    deck = await deck_service.get_deck(db, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current.id and current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    return deck


@router.get("/decks/{deck_id}/cards", response_model=list[CardRead])
async def list_cards(deck_id: int, current: CurrentUser, db: DBSession) -> list[CardRead]:
    await _ensure_deck_readable(db, deck_id, current)
    cards = await card_service.list_cards(db, deck_id)
    return [CardRead.model_validate(c) for c in cards]


@router.post(
    "/decks/{deck_id}/cards",
    response_model=CardRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_card(
    deck_id: int, data: CardCreate, current: CurrentUser, db: DBSession
) -> CardRead:
    await _ensure_deck_owner(db, deck_id, current)
    card = await card_service.create_card(db, deck_id, data)
    return CardRead.model_validate(card)


@router.post(
    "/decks/{deck_id}/cards/bulk",
    response_model=list[CardRead],
    status_code=status.HTTP_201_CREATED,
)
async def bulk_create_cards(
    deck_id: int, data: CardBulkCreate, current: CurrentUser, db: DBSession
) -> list[CardRead]:
    await _ensure_deck_owner(db, deck_id, current)
    cards = await card_service.bulk_create_cards(db, deck_id, data.cards)
    return [CardRead.model_validate(c) for c in cards]


@router.patch("/cards/{card_id}", response_model=CardRead)
async def update_card(
    card_id: int, data: CardUpdate, current: CurrentUser, db: DBSession
) -> CardRead:
    card = await card_service.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    await _ensure_deck_owner(db, card.deck_id, current)
    card = await card_service.update_card(db, card, data)
    return CardRead.model_validate(card)


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(card_id: int, current: CurrentUser, db: DBSession) -> None:
    card = await card_service.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    await _ensure_deck_owner(db, card.deck_id, current)
    await card_service.delete_card(db, card)
