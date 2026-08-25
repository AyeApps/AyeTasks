from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserUpdateProfile


class AuthService:
    @staticmethod
    async def update_profile(user: User, data: UserUpdateProfile) -> User:
        if data.name is not None and data.name.strip():
            user.name = data.name.strip()
        if data.email and data.email.lower() != user.email:
            existing = await User.find_one(User.email == data.email.lower())
            if existing and str(existing.id) != str(user.id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El correo electrónico ya está registrado por otra cuenta",
                )
            user.email = data.email.lower()
        if data.new_password:
            if not data.current_password or not verify_password(data.current_password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña actual es incorrecta",
                )
            user.hashed_password = hash_password(data.new_password)
        user.updated_at = datetime.now(timezone.utc)
        await user.save()
        return user
    @staticmethod
    async def register(data: UserRegister) -> User:
        existing = await User.find_one(User.email == data.email.lower())
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado",
            )

        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            name=data.name,
            timezone=data.timezone or "America/Mexico_City",
        )
        await user.save()
        return user

    @staticmethod
    async def authenticate(data: UserLogin) -> TokenResponse:
        user = await User.find_one(User.email == data.email.lower())
        if not user or user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ACCOUNT_NOT_FOUND",
            )

        if user.is_locked():
            minutes_left = int(
                (user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60
            ) + 1
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Cuenta bloqueada por múltiples intentos. Reintente en {minutes_left} minutos.",
            )

        if not verify_password(data.password, user.hashed_password):
            user.login_attempts += 1
            if user.login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
                user.login_attempts = 0
            await user.save()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="INVALID_PASSWORD",
            )

        # Reset login attempts on successful login
        user.login_attempts = 0
        user.locked_until = None
        await user.save()

        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def refresh(refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipo de token inválido",
            )

        jti = payload.get("jti")
        if jti:
            revoked = await RevokedToken.find_one(RevokedToken.jti == jti)
            if revoked:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token revocado",
                )

        user_id = payload.get("sub")
        user = await User.get(user_id)
        if not user or user.deleted_at is not None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no válido",
            )

        # Invalidate old refresh token
        if jti:
            exp = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
            await RevokedToken(
                jti=jti,
                user_id=str(user.id),
                revoked_at=datetime.now(timezone.utc),
                expires_at=exp,
            ).save()

        new_access = create_access_token(str(user.id))
        new_refresh = create_refresh_token(str(user.id))

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def logout(token: str, user: User):
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti:
                exp = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
                await RevokedToken(
                    jti=jti,
                    user_id=str(user.id),
                    revoked_at=datetime.now(timezone.utc),
                    expires_at=exp,
                ).save()
        except Exception:
            pass

    @staticmethod
    async def delete_account(user: User, token: str = ""):
        # 1. Revoke current token
        if token:
            try:
                payload = decode_token(token)
                jti = payload.get("jti")
                if jti:
                    exp = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
                    await RevokedToken(
                        jti=jti,
                        user_id=str(user.id),
                        revoked_at=datetime.now(timezone.utc),
                        expires_at=exp,
                    ).save()
            except Exception:
                pass

        # 2. Delete all tasks, connections, time entries and reminders belonging to user
        from app.models.task import Task
        from app.models.task_connection import TaskConnection
        from app.models.time_entry import TimeEntry
        from app.models.reminder import Reminder

        await Task.find(Task.user_id.id == user.id).delete()
        await TaskConnection.find(TaskConnection.user_id.id == user.id).delete()
        await TimeEntry.find(TimeEntry.user_id.id == user.id).delete()
        await Reminder.find(Reminder.user_id.id == user.id).delete()

        # 3. Soft-delete and deactivate user account
        user.push_tokens = []
        user.is_active = False
        await user.soft_delete()

