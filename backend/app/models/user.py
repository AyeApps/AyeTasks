from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.base import SoftDeleteDocument


class PomodoroSettings(BaseModel):
    work_minutes: int = 25
    short_break_minutes: int = 5
    long_break_minutes: int = 15
    auto_start_breaks: bool = False
    auto_start_pomodoros: bool = False


class User(SoftDeleteDocument):
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: Optional[str] = None
    name: str = "Usuario"
    auth_provider: str = Field(default="local", index=True)
    provider_id: Optional[str] = Field(default=None, index=True)
    timezone: str = "America/Mexico_City"
    push_tokens: List[str] = Field(default_factory=list)
    pomodoro_settings: PomodoroSettings = Field(default_factory=PomodoroSettings)
    is_active: bool = True
    is_verified: bool = False
    login_attempts: int = 0
    locked_until: Optional[datetime] = None

    def is_locked(self) -> bool:
        if self.locked_until and self.locked_until > datetime.now(timezone.utc):
            return True
        return False

    class Settings:
        name = "users"
