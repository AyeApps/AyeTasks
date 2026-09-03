from typing import List, Optional
from fastapi import APIRouter, Query, status
from app.core.deps import CurrentUser
from app.models.base import get_link_id
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    current_user: CurrentUser,
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
):
    tasks = await TaskService.get_tasks(current_user, date_from, date_to)
    return [
        TaskResponse(
            id=str(t.id),
            title=t.title,
            description=t.description,
            notes=t.notes,
            date=t.date,
            due_date=t.due_date,
            due_time=t.due_time,
            task_type=getattr(t, "task_type", "task") or "task",
            start_time=getattr(t, "start_time", None),
            end_time=getattr(t, "end_time", None),
            location=getattr(t, "location", None),
            estimated_duration_minutes=t.estimated_duration_minutes,
            actual_duration_seconds=t.actual_duration_seconds,
            status=t.status,
            priority=t.priority,
            color_tag=t.color_tag,
            position_index=t.position_index,
            parent_task_id=str(get_link_id(t.parent_task_id)) if t.parent_task_id else None,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in tasks
    ]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(data: TaskCreate, current_user: CurrentUser):
    t = await TaskService.create_task(current_user, data)
    return TaskResponse(
        id=str(t.id),
        title=t.title,
        description=t.description,
        notes=t.notes,
        date=t.date,
        due_date=t.due_date,
        due_time=t.due_time,
        task_type=getattr(t, "task_type", "task") or "task",
        start_time=getattr(t, "start_time", None),
        end_time=getattr(t, "end_time", None),
        location=getattr(t, "location", None),
        estimated_duration_minutes=t.estimated_duration_minutes,
        actual_duration_seconds=t.actual_duration_seconds,
        status=t.status,
        priority=t.priority,
        color_tag=t.color_tag,
        position_index=t.position_index,
        parent_task_id=str(get_link_id(t.parent_task_id)) if t.parent_task_id else None,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.patch("/{id}", response_model=TaskResponse)
async def update_task(id: str, data: TaskUpdate, current_user: CurrentUser):
    t = await TaskService.update_task(current_user, id, data)
    return TaskResponse(
        id=str(t.id),
        title=t.title,
        description=t.description,
        notes=t.notes,
        date=t.date,
        due_date=t.due_date,
        due_time=t.due_time,
        task_type=getattr(t, "task_type", "task") or "task",
        start_time=getattr(t, "start_time", None),
        end_time=getattr(t, "end_time", None),
        location=getattr(t, "location", None),
        estimated_duration_minutes=t.estimated_duration_minutes,
        actual_duration_seconds=t.actual_duration_seconds,
        status=t.status,
        priority=t.priority,
        color_tag=t.color_tag,
        position_index=t.position_index,
        parent_task_id=str(get_link_id(t.parent_task_id)) if t.parent_task_id else None,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(id: str, current_user: CurrentUser):
    await TaskService.delete_task(current_user, id)
    return None
