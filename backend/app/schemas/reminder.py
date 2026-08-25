from datetime import datetime
from pydantic import BaseModel
from app.models.reminder import ReminderStatus


class ReminderCreate(BaseModel):
    task_id: str
    trigger_at: datetime
    minutes_before: int = 0


class ReminderResponse(BaseModel):
    id: str
    task_id: str
    trigger_at: datetime
    minutes_before: int
    status: ReminderStatus
    created_at: datetime
