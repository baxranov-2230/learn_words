from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LanguageBase(BaseModel):
    code: str = Field(min_length=2, max_length=10)
    name: str = Field(min_length=1, max_length=100)
    native_name: str | None = None
    flag: str | None = None
    color: str | None = None
    position: int = 0
    is_active: bool = True


class LanguageCreate(LanguageBase):
    pass


class LanguageUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    native_name: str | None = None
    flag: str | None = None
    color: str | None = None
    position: int | None = None
    is_active: bool | None = None


class LanguageRead(LanguageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    courses_count: int = 0
