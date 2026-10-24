"""Pytest fixtures and configuration for ML service tests."""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture(scope="module")
def client():
    """Create a test client for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client
