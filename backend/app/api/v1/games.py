from fastapi import APIRouter, HTTPException, Query

from app.core.deps import CurrentUser, DBSession
from app.models.game_session import GameType
from app.schemas.game import (
    GameSessionCreate,
    GameSessionRead,
    GameStartRequest,
    GameStartResponse,
    LeaderboardEntry,
)
from app.services import games as game_service

router = APIRouter()


async def _start_game(
    request: GameStartRequest, current, db, mode: str
) -> GameStartResponse:
    deck = await game_service.deck_accessible(db, request.deck_id, current.id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found or forbidden")
    cards = await game_service.fetch_cards(db, deck.id, request.limit)
    if not cards:
        raise HTTPException(status_code=400, detail="Deck is empty")

    if mode == "test":
        items = game_service.build_test_questions(cards)
    else:
        items = game_service.build_flashcards(cards)

    return GameStartResponse(
        session_token=game_service.session_token(),
        deck_id=deck.id,
        items=items,
    )


@router.post("/flashcards/start", response_model=GameStartResponse)
async def start_flashcards(
    data: GameStartRequest, current: CurrentUser, db: DBSession
) -> GameStartResponse:
    return await _start_game(data, current, db, "flashcards")


@router.post("/test/start", response_model=GameStartResponse)
async def start_test(
    data: GameStartRequest, current: CurrentUser, db: DBSession
) -> GameStartResponse:
    return await _start_game(data, current, db, "test")


@router.post("/match/start", response_model=GameStartResponse)
async def start_match(
    data: GameStartRequest, current: CurrentUser, db: DBSession
) -> GameStartResponse:
    return await _start_game(data, current, db, "match")


@router.post("/spelling/start", response_model=GameStartResponse)
async def start_spelling(
    data: GameStartRequest, current: CurrentUser, db: DBSession
) -> GameStartResponse:
    return await _start_game(data, current, db, "spelling")


@router.post("/gravity/start", response_model=GameStartResponse)
async def start_gravity(
    data: GameStartRequest, current: CurrentUser, db: DBSession
) -> GameStartResponse:
    return await _start_game(data, current, db, "gravity")


@router.post("/sessions", response_model=GameSessionRead)
async def save_session(
    data: GameSessionCreate, current: CurrentUser, db: DBSession
) -> GameSessionRead:
    session = await game_service.save_session(db, current.id, data)
    return GameSessionRead.model_validate(session)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    db: DBSession,
    game_type: GameType,
    deck_id: int | None = None,
    limit: int = Query(10, ge=1, le=50),
) -> list[LeaderboardEntry]:
    return await game_service.leaderboard(
        db, game_type=game_type, deck_id=deck_id, limit=limit
    )
