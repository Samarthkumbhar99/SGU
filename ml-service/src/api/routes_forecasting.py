"""API router for Demand Forecasting and Evaluation."""

from fastapi import APIRouter, HTTPException, status
from src.config import settings
from src.forecasting.service import ForecastingService
from src.schemas.forecasting import (
    EvaluationRequest,
    EvaluationResponse,
    ForecastRequest,
    ForecastResponse,
)

router = APIRouter(tags=["Demand Forecasting"])


@router.post(
    "/forecast",
    response_model=ForecastResponse,
    summary="Generate Daily Demand Forecast",
    description="Predict future daily store-SKU demand using baseline models with optional chronological auto-selection.",
)
def predict_forecast(request: ForecastRequest) -> ForecastResponse:
    service = ForecastingService(settings.dataset_dir)
    try:
        return service.generate_forecast(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/evaluate-forecast",
    response_model=EvaluationResponse,
    summary="Evaluate Forecasting Models on Chronological Holdout",
    description="Runs a leakage-safe chronological backtest on held-out test data and computes MAE, RMSE, WAPE, and bias.",
)
def evaluate_forecast(request: EvaluationRequest) -> EvaluationResponse:
    service = ForecastingService(settings.dataset_dir)
    try:
        return service.evaluate_forecasts(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
