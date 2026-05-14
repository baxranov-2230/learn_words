from fastapi import APIRouter, HTTPException, Request, status

from app.core.deps import DBSession
from app.core.rate_limit import limiter
from app.core.security import create_access_token
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.schemas.user import UserMe
from app.services import auth as auth_service
from app.services.email import send_password_reset_email

router = APIRouter()


@router.post("/register", response_model=UserMe, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, data: RegisterRequest, db: DBSession) -> UserMe:
    try:
        user = await auth_service.register_user(db, data)
    except auth_service.EmailAlreadyExists as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except auth_service.UsernameAlreadyExists as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return UserMe.model_validate(user)


@router.post("/login", response_model=TokenPair)
@limiter.limit("20/minute")
async def login(request: Request, data: LoginRequest, db: DBSession) -> TokenPair:
    try:
        user = await auth_service.authenticate(db, data.email, data.password)
    except auth_service.InvalidCredentials as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc
    return auth_service.issue_token_pair(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, db: DBSession) -> TokenPair:
    try:
        return await auth_service.refresh_tokens(db, data.refresh_token)
    except auth_service.InvalidRefreshToken as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc


@router.post("/logout", response_model=MessageResponse)
async def logout() -> MessageResponse:
    # Stateless JWT — clientda tokenlarni o'chirish kifoya. Keyingi versiyada
    # refresh tokenlar uchun denylist (Redis) qo'shilishi mumkin.
    return MessageResponse(message="Logged out")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: DBSession
) -> MessageResponse:
    # Email mavjudligini oshkor qilmaymiz.
    from sqlalchemy import select

    from app.models.user import User

    user = (
        await db.execute(select(User).where(User.email == data.email))
    ).scalar_one_or_none()
    if user:
        token = create_access_token(user.id)  # qisqa muddatli reset token
        await send_password_reset_email(user.email, token)
    return MessageResponse(message="Agar email mavjud bo'lsa, ko'rsatma yuborildi")
