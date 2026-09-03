from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.models.base import get_link_id, is_same_id
from app.models.task import Task
from app.models.task_connection import TaskConnection
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.ws_manager import ws_manager


class TaskService:
    @staticmethod
    async def get_tasks(
        user: User,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[Task]:
        query = Task.find(
            Task.user_id.id == user.id,
            Task.deleted_at == None,
        )
        if date_from and date_to:
            query = query.find(Task.date >= date_from, Task.date <= date_to)
        elif date_from:
            query = query.find(Task.date >= date_from)

        tasks = await query.sort(+Task.position_index).to_list()
        return tasks

    @staticmethod
    async def create_task(user: User, data: TaskCreate) -> Task:
        parent_link = None
        if data.parent_task_id:
            try:
                parent = await Task.get(data.parent_task_id)
                if parent and is_same_id(parent.user_id, user.id) and parent.deleted_at is None:
                    parent_link = parent
            except Exception:
                parent_link = None

        task = Task(
            user_id=user,
            title=data.title,
            description=data.description,
            notes=data.notes,
            date=data.date,
            due_date=data.due_date,
            due_time=data.due_time,
            task_type=data.task_type or "task",
            start_time=data.start_time,
            end_time=data.end_time,
            location=data.location,
            estimated_duration_minutes=data.estimated_duration_minutes,
            priority=data.priority,
            color_tag=data.color_tag,
            position_index=data.position_index,
            parent_task_id=parent_link,
        )
        await task.save()

        # If it was created linked to a parent, automatically create the TaskConnection
        if parent_link:
            connection = TaskConnection(
                user_id=user,
                from_task_id=parent_link,
                to_task_id=task,
            )
            await connection.save()
            await ws_manager.broadcast_to_user(
                str(user.id),
                {
                    "event": "CONNECTION_CREATED",
                    "data": {
                        "id": str(connection.id),
                        "from_task_id": str(parent_link.id),
                        "to_task_id": str(task.id),
                        "type": connection.type,
                    },
                },
            )

        # Broadcast event
        await ws_manager.broadcast_to_user(
            str(user.id),
            {"event": "TASK_CREATED", "data": {"id": str(task.id), "title": task.title, "date": task.date, "due_date": task.due_date}},
        )

        return task

    @staticmethod
    async def update_task(user: User, task_id: str, data: TaskUpdate) -> Task:
        try:
            task = await Task.get(task_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

        if not task or task.deleted_at is not None or not is_same_id(task.user_id, user.id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(task, key, val)

        task.updated_at = datetime.now(timezone.utc)
        await task.save()

        await ws_manager.broadcast_to_user(
            str(user.id),
            {"event": "TASK_UPDATED", "data": {"id": str(task.id), "status": task.status}},
        )
        return task

    @staticmethod
    async def delete_task(user: User, task_id: str):
        try:
            task = await Task.get(task_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

        if not task or task.deleted_at is not None or not is_same_id(task.user_id, user.id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

        # Execute soft delete on task
        await task.soft_delete()

        # Also soft delete related connections
        connections = await TaskConnection.find(
            TaskConnection.user_id.id == user.id,
            TaskConnection.deleted_at == None,
        ).to_list()

        for conn in connections:
            from_id = str(get_link_id(conn.from_task_id))
            to_id = str(get_link_id(conn.to_task_id))
            if from_id == task_id or to_id == task_id:
                await conn.soft_delete()

        await ws_manager.broadcast_to_user(
            str(user.id),
            {"event": "TASK_DELETED", "data": {"id": task_id}},
        )
