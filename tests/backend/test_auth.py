"""
Unit tests for authentication endpoints.
Tests registration, login, JWT validation, and profile retrieval.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base, get_db

# Use in-memory SQLite for tests
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def registered_user(client):
    """Register a test user and return credentials."""
    payload = {
        "email": "test@secureci.dev",
        "username": "testuser",
        "full_name": "Test User",
        "password": "TestPass123!",
        "role": "developer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    return {"payload": payload, "response": response.json()}


class TestRegistration:
    def test_register_success(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "newuser@test.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "SecurePass123",
            "role": "developer",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "Bearer"
        assert data["user"]["email"] == "newuser@test.com"
        assert "hashed_password" not in data["user"]

    def test_register_duplicate_email(self, client, registered_user):
        response = client.post("/api/v1/auth/register", json={
            "email": "test@secureci.dev",  # duplicate
            "username": "different_user",
            "full_name": "Another User",
            "password": "TestPass123!",
            "role": "developer",
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_weak_password(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "weak@test.com",
            "username": "weakuser",
            "full_name": "Weak User",
            "password": "123",  # too short
            "role": "developer",
        })
        assert response.status_code == 422  # Validation error

    def test_register_invalid_email(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "username": "testuser2",
            "full_name": "Test",
            "password": "ValidPass123",
            "role": "developer",
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, registered_user):
        response = client.post("/api/v1/auth/login", json={
            "email": registered_user["payload"]["email"],
            "password": registered_user["payload"]["password"],
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["username"] == "testuser"

    def test_login_wrong_password(self, client, registered_user):
        response = client.post("/api/v1/auth/login", json={
            "email": registered_user["payload"]["email"],
            "password": "WrongPassword!",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/v1/auth/login", json={
            "email": "doesnotexist@test.com",
            "password": "AnyPassword123",
        })
        assert response.status_code == 401


class TestProtectedEndpoints:
    def test_get_me_with_token(self, client, registered_user):
        # First login to get token
        login = client.post("/api/v1/auth/login", json={
            "email": registered_user["payload"]["email"],
            "password": registered_user["payload"]["password"],
        })
        token = login.json()["access_token"]

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["email"] == registered_user["payload"]["email"]

    def test_get_me_without_token(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert response.status_code == 401


class TestHealthCheck:
    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
