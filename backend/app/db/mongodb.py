from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.logging import logger
from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.models.task import Task
from app.models.task_connection import TaskConnection
from app.models.time_entry import TimeEntry
from app.models.reminder import Reminder

client: AsyncIOMotorClient = None


async def init_db():
    global client
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    try:
        database = client.get_default_database()
    except Exception:
        database = client["ayetasks"]

    await init_beanie(
        database=database,
        document_models=[
            User,
            RevokedToken,
            Task,
            TaskConnection,
            TimeEntry,
            Reminder,
        ],
    )
    logger.info("Beanie ODM initialized successfully with all collections.")


async def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")
