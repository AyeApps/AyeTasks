import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_auth_and_account_deletion_flow(client: AsyncClient):
    # 1. Register test user with unique email
    email = f"test_audit_{uuid.uuid4().hex[:8]}@ayetasks.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Audit User", "email": email, "password": "SecurePassword123!"},
    )
    assert reg_res.status_code == 201

    # 2. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Get profile
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 4. Mandatory Apple/Google Guideline 5.1.1(v): Delete Account
    del_res = await client.delete("/api/v1/auth/me", headers=headers)
    assert del_res.status_code == 204

    # 5. Verify token is revoked and account is deleted
    after_res = await client.get("/api/v1/auth/me", headers=headers)
    assert after_res.status_code == 401

    # 6. Verify logging in with deleted/non-existent account returns 404 ACCOUNT_NOT_FOUND
    deleted_login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePassword123!"},
    )
    assert deleted_login_res.status_code == 404
    assert deleted_login_res.json()["detail"] == "ACCOUNT_NOT_FOUND"


@pytest.mark.asyncio
async def test_oauth_invalid_tokens(client: AsyncClient):
    # Google with invalid token
    g_res = await client.post(
        "/api/v1/auth/oauth/google", json={"id_token": "invalid_google_token"}
    )
    assert g_res.status_code == 401

    # Apple with invalid token
    a_res = await client.post(
        "/api/v1/auth/oauth/apple", json={"identity_token": "invalid_apple_token"}
    )
    assert a_res.status_code == 401
