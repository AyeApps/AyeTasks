from datetime import datetime
from beanie import Document
from pydantic import Field


class RevokedToken(Document):
    jti: str = Field(unique=True, index=True)
    user_id: str
    revoked_at: datetime
    expires_at: datetime = Field(index=True)

    class Settings:
        name = "revoked_tokens"
