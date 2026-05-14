from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.language import Language
from app.schemas.language import LanguageCreate, LanguageRead, LanguageUpdate


def _to_read(lang: Language, course_count: int = 0) -> LanguageRead:
    return LanguageRead(
        id=lang.id,
        code=lang.code,
        name=lang.name,
        native_name=lang.native_name,
        flag=lang.flag,
        color=lang.color,
        position=lang.position,
        is_active=lang.is_active,
        created_at=lang.created_at,
        courses_count=course_count,
    )


async def list_languages(
    db: AsyncSession, *, active_only: bool = True
) -> list[LanguageRead]:
    stmt = select(Language).order_by(Language.position, Language.id)
    if active_only:
        stmt = stmt.where(Language.is_active.is_(True))
    langs = (await db.execute(stmt)).scalars().all()
    if not langs:
        return []
    rows = (
        await db.execute(
            select(Course.language_id, func.count(Course.id))
            .where(Course.language_id.in_([l.id for l in langs]))
            .group_by(Course.language_id)
        )
    ).all()
    counts = {row[0]: int(row[1]) for row in rows}
    return [_to_read(l, counts.get(l.id, 0)) for l in langs]


async def get_language(db: AsyncSession, lang_id: int) -> Language | None:
    return (
        await db.execute(select(Language).where(Language.id == lang_id))
    ).scalar_one_or_none()


async def create_language(
    db: AsyncSession, data: LanguageCreate
) -> LanguageRead:
    lang = Language(**data.model_dump())
    db.add(lang)
    await db.commit()
    await db.refresh(lang)
    return _to_read(lang, 0)


async def update_language(
    db: AsyncSession, lang: Language, data: LanguageUpdate
) -> LanguageRead:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lang, field, value)
    await db.commit()
    await db.refresh(lang)
    count = (
        await db.execute(
            select(func.count(Course.id)).where(Course.language_id == lang.id)
        )
    ).scalar_one()
    return _to_read(lang, int(count))


async def delete_language(db: AsyncSession, lang: Language) -> None:
    await db.delete(lang)
    await db.commit()
