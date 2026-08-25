from datetime import datetime
from enum import Enum
from beanie import Link
from pydantic import Field
from app.models.base import SoftDeleteDocument
from app.models.user import User
from app.models.task import Task


class ReminderStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DISMISSED = "dismissed"


class Reminder(SoftDeleteDocument):
    user_id: Link[User] = Field(index=True)
    task_id: Link[Task] = Field(index=True)
    trigger_at: datetime = Field(index=True)
    minutes_before: int = 0
    status: ReminderStatus = ReminderStatus.PENDING

    class Settings:
        name = "reminders"
