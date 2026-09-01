from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.core.security import decode_token
from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.services.ws_manager import ws_manager

router = APIRouter()


@router.websocket("/sync")
async def websocket_sync_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=1008)
            return

        jti = payload.get("jti")
        if jti:
            revoked = await RevokedToken.find_one(RevokedToken.jti == jti)
            if revoked:
                await websocket.close(code=1008)
                return

        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
        user = await User.get(user_id)
        if user:
            if user.deleted_at is not None or not user.is_active:
                await websocket.close(code=1008)
                return
        else:
            # Auto-provision user from aye-auth central JWT
            user = User(
                id=user_id,
                email=payload.get("email", "user@ayeapps.com"),
                name=payload.get("name", "Usuario"),
                is_active=True,
            )
            try:
                await user.insert()
            except Exception:
                pass
    except Exception:
        await websocket.close(code=1008)
        return

    await ws_manager.connect(str(user.id), websocket)
    try:
        while True:
            # Keep-alive heartbeat / client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(str(user.id), websocket)
    except Exception:
        ws_manager.disconnect(str(user.id), websocket)
