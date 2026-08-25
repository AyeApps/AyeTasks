from enum import Enum
from typing import Optional
from beanie import Link
from pydantic import Field
from app.models.base import SoftDeleteDocument
from app.models.user import User
from app.models.task import Task


class ConnectionType(str, Enum):
    DEPENDENCY = "dependency"
    FLOW = "flow"
    RELATED = "related"


class TaskConnection(SoftDeleteDocument):
    user_id: Link[User] = Field(index=True)
    from_task_id: Link[Task] = Field(index=True)
    to_task_id: Link[Task] = Field(index=True)
    type: ConnectionType = ConnectionType.FLOW
    label: Optional[str] = None

    class Settings:
        name = "task_connections"
