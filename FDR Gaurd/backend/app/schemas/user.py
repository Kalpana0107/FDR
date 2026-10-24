from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from ..models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.COLLEGE_USER


class UserCreate(UserBase):
    password: str
    institution_id: Optional[int] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    institution_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(UserOut):
    institution_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
