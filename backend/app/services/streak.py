from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_streak import UserStreak


async def touch_streak(db: AsyncSession, user_id: int, today: date | None = None) -> UserStreak:
    today = today or datetime.now(UTC).date()
    streak = (
        await db.execute(select(UserStreak).where(UserStreak.user_id == user_id))
    ).scalar_one_or_none()
    if not streak:
        streak = UserStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_activity_date=today,
        )
        db.add(streak)
        return streak

    last = streak.last_activity_date
    if last == today:
        return streak  # already counted today
    if last == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_activity_date = today
    return streak
