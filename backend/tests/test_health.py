import os

os.environ.setdefault("APP_SECRET_KEY", "test-secret-not-for-production-with-adequate-length")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def test_health_endpoint_returns_liveness_payload() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "dream-car-bazaar-api"}
