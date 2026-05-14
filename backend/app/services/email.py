import logging

from app.core.config import settings

logger = logging.getLogger("email")


async def send_email(to: str, subject: str, body: str) -> None:
    """Email yuborish — hozir stub: log ga yozadi."""
    if settings.EMAIL_BACKEND == "log":
        logger.info("[EMAIL STUB] to=%s subject=%s\n%s", to, subject, body)
        return
    # Real SMTP ulanishi keyingi versiyada qo'shiladi.
    logger.warning("Real SMTP backend not implemented; falling back to log: %s", to)


async def send_password_reset_email(to: str, reset_token: str) -> None:
    body = (
        f"Salom!\n\n"
        f"Parolingizni tiklash uchun quyidagi tokenni ishlating:\n\n{reset_token}\n\n"
        f"Agar siz so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring."
    )
    await send_email(to, "Parolni tiklash — Learn Words", body)
