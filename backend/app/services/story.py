import random

from pathlib import Path
from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.card import Card
from app.models.deck import Deck
from app.models.story import Story
from app.models.story_word import StoryWord
from app.schemas.story import QuizQuestion, StoryCreate, StoryUpdate


def _delete_audio_file(audio_url: str | None) -> None:
    if not audio_url:
        return
    # Remove leading slash if present
    path_str = audio_url.lstrip("/")
    path = Path(path_str)
    if path.exists() and path.is_file():
        try:
            path.unlink()
        except Exception:
            pass


async def list_stories(
    db: AsyncSession,
    *,
    level: str | None,
    topic: str | None,
    deck_id: int | None = None,
    standalone_only: bool = False,
    published_only: bool = True,
) -> list[Story]:
    filters = []
    if published_only:
        filters.append(Story.is_published.is_(True))
    if level:
        filters.append(Story.level == level)
    if topic:
        filters.append(Story.topic == topic)
    if deck_id is not None:
        filters.append(Story.deck_id == deck_id)
    elif standalone_only:
        filters.append(Story.deck_id.is_(None))
    stmt = select(Story).order_by(Story.created_at.desc())
    if filters:
        stmt = stmt.where(and_(*filters))
    return (await db.execute(stmt)).scalars().all()


async def get_story(db: AsyncSession, story_id: int) -> Story | None:
    return (
        await db.execute(
            select(Story)
            .options(selectinload(Story.words))
            .where(Story.id == story_id)
        )
    ).scalar_one_or_none()


async def create_story(db: AsyncSession, author_id: int | None, data: StoryCreate) -> Story:
    deck_id = data.deck_id
    if data.auto_create_deck and deck_id is None and author_id is not None:
        deck = Deck(
            user_id=author_id,
            title=data.title,
            description=data.deck_description,
            source_lang=data.source_lang,
            target_lang=data.target_lang,
            level=data.level,
            topic=data.topic,
            is_public=data.deck_is_public,
            course_id=data.course_id,
        )
        db.add(deck)
        await db.flush()
        for idx, w in enumerate(data.words):
            db.add(
                Card(
                    deck_id=deck.id,
                    term=w.word,
                    definition=w.translation,
                    example=w.note,
                    image_url=w.image_url,
                    position=idx,
                )
            )
        deck_id = deck.id

    story = Story(
        title=data.title,
        content=data.content,
        level=data.level,
        topic=data.topic,
        source_lang=data.source_lang,
        target_lang=data.target_lang,
        is_published=data.is_published,
        author_id=author_id,
        deck_id=deck_id,
        course_id=data.course_id,
    )
    db.add(story)
    await db.flush()
    for w in data.words:
        db.add(StoryWord(story_id=story.id, **w.model_dump()))
    await db.commit()
    return await get_story(db, story.id)  # type: ignore[return-value]


async def words_from_deck(db: AsyncSession, deck_id: int) -> list[dict]:
    cards = (
        await db.execute(
            select(Card).where(Card.deck_id == deck_id).order_by(Card.position)
        )
    ).scalars().all()
    return [
        {
            "word": c.term,
            "translation": c.definition,
            "note": c.example,
            "image_url": c.image_url,
            "position_in_text": idx,
        }
        for idx, c in enumerate(cards)
    ]


async def update_story(db: AsyncSession, story: Story, data: StoryUpdate) -> Story:
    update_data = data.model_dump(exclude_unset=True)
    new_words = update_data.pop("words", None)

    for field, value in update_data.items():
        if field == "audio_url" and story.audio_url and story.audio_url != value:
            _delete_audio_file(story.audio_url)
        setattr(story, field, value)

    if new_words is not None:
        await db.execute(delete(StoryWord).where(StoryWord.story_id == story.id))
        for w in new_words:
            db.add(StoryWord(story_id=story.id, **w))

    await db.commit()
    return await get_story(db, story.id)  # type: ignore[return-value]


async def delete_story(db: AsyncSession, story: Story) -> None:
    if story.audio_url:
        _delete_audio_file(story.audio_url)
    await db.delete(story)
    await db.commit()


async def build_quiz(db: AsyncSession, story: Story, num_questions: int = 30) -> list[QuizQuestion]:
    words = list(story.words)
    if not words:
        return []
    sample = random.sample(words, k=min(num_questions, len(words)))
    questions: list[QuizQuestion] = []
    all_translations = [w.translation for w in words]
    for w in sample:
        wrong = [t for t in all_translations if t != w.translation]
        random.shuffle(wrong)
        options = [w.translation, *wrong[:3]]
        random.shuffle(options)
        questions.append(QuizQuestion(word=w.word, correct=w.translation, options=options))
    return questions


async def clone_story_as_deck(
    db: AsyncSession, story: Story, owner_id: int
) -> Deck:
    deck = Deck(
        user_id=owner_id,
        title=f"{story.title} (story)",
        description=f"Auto-generated from story #{story.id}",
        source_lang=story.source_lang,
        target_lang=story.target_lang,
        level=story.level,
        topic=story.topic,
        is_public=False,
    )
    db.add(deck)
    await db.flush()
    for idx, w in enumerate(story.words):
        db.add(
            Card(
                deck_id=deck.id,
                term=w.word,
                definition=w.translation,
                example=w.note,
                image_url=w.image_url,
                position=idx,
            )
        )
    await db.commit()
    await db.refresh(deck)
    return deck
