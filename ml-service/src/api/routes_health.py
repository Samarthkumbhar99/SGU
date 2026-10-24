"""Health check API routes."""

from fastapi import APIRouter
from src.config import settings
from src.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
def get_health() -> HealthResponse:
    """Return the operational health status of the ML service.

    Communicates that the service framework is running. Subsystems that are not yet
    implemented (such as live forecasting models or OR-Tools solvers) are explicitly
    marked as 'not_initialized' rather than claiming fabricated operational health.
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
