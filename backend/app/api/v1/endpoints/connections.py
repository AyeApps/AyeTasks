from typing import List
from fastapi import APIRouter, status
from app.core.deps import CurrentUser
from app.models.base import get_link_id
from app.schemas.connection import ConnectionCreate, ConnectionResponse
from app.services.connection_service import ConnectionService

router = APIRouter()


@router.get("/", response_model=List[ConnectionResponse])
async def get_connections(current_user: CurrentUser):
    connections = await ConnectionService.get_connections(current_user)
    return [
        ConnectionResponse(
            id=str(c.id),
            from_task_id=str(get_link_id(c.from_task_id)),
            to_task_id=str(get_link_id(c.to_task_id)),
            type=c.type,
            label=c.label,
            created_at=c.created_at,
        )
        for c in connections
    ]


@router.post("/", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(data: ConnectionCreate, current_user: CurrentUser):
    c = await ConnectionService.create_connection(current_user, data)
    return ConnectionResponse(
        id=str(c.id),
        from_task_id=str(get_link_id(c.from_task_id)),
        to_task_id=str(get_link_id(c.to_task_id)),
        type=c.type,
        label=c.label,
        created_at=c.created_at,
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(id: str, current_user: CurrentUser):
    await ConnectionService.delete_connection(current_user, id)
    return None
