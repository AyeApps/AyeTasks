from typing import List
from fastapi import APIRouter, HTTPException, status
from app.core.deps import CurrentUser
from app.models.base import get_link_id, is_same_id
from app.models.reminder import Reminder
from app.models.task import Task
from app.schemas.reminder import ReminderCreate, ReminderResponse

router = APIRouter()


@router.get("/task/{task_id}", response_model=List[ReminderResponse])
async def get_task_reminders(task_id: str, current_user: CurrentUser):
    try:
        task = await Task.get(task_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

    if not task or task.deleted_at is not None or not is_same_id(task.user_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

    reminders = await Reminder.find(
        Reminder.user_id.id == current_user.id,
        Reminder.task_id.id == task.id,
        Reminder.deleted_at == None,
    ).to_list()

    return [
        ReminderResponse(
            id=str(r.id),
            task_id=str(get_link_id(r.task_id)),
            trigger_at=r.trigger_at,
            minutes_before=r.minutes_before,
            status=r.status,
            created_at=r.created_at,
        )
        for r in reminders
    ]


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(data: ReminderCreate, current_user: CurrentUser):
    try:
        task = await Task.get(data.task_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

    if not task or task.deleted_at is not None or not is_same_id(task.user_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

    reminder = Reminder(
        user_id=current_user,
        task_id=task,
        trigger_at=data.trigger_at,
        minutes_before=data.minutes_before,
    )
    await reminder.save()
    return ReminderResponse(
        id=str(reminder.id),
        task_id=str(get_link_id(reminder.task_id)),
        trigger_at=reminder.trigger_at,
        minutes_before=reminder.minutes_before,
        status=reminder.status,
        created_at=reminder.created_at,
    )
