"""Health and readiness response schemas."""

from typing import Any, Dict
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Pydantic schema for the ML service health response."""

    status: str = Field(..., description="Overall health state (e.g., 'healthy')")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service semantic version")
    environment: str = Field(..., description="Active runtime environment")
    components: Dict[str, str] = Field(
        ...,
        description="Current state of individual subsystem components without fabrication",
    )


class ReadinessResponse(BaseModel):
    """Pydantic schema for the ML service readiness response."""

    status: str = Field(..., description="Readiness state (e.g., 'ready')")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service semantic version")
    environment: str = Field(..., description="Active runtime environment")
    ready: bool = Field(..., description="Whether service is ready to accept production workload")
    components: Dict[str, Any] = Field(
        ...,
        description="Detailed readiness state of subsystems and dependencies",
    )
