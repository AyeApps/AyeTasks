from typing import List
from fastapi import HTTPException, status
from app.models.base import get_link_id, is_same_id
from app.models.task import Task
from app.models.task_connection import TaskConnection
from app.models.user import User
from app.schemas.connection import ConnectionCreate
from app.services.ws_manager import ws_manager


class ConnectionService:
    @staticmethod
    async def get_connections(user: User) -> List[TaskConnection]:
        return await TaskConnection.find(
            TaskConnection.user_id.id == user.id,
            TaskConnection.deleted_at == None,
        ).to_list()

    @staticmethod
    async def create_connection(user: User, data: ConnectionCreate) -> TaskConnection:
        try:
            from_task = await Task.get(data.from_task_id)
            to_task = await Task.get(data.to_task_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tareas no encontradas")

        if not from_task or not is_same_id(from_task.user_id, user.id) or from_task.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea de origen no encontrada")
        if not to_task or not is_same_id(to_task.user_id, user.id) or to_task.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea de destino no encontrada")

        # Avoid duplicate active connections
        existing = await TaskConnection.find_one(
            TaskConnection.user_id.id == user.id,
            TaskConnection.from_task_id.id == from_task.id,
            TaskConnection.to_task_id.id == to_task.id,
            TaskConnection.deleted_at == None,
        )
        if existing:
            return existing

        connection = TaskConnection(
            user_id=user,
            from_task_id=from_task,
            to_task_id=to_task,
            type=data.type,
            label=data.label,
        )
        await connection.save()

        await ws_manager.broadcast_to_user(
            str(user.id),
            {
                "event": "CONNECTION_CREATED",
                "data": {
                    "id": str(connection.id),
                    "from_task_id": str(from_task.id),
                    "to_task_id": str(to_task.id),
                    "type": connection.type,
                },
            },
        )
        return connection

    @staticmethod
    async def delete_connection(user: User, connection_id: str):
        try:
            conn = await TaskConnection.get(connection_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conexión no encontrada")

        if not conn or not is_same_id(conn.user_id, user.id) or conn.deleted_at is not None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conexión no encontrada")

        await conn.soft_delete()
        await ws_manager.broadcast_to_user(
            str(user.id),
            {"event": "CONNECTION_DELETED", "data": {"id": connection_id}},
        )
