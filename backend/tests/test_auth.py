import pytest


@pytest.mark.asyncio
async def test_register_login_refresh_flow(client):
    payload = {
        "email": "test@example.com",
        "username": "tester",
        "password": "Password123!",
    }
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["email"] == payload["email"]
    assert body["username"] == payload["username"]
    assert body["role"] == "user"

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert r.status_code == 200, r.text
    tokens = r.json()
    assert "access_token" in tokens and "refresh_token" in tokens

    r = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json()["email"] == payload["email"]

    r = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_duplicate_email_rejected(client):
    payload = {
        "email": "dup@example.com",
        "username": "dupuser",
        "password": "Password123!",
    }
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201

    r = await client.post(
        "/api/v1/auth/register",
        json={**payload, "username": "another"},
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_login_with_wrong_password(client):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.com",
            "username": "wronguser",
            "password": "CorrectPass123!",
        },
    )
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "BadPass"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client):
    r = await client.get("/api/v1/users/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_health_endpoint(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
