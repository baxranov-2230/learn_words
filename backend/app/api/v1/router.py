from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    cards,
    courses,
    decks,
    games,
    languages,
    lessons,
    progress,
    stories,
    users,
    upload,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(languages.router, prefix="/languages", tags=["languages"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(lessons.router, tags=["lessons"])
api_router.include_router(decks.router, prefix="/decks", tags=["decks"])
api_router.include_router(cards.router, tags=["cards"])
api_router.include_router(games.router, prefix="/games", tags=["games"])
api_router.include_router(stories.router, prefix="/stories", tags=["stories"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(upload.router, tags=["upload"])
