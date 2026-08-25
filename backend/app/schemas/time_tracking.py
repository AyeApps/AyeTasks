from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.time_entry import TimerMode


class StartTimerRequest(BaseModel):
    task_id: str
    mode: TimerMode = TimerMode.STOPWATCH


class StopTimerRequest(BaseModel):
    task_id: Optional[str] = None
    notes: Optional[str] = None


class TimeEntryResponse(BaseModel):
    id: str
    task_id: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: int
    mode: TimerMode
    notes: Optional[str]
    is_active: bool
