from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DBSession
from app.models.user import UserRole
from app.schemas.deck import DeckCreate, DeckList, DeckRead, DeckUpdate
from app.services import deck as deck_service

router = APIRouter()


def _to_read(deck, cards_count: int) -> DeckRead:
    payload = DeckRead.model_validate(deck)
    payload.cards_count = cards_count
    return payload


@router.get("", response_model=DeckList)
async def list_decks(
    current: CurrentUser,
    db: DBSession,
    scope: str = Query("mine", pattern="^(mine|public)$"),
    search: str | None = None,
    source_lang: str | None = None,
    target_lang: str | None = None,
    level: str | None = None,
    topic: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> DeckList:
    owner_id = current.id if scope == "mine" else None
    public_only = scope == "public"
    items, total = await deck_service.list_decks(
        db,
        owner_id=owner_id,
        public_only=public_only,
        search=search,
        source_lang=source_lang,
        target_lang=target_lang,
        level=level,
        topic=topic,
        page=page,
        page_size=page_size,
    )
    return DeckList(
        items=[_to_read(d, cnt) for d, cnt in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=DeckRead, status_code=status.HTTP_201_CREATED)
async def create_deck(
    data: DeckCreate, current: CurrentUser, db: DBSession
) -> DeckRead:
    deck = await deck_service.create_deck(db, current.id, data)
    return _to_read(deck, 0)


@router.get("/{deck_id}", response_model=DeckRead)
async def get_deck(deck_id: int, current: CurrentUser, db: DBSession) -> DeckRead:
    deck = await deck_service.get_deck(db, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current.id and current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    cnt = await deck_service.cards_count(db, deck.id)
    return _to_read(deck, cnt)


@router.patch("/{deck_id}", response_model=DeckRead)
async def update_deck(
    deck_id: int, data: DeckUpdate, current: CurrentUser, db: DBSession
) -> DeckRead:
    deck = await deck_service.get_deck(db, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current.id and current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    deck = await deck_service.update_deck(db, deck, data)
    cnt = await deck_service.cards_count(db, deck.id)
    return _to_read(deck, cnt)


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(deck_id: int, current: CurrentUser, db: DBSession) -> None:
    deck = await deck_service.get_deck(db, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current.id and current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    await deck_service.delete_deck(db, deck)


@router.post("/{deck_id}/clone", response_model=DeckRead, status_code=status.HTTP_201_CREATED)
async def clone_deck(
    deck_id: int, current: CurrentUser, db: DBSession
) -> DeckRead:
    deck = await deck_service.get_deck(db, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current.id:
        raise HTTPException(status_code=403, detail="Cannot clone private deck")
    cloned = await deck_service.clone_deck(db, deck, current.id)
    cnt = await deck_service.cards_count(db, cloned.id)
    return _to_read(cloned, cnt)
