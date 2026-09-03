from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.task import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    notes: Optional[str] = None
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$", description="Formato YYYY-MM-DD")
    due_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Fecha de entrega YYYY-MM-DD")
    due_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$", description="Formato HH:MM")
    task_type: Optional[str] = "task"
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$", description="Formato HH:MM")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$", description="Formato HH:MM")
    location: Optional[str] = None
    estimated_duration_minutes: int = Field(default=30, ge=1, le=500000)
    priority: TaskPriority = TaskPriority.MEDIUM
    color_tag: str = "#00c853"
    position_index: int = 0
    parent_task_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    due_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    due_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    task_type: Optional[str] = None
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    location: Optional[str] = None
    estimated_duration_minutes: Optional[int] = Field(default=None, ge=1, le=500000)
    actual_duration_seconds: Optional[int] = Field(default=None, ge=0)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    color_tag: Optional[str] = None
    position_index: Optional[int] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    notes: Optional[str] = None
    date: str
    due_date: Optional[str] = None
    due_time: Optional[str]
    task_type: Optional[str] = "task"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    estimated_duration_minutes: int
    actual_duration_seconds: int
    status: TaskStatus
    priority: TaskPriority
    color_tag: str
    position_index: int
    parent_task_id: Optional[str]
    created_at: datetime
    updated_at: datetime
