"""
Integration tests for the Pipeline and Scan API endpoints.
Tests the full flow: auth -> trigger scan -> get results.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base, get_db
from app.db.models.project import Repository, Project
from app.db.models.user import User
from app.core.security import hash_password

SQLALCHEMY_TEST_URL = "sqlite:///./integration_test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)

    # Seed test data
    db = TestingSessionLocal()
    try:
        user = User(
            email="sec@test.dev",
            username="sec_engineer",
            full_name="Security Engineer",
            hashed_password=hash_password("SecurePass123"),
            role="security_engineer",
        )
        db.add(user)
        db.flush()

        project = Project(name="Test Project", owner_id=user.id)
        db.add(project)
        db.flush()

        repo = Repository(
            project_id=project.id,
            name="test-repo",
            url="https://github.com/test/test-repo",
            provider="github",
        )
        db.add(repo)
        db.commit()

        db.refresh(repo)
        db.refresh(user)
        pytest.test_repo_id = str(repo.id)
        pytest.test_user_id = str(user.id)
    finally:
        db.close()

    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def auth_token():
    response = client.post("/api/v1/auth/login", json={
        "email": "sec@test.dev",
        "password": "SecurePass123",
    })
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


class TestScanEndpoints:
    def test_list_scans_authenticated(self, auth_headers):
        response = client.get("/api/v1/scans/", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_scans_unauthenticated(self):
        response = client.get("/api/v1/scans/")
        assert response.status_code == 401

    def test_get_nonexistent_scan(self, auth_headers):
        response = client.get(
            "/api/v1/scans/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_trigger_scan(self, auth_headers):
        response = client.post(
            "/api/v1/scans/trigger",
            json={
                "repository_id": pytest.test_repo_id,
                "branch": "main",
                "trigger": "manual",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "pipeline_id" in data
        assert data["status"] == "running"

    def test_trigger_scan_invalid_repo(self, auth_headers):
        response = client.post(
            "/api/v1/scans/trigger",
            json={
                "repository_id": "00000000-0000-0000-0000-000000000000",
                "branch": "main",
                "trigger": "manual",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestDashboardEndpoints:
    def test_get_metrics_authenticated(self, auth_headers):
        response = client.get("/api/v1/dashboard/metrics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "security_score" in data
        assert "grade" in data
        assert "total_scans" in data
        assert "critical_count" in data

    def test_get_metrics_unauthenticated(self):
        response = client.get("/api/v1/dashboard/metrics")
        assert response.status_code == 401

    def test_metrics_score_in_range(self, auth_headers):
        response = client.get("/api/v1/dashboard/metrics", headers=auth_headers)
        data = response.json()
        assert 0.0 <= data["security_score"] <= 100.0
