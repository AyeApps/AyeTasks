import pytest
from httpx import AsyncClient, ASGITransport
from app.core.config import settings
from app.db.mongodb import init_db, close_db
from main import app


@pytest.fixture
async def client():
    await init_db()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    await close_db()
