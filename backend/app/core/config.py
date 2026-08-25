import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AyeTasks"
    APP_ENV: str = "development"
    PORT: int = 8000
    MONGODB_URL: str = "mongodb://localhost:27017/ayetasks"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: Union[List[str], str] = ["*"]
    EXPO_ACCESS_TOKEN: str = ""
    GOOGLE_CLIENT_IDS: List[str] = [
        "627799707976-gt9uudejrtd5d4b7pubkso0ev35j2rhr.apps.googleusercontent.com",
        "627799707976-dmm76mhsvc1b7d7jcrf2hpfjbtnpb6te.apps.googleusercontent.com",
        "627799707976-ek7dcu7lgfuj06us18cu5gnfuf6n3qqt.apps.googleusercontent.com",
    ]
    APPLE_CLIENT_IDS: List[str] = [
        "com.ayeapps.ayetasks",
        "com.ayeapps.ayetasks.auth",
        "com.ayeapps.ayetasks.service",
    ]
    APPLE_BUNDLE_ID: str = "com.ayeapps.ayetasks"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        return v


settings = Settings()
