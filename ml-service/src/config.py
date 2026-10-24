"""Configuration management for the SupplyShield AI ML Service.

Resolves repository and dataset paths dynamically without hardcoded machine paths,
environment file requirements, or database dependencies.
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field


class Settings(BaseModel):
    """Application runtime configuration settings."""

    app_name: str = "SupplyShield AI ML Service"
    app_version: str = "0.1.0"
    app_env: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    debug: bool = Field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")

    # API Configuration
    api_prefix: str = "/api/v1"

    # Dataset path resolution
    # By default, navigates from ml-service/src/config.py -> ml-service -> SGU -> data/demo
    dataset_dir: Path = Field(
        default_factory=lambda: Path(
            os.getenv(
                "DATASET_DIR",
                str(Path(__file__).resolve().parent.parent.parent / "data" / "demo"),
            )
        )
    )


settings = Settings()
