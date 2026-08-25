from fastapi import APIRouter, Depends, Form, Header, Request, status
from fastapi.responses import RedirectResponse
from typing import Optional
import json
from app.core.deps import CurrentUser
from app.core.limiter import limiter
from app.schemas.auth import (
    AppleAuthRequest,
    GoogleAuthRequest,
    PushTokenRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdateProfile,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, data: UserRegister):
    user = await AuthService.register(data)
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        timezone=user.timezone,
        pomodoro_settings=user.pomodoro_settings.model_dump(),
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("15/minute")
async def login(request: Request, data: UserLogin):
    return await AuthService.authenticate(data)


@router.post("/oauth/google", response_model=TokenResponse)
@limiter.limit("15/minute")
async def google_auth(request: Request, data: GoogleAuthRequest):
    return await AuthService.authenticate_google(data)


@router.post("/oauth/apple", response_model=TokenResponse)
@limiter.limit("15/minute")
async def apple_auth(request: Request, data: AppleAuthRequest):
    return await AuthService.authenticate_apple(data)


@router.post("/oauth/apple/callback")
async def apple_callback(
    code: Optional[str] = Form(None),
    id_token: Optional[str] = Form(None),
    user: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
):
    if not id_token:
        return RedirectResponse(url="https://tasks.ayeapps.com/?error=apple_auth_failed", status_code=303)

    user_name = None
    user_email = None
    if user:
        try:
            user_data = json.loads(user)
            name_data = user_data.get("name", {})
            user_name = f"{name_data.get('firstName', '')} {name_data.get('lastName', '')}".strip() or None
            user_email = user_data.get("email")
        except Exception:
            pass

    auth_request = AppleAuthRequest(
        identity_token=id_token,
        name=user_name,
        email=user_email,
    )
    tokens = await AuthService.authenticate_apple(auth_request)
    redirect_url = f"https://tasks.ayeapps.com/#access_token={tokens.access_token}&refresh_token={tokens.refresh_token}"
    return RedirectResponse(url=redirect_url, status_code=303)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshTokenRequest):
    return await AuthService.refresh(data.refresh_token)


@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: CurrentUser,
    authorization: Optional[str] = Header(None),
):
    token = authorization.replace("Bearer ", "") if authorization else ""
    await AuthService.logout(token, current_user)
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        timezone=current_user.timezone,
        pomodoro_settings=current_user.pomodoro_settings.model_dump(),
        created_at=current_user.created_at,
    )


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdateProfile, current_user: CurrentUser):
    updated = await AuthService.update_profile(current_user, data)
    return UserResponse(
        id=str(updated.id),
        email=updated.email,
        name=updated.name,
        timezone=updated.timezone,
        pomodoro_settings=updated.pomodoro_settings.model_dump(),
        created_at=updated.created_at,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current_user: CurrentUser,
    authorization: Optional[str] = Header(None),
):
    token = authorization.replace("Bearer ", "") if authorization else ""
    await AuthService.delete_account(current_user, token)
    return None


@router.post("/push-token", status_code=status.HTTP_200_OK)
async def register_push_token(data: PushTokenRequest, current_user: CurrentUser):
    if data.push_token not in current_user.push_tokens:
        current_user.push_tokens.append(data.push_token)
        await current_user.save()
    return {"message": "Token registrado correctamente"}
