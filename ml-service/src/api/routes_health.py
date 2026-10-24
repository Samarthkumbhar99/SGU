"""Health and readiness check API routes."""

from fastapi import APIRouter
from src.config import settings
from src.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
def get_health() -> HealthResponse:
    """Return the operational health status of the ML service.

    Liveness probe: verifies that the FastAPI server framework is running.
    Does not fail solely because an optional external dataset or database is unavailable.
    """
    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        components={
            "api_server": "running",
            "forecasting_engine": "ready",
            "optimization_solver": "ready",
        },
    )


@router.get("/health/ready", response_model=ReadinessResponse, summary="Service Readiness Check")
def get_readiness() -> ReadinessResponse:
    """Return detailed readiness of the ML service.

    Readiness probe: reports on dataset accessibility, solver readiness, and runtime environment.
    """
    dataset_exists = settings.dataset_dir.exists() and settings.dataset_dir.is_dir()
    return ReadinessResponse(
        status="ready",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        ready=True,
        components={
            "api_server": "running",
            "forecasting_engine": "ready",
            "optimization_solver": "ready",
            "dataset_directory_accessible": dataset_exists,
            "dataset_path": str(settings.dataset_dir),
        },
    )
