from fastapi import APIRouter
from app.api.v1.endpoints import (
    connections,
    reminders,
    sync_ws,
    tasks,
    time_tracking,
)

api_router = APIRouter()
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(connections.router, prefix="/connections", tags=["Connections"])
api_router.include_router(time_tracking.router, prefix="/time", tags=["Time Tracking"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
api_router.include_router(sync_ws.router, prefix="/ws", tags=["WebSockets"])
