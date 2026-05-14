from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.user_streak import UserStreak
from app.schemas.auth import RegisterRequest, TokenPair


class AuthError(Exception):
    pass


class EmailAlreadyExists(AuthError):
    pass


class UsernameAlreadyExists(AuthError):
    pass


class InvalidCredentials(AuthError):
    pass


class InvalidRefreshToken(AuthError):
    pass


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    existing_email = (
        await db.execute(select(User).where(User.email == data.email))
    ).scalar_one_or_none()
    if existing_email:
        raise EmailAlreadyExists("Bu email allaqachon ro'yxatdan o'tgan")

    existing_username = (
        await db.execute(select(User).where(User.username == data.username))
    ).scalar_one_or_none()
    if existing_username:
        raise UsernameAlreadyExists("Bu username band")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        native_language=data.native_language,
        learning_language=data.learning_language,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise EmailAlreadyExists("Yaratishda xatolik (unique constraint)") from exc

    db.add(UserStreak(user_id=user.id))
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentials("Email yoki parol noto'g'ri")
    if not user.is_active:
        raise InvalidCredentials("Foydalanuvchi bloklangan")
    return user


def issue_token_pair(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenPair:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except ValueError as exc:
        raise InvalidRefreshToken(str(exc)) from exc

    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError) as exc:
        raise InvalidRefreshToken("Invalid sub") from exc

    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if not user or not user.is_active:
        raise InvalidRefreshToken("User not found or inactive")
    return issue_token_pair(user)
