from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from beanie import Link
from pydantic import Field
from app.models.base import SoftDeleteDocument
from app.models.user import User
from app.models.task import Task


class TimerMode(str, Enum):
    STOPWATCH = "stopwatch"
    POMODORO = "pomodoro"


class TimeEntry(SoftDeleteDocument):
    user_id: Link[User] = Field(index=True)
    task_id: Link[Task] = Field(index=True)
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_seconds: int = 0
    mode: TimerMode = TimerMode.STOPWATCH
    notes: Optional[str] = None
    is_active: bool = True

    class Settings:
        name = "time_entries"
