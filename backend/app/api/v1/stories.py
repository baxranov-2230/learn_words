from fastapi import APIRouter, HTTPException, status

from app.core.deps import AdminUser, CurrentUser, DBSession
from app.schemas.deck import DeckRead
from app.schemas.story import (
    StoryCreate,
    StoryListItem,
    StoryQuiz,
    StoryRead,
    StoryUpdate,
)
from app.services import deck as deck_service
from app.services import story as story_service

router = APIRouter()


@router.get("", response_model=list[StoryListItem])
async def list_stories(
    db: DBSession,
    level: str | None = None,
    topic: str | None = None,
    deck_id: int | None = None,
    standalone: bool = False,
) -> list[StoryListItem]:
    stories = await story_service.list_stories(
        db,
        level=level,
        topic=topic,
        deck_id=deck_id,
        standalone_only=standalone,
        published_only=True,
    )
    return [StoryListItem.model_validate(s) for s in stories]


@router.get("/{story_id}", response_model=StoryRead)
async def get_story(story_id: int, db: DBSession) -> StoryRead:
    story = await story_service.get_story(db, story_id)
    if not story or not story.is_published:
        raise HTTPException(status_code=404, detail="Story not found")
    return StoryRead.model_validate(story)


@router.post("", response_model=StoryRead, status_code=status.HTTP_201_CREATED)
async def create_story(
    data: StoryCreate, admin: AdminUser, db: DBSession
) -> StoryRead:
    story = await story_service.create_story(db, admin.id, data)
    return StoryRead.model_validate(story)


@router.patch("/{story_id}", response_model=StoryRead)
async def update_story(
    story_id: int, data: StoryUpdate, admin: AdminUser, db: DBSession
) -> StoryRead:
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    story = await story_service.update_story(db, story, data)
    return StoryRead.model_validate(story)


@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(story_id: int, admin: AdminUser, db: DBSession) -> None:
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    await story_service.delete_story(db, story)


@router.get("/{story_id}/quiz", response_model=StoryQuiz)
async def get_story_quiz(story_id: int, current: CurrentUser, db: DBSession) -> StoryQuiz:
    story = await story_service.get_story(db, story_id)
    if not story or not story.is_published:
        raise HTTPException(status_code=404, detail="Story not found")
    questions = await story_service.build_quiz(db, story)
    return StoryQuiz(story_id=story.id, questions=questions)


@router.post(
    "/{story_id}/clone-as-deck",
    response_model=DeckRead,
    status_code=status.HTTP_201_CREATED,
)
async def clone_as_deck(story_id: int, current: CurrentUser, db: DBSession) -> DeckRead:
    story = await story_service.get_story(db, story_id)
    if not story or not story.is_published:
        raise HTTPException(status_code=404, detail="Story not found")
    deck = await story_service.clone_story_as_deck(db, story, current.id)
    cnt = await deck_service.cards_count(db, deck.id)
    payload = DeckRead.model_validate(deck)
    payload.cards_count = cnt
    return payload
