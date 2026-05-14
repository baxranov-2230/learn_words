from fastapi import APIRouter, HTTPException, status

from app.core.deps import AdminUser, DBSession
from app.schemas.course import (
    CourseCreate,
    CourseDetail,
    CourseRead,
    CourseUpdate,
)
from app.services import course as course_service

router = APIRouter()


@router.get("", response_model=list[CourseRead])
async def list_courses(
    db: DBSession,
    level: str | None = None,
    topic: str | None = None,
    language_id: int | None = None,
) -> list[CourseRead]:
    return await course_service.list_courses(
        db,
        level=level,
        topic=topic,
        language_id=language_id,
        published_only=True,
    )


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(course_id: int, db: DBSession) -> CourseDetail:
    detail = await course_service.get_course_detail(db, course_id, published_only=True)
    if not detail:
        raise HTTPException(status_code=404, detail="Course not found")
    return detail


@router.get("/{course_id}/manage", response_model=CourseDetail)
async def manage_course(
    course_id: int, admin: AdminUser, db: DBSession
) -> CourseDetail:
    detail = await course_service.get_course_detail(db, course_id, published_only=False)
    if not detail:
        raise HTTPException(status_code=404, detail="Course not found")
    return detail


def _to_read(course) -> CourseRead:
    return CourseRead(
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
        decks_count=0,
        stories_count=0,
    )


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate, admin: AdminUser, db: DBSession
) -> CourseRead:
    course = await course_service.create_course(db, admin.id, data)
    return _to_read(course)


@router.patch("/{course_id}", response_model=CourseRead)
async def update_course(
    course_id: int, data: CourseUpdate, admin: AdminUser, db: DBSession
) -> CourseRead:
    course = await course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course = await course_service.update_course(db, course, data)
    return _to_read(course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: int, admin: AdminUser, db: DBSession) -> None:
    course = await course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await course_service.delete_course(db, course)
