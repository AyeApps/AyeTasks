from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.task_connection import ConnectionType


class ConnectionCreate(BaseModel):
    from_task_id: str
    to_task_id: str
    type: ConnectionType = ConnectionType.FLOW
    label: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: str
    from_task_id: str
    to_task_id: str
    type: ConnectionType
    label: Optional[str]
    created_at: datetime
