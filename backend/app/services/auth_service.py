from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
import httpx
from jose import jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
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
from app.schemas.auth import (
    AppleAuthRequest,
    GoogleAuthRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserUpdateProfile,
)


def verify_google_id_token(token: str) -> dict:
    try:
        idinfo = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
        )
        aud = idinfo.get("aud")
        if aud not in settings.GOOGLE_CLIENT_IDS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Audience de Google ID token no autorizada",
            )
        return idinfo
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google ID token inválido: {str(e)}",
        )


async def verify_apple_id_token(token: str) -> dict:
    try:
        headers = jwt.get_unverified_header(token)
        kid = headers.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Apple token sin kid",
            )

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://appleid.apple.com/auth/keys")
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="No se pudo contactar a los servidores de Apple",
                )
            apple_keys = resp.json().get("keys", [])

        key = next((k for k in apple_keys if k.get("kid") == kid), None)
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clave pública de Apple no encontrada",
            )

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.APPLE_BUNDLE_ID,
            issuer="https://appleid.apple.com",
            options={"verify_at_hash": False},
        )
        return payload
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Apple identity token inválido: {str(e)}",
        )


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
    async def authenticate_google(data: GoogleAuthRequest) -> TokenResponse:
        idinfo = verify_google_id_token(data.id_token)
        email = idinfo.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El token de Google no contiene un correo electrónico",
            )

        email = email.lower()
        sub = str(idinfo.get("sub"))
        name = idinfo.get("name") or "Usuario Google"

        user = await User.find_one(User.email == email)
        if user:
            if user.deleted_at is not None:
                user.deleted_at = None
                user.is_active = True
            if not user.provider_id:
                user.provider_id = sub
                user.auth_provider = "google"
            user.is_verified = True
            user.login_attempts = 0
            user.locked_until = None
            await user.save()
        else:
            user = User(
                email=email,
                name=name,
                auth_provider="google",
                provider_id=sub,
                is_verified=True,
                timezone="America/Mexico_City",
            )
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
    async def authenticate_apple(data: AppleAuthRequest) -> TokenResponse:
        payload = await verify_apple_id_token(data.identity_token)
        sub = str(payload.get("sub"))
        email = payload.get("email") or data.email
        if not email and not sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo obtener la identidad de Apple",
            )

        user = None
        if sub:
            user = await User.find_one(User.provider_id == sub)
        if not user and email:
            user = await User.find_one(User.email == str(email).lower())

        if user:
            if user.deleted_at is not None:
                user.deleted_at = None
                user.is_active = True
            if not user.provider_id:
                user.provider_id = sub
                user.auth_provider = "apple"
            if data.name and (user.name == "Usuario" or user.name == "Usuario Apple"):
                user.name = data.name
            user.is_verified = True
            user.login_attempts = 0
            user.locked_until = None
            await user.save()
        else:
            user_email = (email or f"{sub}@privaterelay.appleid.com").lower()
            user = User(
                email=user_email,
                name=data.name or "Usuario Apple",
                auth_provider="apple",
                provider_id=sub,
                is_verified=True,
                timezone="America/Mexico_City",
            )
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

