"""Smoke tests for FastAPI application routes."""

import pytest

# Importing ``app.main`` loads routers that depend on pandas/numpy. CI installs
# them via ``requirements.txt``; skip these tests in minimal environments.
pytest.importorskip("pandas")
pytest.importorskip("numpy")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_returns_service_metadata() -> None:
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body.get("service") == "SubLeech API"
    assert body.get("status") == "operational"
    assert "/docs" in body.get("docs", "")


def test_health_returns_shape() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "redis" in data
