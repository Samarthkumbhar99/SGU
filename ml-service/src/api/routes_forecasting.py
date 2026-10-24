"""API router for Demand Forecasting, Model Training, Evaluation, and Registry."""

from fastapi import APIRouter, HTTPException, status
from src.config import settings
from src.forecasting.service import ForecastingService
from src.schemas.forecasting import (
    EvaluationRequest,
    EvaluationResponse,
    ForecastRequest,
    ForecastResponse,
    ModelListResponse,
    TrainRequest,
    TrainResponse,
)

router = APIRouter(tags=["Demand Forecasting"])


@router.post(
    "/forecast/train",
    response_model=TrainResponse,
    summary="Train and Persist Forecasting Model",
    description="Trains LightGBM or XGBoost on chronological train split, validates on holdout, and persists versioned artifact.",
)
def train_forecast(request: TrainRequest) -> TrainResponse:
    service = ForecastingService()
    try:
        return service.train_model(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Training failed: {str(e)}")


@router.post(
    "/forecast/predict",
    response_model=ForecastResponse,
    summary="Generate Daily Demand Forecast",
    description="Predict future daily SKU-warehouse demand using active trained model or specified baseline.",
)
def predict_forecast(request: ForecastRequest) -> ForecastResponse:
    service = ForecastingService()
    try:
        return service.generate_forecast(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference failed: {str(e)}")


# Alias for backward compatibility with Phase 0/1 contract
@router.post(
    "/forecast",
    response_model=ForecastResponse,
    include_in_schema=False,
)
def predict_forecast_alias(request: ForecastRequest) -> ForecastResponse:
    return predict_forecast(request)


@router.post(
    "/forecast/evaluate",
    response_model=EvaluationResponse,
    summary="Evaluate Forecasting Models on Chronological Holdout",
    description="Runs a leakage-safe chronological backtest comparing Baselines, LightGBM, and XGBoost on holdout test data.",
)
def evaluate_forecast(request: EvaluationRequest) -> EvaluationResponse:
    service = ForecastingService()
    try:
        return service.evaluate_forecasts(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Evaluation failed: {str(e)}")


# Alias for backward compatibility
@router.post(
    "/evaluate-forecast",
    response_model=EvaluationResponse,
    include_in_schema=False,
)
def evaluate_forecast_alias(request: EvaluationRequest) -> EvaluationResponse:
    return evaluate_forecast(request)


@router.get(
    "/forecast/models",
    response_model=ModelListResponse,
    summary="List Registered Forecaster Models",
    description="Returns metadata, cutoff dates, metrics, and active pointer for all persisted model artifacts.",
)
def get_forecast_models() -> ModelListResponse:
    service = ForecastingService()
    return service.list_models()
