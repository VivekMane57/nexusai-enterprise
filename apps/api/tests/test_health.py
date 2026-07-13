from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_endpoint() -> None:
    response = client.get("/")

    assert response.status_code == 200

    payload = response.json()

    assert payload["application"] == "NexusAI Enterprise"
    assert payload["status"] == "running"


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "healthy"


def test_liveness_endpoint() -> None:
    response = client.get("/health/live")

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "alive"


def test_api_v1_status_endpoint() -> None:
    response = client.get("/api/v1/status")

    assert response.status_code == 200

    payload = response.json()

    assert payload["api_version"] == "v1"