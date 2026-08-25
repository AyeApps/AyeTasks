from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Mínimo 8 caracteres")
    name: str = Field(default="Usuario", min_length=2)
    timezone: Optional[str] = "America/Mexico_City"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PushTokenRequest(BaseModel):
    push_token: str


class PomodoroSettingsSchema(BaseModel):
    work_minutes: int = 25
    short_break_minutes: int = 5
    long_break_minutes: int = 15
    auto_start_breaks: bool = False
    auto_start_pomodoros: bool = False


class UserUpdateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=8)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    timezone: str
    pomodoro_settings: PomodoroSettingsSchema
    created_at: datetime
