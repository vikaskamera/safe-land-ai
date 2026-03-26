from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=6, max_length=16)
    role: Optional[str] = "pilot"

class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=16)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: Optional[str] = None
    designation: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    designation: Optional[str] = Field(default="", max_length=80)
    organization: Optional[str] = Field(default="", max_length=120)
    phone: Optional[str] = Field(default="", max_length=32)
    location: Optional[str] = Field(default="", max_length=120)
    bio: Optional[str] = Field(default="", max_length=300)
