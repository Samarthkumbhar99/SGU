"""Health response schemas."""

from typing import Dict
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
