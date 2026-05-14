from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lesson import Lesson, UserLessonProgress
from app.schemas.lesson import (
    CourseProgress,
    LessonAttemptResult,
    LessonCreate,
    LessonStatus,
    LessonUpdate,
)


async def list_lessons(db: AsyncSession, course_id: int) -> list[Lesson]:
    return (
        (
            await db.execute(
                select(Lesson)
                .where(Lesson.course_id == course_id)
                .order_by(Lesson.position, Lesson.id)
            )
        )
        .scalars()
        .all()
    )


async def get_lesson(db: AsyncSession, lesson_id: int) -> Lesson | None:
    return (
        await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    ).scalar_one_or_none()


async def create_lesson(
    db: AsyncSession, course_id: int, data: LessonCreate
) -> Lesson:
    lesson = Lesson(course_id=course_id, **data.model_dump())
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def update_lesson(
    db: AsyncSession, lesson: Lesson, data: LessonUpdate
) -> Lesson:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def delete_lesson(db: AsyncSession, lesson: Lesson) -> None:
    await db.delete(lesson)
    await db.commit()


async def _progress_map(
    db: AsyncSession, user_id: int, lesson_ids: list[int]
) -> dict[int, UserLessonProgress]:
    if not lesson_ids:
        return {}
    rows = (
        await db.execute(
            select(UserLessonProgress).where(
                UserLessonProgress.user_id == user_id,
                UserLessonProgress.lesson_id.in_(lesson_ids),
            )
        )
    ).scalars().all()
    return {p.lesson_id: p for p in rows}


async def list_lessons_with_status(
    db: AsyncSession, course_id: int, user_id: int
) -> list[LessonStatus]:
    lessons = await list_lessons(db, course_id)
    progress = await _progress_map(db, user_id, [l.id for l in lessons])

    out: list[LessonStatus] = []
    can_unlock = True  # first lesson always unlocked
    for l in lessons:
        prog = progress.get(l.id)
        passed = bool(prog and prog.passed)
        best = int(prog.best_score) if prog else 0
        attempts = int(prog.attempts) if prog else 0
        last = prog.last_attempt_at if prog else None

        out.append(
            LessonStatus(
                id=l.id,
                course_id=l.course_id,
                title=l.title,
                position=l.position,
                passing_score=l.passing_score,
                deck_id=l.deck_id,
                story_id=l.story_id,
                locked=not can_unlock,
                passed=passed,
                best_score=best,
                attempts=attempts,
                last_attempt_at=last,
            )
        )
        # unlock next only if this lesson passed
        can_unlock = passed
    return out


async def course_progress(
    db: AsyncSession, course_id: int, user_id: int
) -> CourseProgress:
    statuses = await list_lessons_with_status(db, course_id, user_id)
    total = len(statuses)
    passed = sum(1 for s in statuses if s.passed)
    percent = int(round(passed * 100 / total)) if total else 0

    next_id: int | None = None
    for s in statuses:
        if not s.passed and not s.locked:
            next_id = s.id
            break

    return CourseProgress(
        total_lessons=total,
        passed_lessons=passed,
        percent=percent,
        next_lesson_id=next_id,
    )


async def record_attempt(
    db: AsyncSession, user_id: int, lesson: Lesson, score: int
) -> LessonAttemptResult:
    # check sequential unlock (all previous lessons in course must be passed)
    prev_lessons = (
        (
            await db.execute(
                select(Lesson)
                .where(
                    Lesson.course_id == lesson.course_id,
                    Lesson.position < lesson.position,
                )
                .order_by(Lesson.position)
            )
        )
        .scalars()
        .all()
    )
    if prev_lessons:
        prev_ids = [l.id for l in prev_lessons]
        prev_progress = await _progress_map(db, user_id, prev_ids)
        for pl in prev_lessons:
            p = prev_progress.get(pl.id)
            if not p or not p.passed:
                raise PermissionError("locked")

    # get or create progress row
    prog = (
        await db.execute(
            select(UserLessonProgress).where(
                UserLessonProgress.user_id == user_id,
                UserLessonProgress.lesson_id == lesson.id,
            )
        )
    ).scalar_one_or_none()

    if prog is None:
        prog = UserLessonProgress(
            user_id=user_id,
            lesson_id=lesson.id,
            best_score=0,
            attempts=0,
            passed=False,
        )
        db.add(prog)

    was_passed = prog.passed
    prog.attempts = (prog.attempts or 0) + 1
    if score > prog.best_score:
        prog.best_score = score
    if score >= lesson.passing_score:
        prog.passed = True
    prog.last_attempt_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(prog)

    just_passed = (not was_passed) and prog.passed

    next_id: int | None = None
    if just_passed:
        nxt = (
            await db.execute(
                select(Lesson)
                .where(
                    Lesson.course_id == lesson.course_id,
                    Lesson.position > lesson.position,
                )
                .order_by(Lesson.position)
                .limit(1)
            )
        ).scalar_one_or_none()
        if nxt is not None:
            next_id = nxt.id

    return LessonAttemptResult(
        lesson_id=lesson.id,
        best_score=int(prog.best_score),
        attempts=int(prog.attempts),
        passed=bool(prog.passed),
        just_passed=just_passed,
        next_lesson_id=next_id,
    )
