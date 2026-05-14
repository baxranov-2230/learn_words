from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.user import User
from app.schemas.user import UserMe, UserPublic, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserMe)
async def get_me(current: CurrentUser) -> UserMe:
    return UserMe.model_validate(current)


@router.patch("/me", response_model=UserMe)
async def update_me(data: UserUpdate, current: CurrentUser, db: DBSession) -> UserMe:
    if data.username and data.username != current.username:
        clash = (
            await db.execute(select(User).where(User.username == data.username))
        ).scalar_one_or_none()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username band"
            )
        current.username = data.username
    if data.avatar_url is not None:
        current.avatar_url = data.avatar_url
    if data.native_language is not None:
        current.native_language = data.native_language
    if data.learning_language is not None:
        current.learning_language = data.learning_language
    await db.commit()
    await db.refresh(current)
    return UserMe.model_validate(current)


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: int, db: DBSession) -> UserPublic:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserPublic.model_validate(user)
