from fastapi import APIRouter, HTTPException, status

from app.core.deps import AdminUser, CurrentUser, DBSession
from app.schemas.lesson import (
    CourseProgress,
    LessonAttemptIn,
    LessonAttemptResult,
    LessonCreate,
    LessonRead,
    LessonStatus,
    LessonUpdate,
)
from app.services import course as course_service
from app.services import lesson as lesson_service

router = APIRouter()


@router.get("/courses/{course_id}/lessons", response_model=list[LessonStatus])
async def course_lessons(
    course_id: int, current: CurrentUser, db: DBSession
) -> list[LessonStatus]:
    course = await course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return await lesson_service.list_lessons_with_status(db, course_id, current.id)


@router.get("/courses/{course_id}/progress", response_model=CourseProgress)
async def course_progress(
    course_id: int, current: CurrentUser, db: DBSession
) -> CourseProgress:
    course = await course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return await lesson_service.course_progress(db, course_id, current.id)


@router.post(
    "/courses/{course_id}/lessons",
    response_model=LessonRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    course_id: int, data: LessonCreate, admin: AdminUser, db: DBSession
) -> LessonRead:
    course = await course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    lesson = await lesson_service.create_lesson(db, course_id, data)
    return LessonRead.model_validate(lesson)


@router.patch("/lessons/{lesson_id}", response_model=LessonRead)
async def update_lesson(
    lesson_id: int, data: LessonUpdate, admin: AdminUser, db: DBSession
) -> LessonRead:
    lesson = await lesson_service.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson = await lesson_service.update_lesson(db, lesson, data)
    return LessonRead.model_validate(lesson)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int, admin: AdminUser, db: DBSession
) -> None:
    lesson = await lesson_service.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await lesson_service.delete_lesson(db, lesson)


@router.post("/lessons/{lesson_id}/attempt", response_model=LessonAttemptResult)
async def attempt_lesson(
    lesson_id: int,
    data: LessonAttemptIn,
    current: CurrentUser,
    db: DBSession,
) -> LessonAttemptResult:
    lesson = await lesson_service.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    try:
        return await lesson_service.record_attempt(
            db, current.id, lesson, data.score
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Previous lesson must be passed first",
        )
