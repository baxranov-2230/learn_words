from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card
from app.models.course import Course
from app.models.deck import Deck
from app.models.story import Story
from app.schemas.course import (
    CourseCreate,
    CourseDeckItem,
    CourseDetail,
    CourseRead,
    CourseStoryItem,
    CourseUpdate,
)


async def list_courses(
    db: AsyncSession,
    *,
    level: str | None = None,
    topic: str | None = None,
    language_id: int | None = None,
    published_only: bool = True,
) -> list[CourseRead]:
    stmt = select(Course).order_by(Course.position, Course.created_at.desc())
    if published_only:
        stmt = stmt.where(Course.is_published.is_(True))
    if level:
        stmt = stmt.where(Course.level == level)
    if topic:
        stmt = stmt.where(Course.topic == topic)
    if language_id is not None:
        stmt = stmt.where(Course.language_id == language_id)
    courses = (await db.execute(stmt)).scalars().all()
    if not courses:
        return []

    course_ids = [c.id for c in courses]

    deck_count_stmt = (
        select(Deck.course_id, func.count(Deck.id))
        .where(Deck.course_id.in_(course_ids))
        .group_by(Deck.course_id)
    )
    if published_only:
        deck_count_stmt = deck_count_stmt.where(Deck.is_public.is_(True))
    deck_counts = dict((await db.execute(deck_count_stmt)).all())

    story_count_stmt = (
        select(Story.course_id, func.count(Story.id))
        .where(Story.course_id.in_(course_ids))
        .group_by(Story.course_id)
    )
    if published_only:
        story_count_stmt = story_count_stmt.where(Story.is_published.is_(True))
    story_counts = dict((await db.execute(story_count_stmt)).all())

    out: list[CourseRead] = []
    for c in courses:
        out.append(
            CourseRead(
                id=c.id,
                title=c.title,
                description=c.description,
                level=c.level,
                topic=c.topic,
                source_lang=c.source_lang,
                target_lang=c.target_lang,
                cover_color=c.cover_color,
                is_published=c.is_published,
                position=c.position,
                language_id=c.language_id,
                author_id=c.author_id,
                created_at=c.created_at,
                decks_count=int(deck_counts.get(c.id, 0)),
                stories_count=int(story_counts.get(c.id, 0)),
            )
        )
    return out


async def get_course(db: AsyncSession, course_id: int) -> Course | None:
    return (
        await db.execute(select(Course).where(Course.id == course_id))
    ).scalar_one_or_none()


async def get_course_detail(
    db: AsyncSession, course_id: int, *, published_only: bool = True
) -> CourseDetail | None:
    course = await get_course(db, course_id)
    if not course:
        return None
    if published_only and not course.is_published:
        return None

    decks_stmt = select(Deck).where(Deck.course_id == course_id).order_by(Deck.created_at.desc())
    if published_only:
        decks_stmt = decks_stmt.where(Deck.is_public.is_(True))
    decks = (await db.execute(decks_stmt)).scalars().all()

    counts: dict[int, int] = {}
    if decks:
        rows = (
            await db.execute(
                select(Card.deck_id, func.count(Card.id))
                .where(Card.deck_id.in_([d.id for d in decks]))
                .group_by(Card.deck_id)
            )
        ).all()
        counts = {row[0]: int(row[1]) for row in rows}

    deck_items: list[CourseDeckItem] = []
    for d in decks:
        item = CourseDeckItem.model_validate(d)
        item.cards_count = counts.get(d.id, 0)
        deck_items.append(item)

    stories_stmt = (
        select(Story)
        .where(Story.course_id == course_id)
        .order_by(Story.created_at.desc())
    )
    if published_only:
        stories_stmt = stories_stmt.where(Story.is_published.is_(True))
    stories = (await db.execute(stories_stmt)).scalars().all()
    story_items = [CourseStoryItem.model_validate(s) for s in stories]

    return CourseDetail(
        id=course.id,
        title=course.title,
        description=course.description,
        level=course.level,
        topic=course.topic,
        source_lang=course.source_lang,
        target_lang=course.target_lang,
        cover_color=course.cover_color,
        is_published=course.is_published,
        position=course.position,
        language_id=course.language_id,
        author_id=course.author_id,
        created_at=course.created_at,
        decks_count=len(deck_items),
        stories_count=len(story_items),
        decks=deck_items,
        stories=story_items,
    )


async def create_course(
    db: AsyncSession, author_id: int | None, data: CourseCreate
) -> Course:
    course = Course(**data.model_dump(), author_id=author_id)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def update_course(
    db: AsyncSession, course: Course, data: CourseUpdate
) -> Course:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    await db.commit()
    await db.refresh(course)
    return course


async def delete_course(db: AsyncSession, course: Course) -> None:
    await db.delete(course)
    await db.commit()
