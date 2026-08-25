from typing import Optional
from fastapi import APIRouter, status
from app.core.deps import CurrentUser
from app.models.base import get_link_id
from app.schemas.time_tracking import (
    StartTimerRequest,
    StopTimerRequest,
    TimeEntryResponse,
)
from app.services.timer_service import TimerService

router = APIRouter()


@router.get("/active", response_model=Optional[TimeEntryResponse])
async def get_active_timer(current_user: CurrentUser):
    active = await TimerService.get_active_timer(current_user)
    if not active:
        return None
    return TimeEntryResponse(
        id=str(active.id),
        task_id=str(get_link_id(active.task_id)),
        start_time=active.start_time,
        end_time=active.end_time,
        duration_seconds=active.duration_seconds,
        mode=active.mode,
        notes=active.notes,
        is_active=active.is_active,
    )


@router.post("/start", response_model=TimeEntryResponse)
async def start_timer(data: StartTimerRequest, current_user: CurrentUser):
    entry = await TimerService.start_timer(current_user, data)
    return TimeEntryResponse(
        id=str(entry.id),
        task_id=str(get_link_id(entry.task_id)),
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_seconds=entry.duration_seconds,
        mode=entry.mode,
        notes=entry.notes,
        is_active=entry.is_active,
    )


@router.post("/stop", response_model=TimeEntryResponse)
async def stop_timer(data: StopTimerRequest, current_user: CurrentUser):
    entry = await TimerService.stop_timer(current_user, data)
    return TimeEntryResponse(
        id=str(entry.id),
        task_id=str(get_link_id(entry.task_id)),
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_seconds=entry.duration_seconds,
        mode=entry.mode,
        notes=entry.notes,
        is_active=entry.is_active,
    )
