from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None
    native_language: str | None = None
    learning_language: str | None = None


class UserMe(UserPublic):
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    username: str | None = None
    avatar_url: str | None = None
    native_language: str | None = None
    learning_language: str | None = None
