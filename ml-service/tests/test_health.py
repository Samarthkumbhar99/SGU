"""Health endpoint and configuration verification tests."""

from pathlib import Path
from src.config import settings
from src.schemas.health import HealthResponse, ReadinessResponse


def test_app_import():
    """Verify that the FastAPI application can be imported and initialized."""
    from src.main import app

    assert app.title == "SupplyShield AI ML Service"
    assert app.version == "0.1.0"


def test_health_endpoint(client):
    """Verify that /health returns HTTP 200 and matches the HealthResponse schema."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    validated = HealthResponse(**data)
    assert validated.status == "healthy"
    assert validated.service == "SupplyShield AI ML Service"
    assert validated.components["api_server"] == "running"
    assert validated.components["forecasting_engine"] == "ready"
    assert validated.components["optimization_solver"] == "ready"


def test_readiness_endpoint(client):
    """Verify that /health/ready returns HTTP 200 and matches ReadinessResponse schema."""
    response = client.get("/health/ready")
    assert response.status_code == 200

    data = response.json()
    validated = ReadinessResponse(**data)
    assert validated.status == "ready"
    assert validated.service == "SupplyShield AI ML Service"
    assert validated.ready is True
    assert validated.components["api_server"] == "running"


def test_versioned_health_alias(client):
    """Verify that the /api/v1/health alias works and returns identical structure."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    validated = HealthResponse(**data)
    assert validated.status == "healthy"


def test_versioned_readiness_alias(client):
    """Verify that the /api/v1/health/ready alias works and returns identical structure."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200

    data = response.json()
    validated = ReadinessResponse(**data)
    assert validated.status == "ready"


def test_unknown_endpoint_returns_404(client):
    """Verify that requesting an unknown route returns HTTP 404."""
    response = client.get("/api/v1/nonexistent_route")
    assert response.status_code == 404
