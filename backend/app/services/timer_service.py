from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.base import get_link_id, is_same_id
from app.models.task import Task, TaskStatus
from app.models.time_entry import TimeEntry, TimerMode
from app.models.user import User
from app.schemas.time_tracking import StartTimerRequest, StopTimerRequest
from app.services.ws_manager import ws_manager


class TimerService:
    @staticmethod
    async def get_active_timer(user: User, task_id: Optional[str] = None) -> Optional[TimeEntry]:
        if task_id:
            try:
                task = await Task.get(task_id)
                if task:
                    return await TimeEntry.find_one(
                        TimeEntry.user_id.id == user.id,
                        TimeEntry.task_id.id == task.id,
                        TimeEntry.is_active == True,
                        TimeEntry.deleted_at == None,
                    )
            except Exception:
                pass

        return await TimeEntry.find_one(
            TimeEntry.user_id.id == user.id,
            TimeEntry.is_active == True,
            TimeEntry.deleted_at == None,
        )

    @staticmethod
    async def get_all_active_timers(user: User) -> List[TimeEntry]:
        return await TimeEntry.find(
            TimeEntry.user_id.id == user.id,
            TimeEntry.is_active == True,
            TimeEntry.deleted_at == None,
        ).to_list()

    @staticmethod
    async def start_timer(user: User, data: StartTimerRequest) -> TimeEntry:
        try:
            task = await Task.get(data.task_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

        if not task or not is_same_id(task.user_id, user.id) or task.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")

        # Check if timer is already active on this specific task
        existing = await TimeEntry.find_one(
            TimeEntry.user_id.id == user.id,
            TimeEntry.task_id.id == task.id,
            TimeEntry.is_active == True,
            TimeEntry.deleted_at == None,
        )
        if existing:
            return existing

        entry = TimeEntry(
            user_id=user,
            task_id=task,
            start_time=datetime.now(timezone.utc),
            mode=data.mode,
            is_active=True,
        )
        await entry.save()

        # Update task status to in_progress if it was todo
        if task.status == TaskStatus.TODO:
            task.status = TaskStatus.IN_PROGRESS
            await task.save()

        await ws_manager.broadcast_to_user(
            str(user.id),
            {
                "event": "TIMER_STARTED",
                "data": {
                    "entry_id": str(entry.id),
                    "task_id": str(get_link_id(entry.task_id)),
                    "start_time": entry.start_time.isoformat(),
                    "mode": entry.mode,
                },
            },
        )
        return entry

    @staticmethod
    async def stop_timer(user: User, data: StopTimerRequest) -> TimeEntry:
        active = await TimerService.get_active_timer(user, data.task_id)
        if not active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay temporizador activo")

        now = datetime.now(timezone.utc)
        start = active.start_time
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)

        duration = int((now - start).total_seconds())

        active.end_time = now
        active.duration_seconds = max(0, duration)
        active.is_active = False
        active.notes = data.notes
        active.updated_at = now
        await active.save()

        # Accumulate elapsed seconds on task in database
        try:
            task_id = str(get_link_id(active.task_id))
            task = await Task.get(task_id)
            if task:
                task.actual_duration_seconds += active.duration_seconds
                task.updated_at = now
                await task.save()
        except Exception as e:
            print("Error accumulating seconds on task:", e)

        await ws_manager.broadcast_to_user(
            str(user.id),
            {
                "event": "TIMER_STOPPED",
                "data": {
                    "entry_id": str(active.id),
                    "task_id": str(get_link_id(active.task_id)),
                    "duration_seconds": active.duration_seconds,
                },
            },
        )
        return active
