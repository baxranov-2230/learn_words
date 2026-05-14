from fastapi import APIRouter, HTTPException, status

from app.core.deps import AdminUser, DBSession
from app.schemas.language import LanguageCreate, LanguageRead, LanguageUpdate
from app.services import language as language_service

router = APIRouter()


@router.get("", response_model=list[LanguageRead])
async def list_languages(
    db: DBSession, all: bool = False
) -> list[LanguageRead]:
    return await language_service.list_languages(db, active_only=not all)


@router.post("", response_model=LanguageRead, status_code=status.HTTP_201_CREATED)
async def create_language(
    data: LanguageCreate, admin: AdminUser, db: DBSession
) -> LanguageRead:
    return await language_service.create_language(db, data)


@router.patch("/{lang_id}", response_model=LanguageRead)
async def update_language(
    lang_id: int, data: LanguageUpdate, admin: AdminUser, db: DBSession
) -> LanguageRead:
    lang = await language_service.get_language(db, lang_id)
    if not lang:
        raise HTTPException(status_code=404, detail="Language not found")
    return await language_service.update_language(db, lang, data)


@router.delete("/{lang_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_language(
    lang_id: int, admin: AdminUser, db: DBSession
) -> None:
    lang = await language_service.get_language(db, lang_id)
    if not lang:
        raise HTTPException(status_code=404, detail="Language not found")
    await language_service.delete_language(db, lang)
