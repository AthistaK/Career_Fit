import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    college: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    avatar_url: Optional[str] = None


class UserProfileResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime.datetime
    current_xp: int = 0
    level: int = 1
    level_title: str = "Career Explorer"

    class Config:
        from_attributes = True
