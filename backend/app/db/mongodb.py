import base64
import os
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
    cert_path = settings.MONGODB_CERT_PATH
    if settings.MONGODB_CERT_B64 and settings.MONGODB_CERT_B64.strip():
        temp_cert = "/tmp/aye_tasks_cert.pem"
        try:
            cert_bytes = base64.b64decode(settings.MONGODB_CERT_B64.strip())
            with open(temp_cert, "wb") as f:
                f.write(cert_bytes)
            cert_path = temp_cert
            logger.info("Decoded X.509 certificate from MONGODB_CERT_B64 successfully.")
        except Exception as e:
            logger.error(f"Error decoding MONGODB_CERT_B64: {e}")

    client_kwargs = {
        "serverSelectionTimeoutMS": 5000,
    }

    if cert_path and os.path.exists(cert_path):
        client_kwargs["tls"] = True
        client_kwargs["tlsCertificateKeyFile"] = cert_path
        client_kwargs["authMechanism"] = "MONGODB-X509"
        logger.info(f"Connecting to MongoDB with X.509 Certificate ({cert_path})...")
    else:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL.split('@')[-1]}...")

    client = AsyncIOMotorClient(settings.MONGODB_URL, **client_kwargs)
    try:
        database = client[settings.DATABASE_NAME]
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
