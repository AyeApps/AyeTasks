from enum import Enum
from typing import Optional
from beanie import Link
from pydantic import Field
from app.models.base import SoftDeleteDocument
from app.models.user import User


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(SoftDeleteDocument):
    user_id: Link[User] = Field(index=True)
    title: str
    description: Optional[str] = None
    notes: Optional[str] = None  # Deep notes / scratchpad content
    date: str = Field(index=True)  # YYYY-MM-DD (scheduled board date)
    due_date: Optional[str] = Field(default=None, index=True)  # YYYY-MM-DD (optional delivery deadline date)
    due_time: Optional[str] = None  # HH:MM (ej. 16:30)
    estimated_duration_minutes: int = 30
    actual_duration_seconds: int = 0
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    color_tag: str = "#00c853"
    position_index: int = 0
    parent_task_id: Optional[Link["Task"]] = None

    class Settings:
        name = "tasks"
