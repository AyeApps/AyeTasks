from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict, ValidationInfo, model_validator
from pydantic.alias_generators import to_camel
from pydantic_core import PydanticCustomError
from app.models.task import TaskStatus, TaskPriority
from app.models.task_connection import ConnectionType


class ImportConnection(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, alias_generator=to_camel)
    
    from_ref: str = Field(alias="from")
    to_ref: str = Field(alias="to")
    type: ConnectionType = ConnectionType.FLOW
    label: Optional[str] = Field(default=None, max_length=100)


class ImportTask(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, alias_generator=to_camel)
    
    ref: Optional[str] = Field(default=None, min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=200)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    type: Literal["task", "event"] = "task"
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    description: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    due_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    location: Optional[str] = None
    estimated_minutes: int = Field(default=30, ge=1, le=500000)
    color: str = Field(default="#00c853", pattern=r"^#[0-9a-fA-F]{6}$")
    comments: Optional[List[str]] = None
    parent: Optional[str] = None

    @field_validator("title")
    @classmethod
    def val_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("El título no puede estar vacío")
        if len(stripped) > 200:
            raise ValueError("El título no puede tener más de 200 caracteres")
        return stripped

    @field_validator("date")
    @classmethod
    def val_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("La fecha debe ser una fecha real (YYYY-MM-DD)")
        return v

    @field_validator("due_date")
    @classmethod
    def val_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("dueDate debe ser una fecha real (YYYY-MM-DD)")
        return v

    @field_validator("due_time")
    @classmethod
    def val_due_time(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                datetime.strptime(v, "%H:%M")
            except ValueError:
                raise ValueError("dueTime debe ser una hora válida (HH:MM)")
        return v

    @field_validator("start_time")
    @classmethod
    def val_start_time(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                datetime.strptime(v, "%H:%M")
            except ValueError:
                raise ValueError("startTime debe ser una hora válida (HH:MM)")
        return v

    @field_validator("end_time")
    @classmethod
    def val_end_time(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                datetime.strptime(v, "%H:%M")
            except ValueError:
                raise ValueError("endTime debe ser una hora válida (HH:MM)")
        return v

    @field_validator("comments")
    @classmethod
    def val_comments(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v:
            if any(not c.strip() for c in v):
                raise ValueError("Los comentarios no pueden estar vacíos")
        return v

    @model_validator(mode="after")
    def validate_cross_fields(self) -> "ImportTask":
        if self.due_time and not self.due_date:
            raise PydanticCustomError("cross_field", "dueTime requiere dueDate", {"field": "dueTime"})
            
        if self.start_time and self.end_time:
            dt_start = datetime.strptime(self.start_time, "%H:%M")
            dt_end = datetime.strptime(self.end_time, "%H:%M")
            if dt_end <= dt_start:
                raise PydanticCustomError(
                    "cross_field", "endTime debe ser mayor que startTime", {"field": "endTime"}
                )
                
        return self


class ImportRoot(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, alias_generator=to_camel)
    
    format: Literal["ayetasks.import"]
    version: Literal[1]
    source: str = Field(default="manual", max_length=64)
    tasks: List[ImportTask] = Field(min_length=1, max_length=100)
    connections: List[ImportConnection] = Field(default_factory=list, max_length=200)
