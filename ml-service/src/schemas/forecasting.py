"""Pydantic schemas for Demand Forecasting and Evaluation."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class ForecastItem(BaseModel):
    """Daily forecast point prediction."""

    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    predicted_demand: float = Field(..., ge=0.0, description="Predicted non-negative demand units")


class ForecastRequest(BaseModel):
    """Request payload for daily demand forecasting."""

    store_id: str = Field(..., description="Store identifier (e.g., STORE-01)")
    product_id: str = Field(..., description="SKU identifier (e.g., SKU-001)")
    horizon_days: int = Field(default=14, ge=1, le=90, description="Forecast horizon in days (1-90)")
    model_type: Literal["auto", "seasonal_naive", "moving_average", "historical_average"] = Field(
        default="auto",
        description="Forecasting method to apply",
    )
    window_days: Optional[int] = Field(
        default=14,
        ge=2,
        le=90,
        description="Historical window size for moving average method",
    )


class ForecastResponse(BaseModel):
    """Forecast output response."""

    store_id: str = Field(..., description="Store identifier")
    product_id: str = Field(..., description="Product SKU identifier")
    forecast_origin: str = Field(..., description="Last available date in historical training series")
    horizon_days: int = Field(..., description="Number of forecasted days")
    model_applied: str = Field(..., description="Model method used for prediction")
    selection_metric: Optional[str] = Field(None, description="Metric used if 'auto' selection was requested")
    selection_score: Optional[float] = Field(None, description="Validation score of the selected model")
    forecasts: List[ForecastItem] = Field(..., description="Daily point predictions")
    warnings: List[str] = Field(default_factory=list, description="Operational or data warnings")


class MethodMetrics(BaseModel):
    """Accuracy metrics for a single forecasting method."""

    method: str = Field(..., description="Method name")
    mae: float = Field(..., description="Mean Absolute Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    wape: Optional[float] = Field(None, description="Weighted Absolute Percentage Error (null if sum of actuals is zero)")
    bias: float = Field(..., description="Mean Error / signed bias (predicted - actual)")


class EvaluationRequest(BaseModel):
    """Request payload for historical backtest evaluation."""

    store_id: Optional[str] = Field(None, description="Optional store filter. If omitted, evaluates all stores")
    product_id: Optional[str] = Field(None, description="Optional product filter. If omitted, evaluates all products")
    train_end_date: str = Field(default="2025-10-31", description="Last date of training split")
    test_start_date: str = Field(default="2025-11-01", description="Start date of holdout test split")
    test_end_date: str = Field(default="2025-12-31", description="End date of holdout test split")


class EvaluationResponse(BaseModel):
    """Comprehensive holdout backtest evaluation response."""

    target_evaluated: str = Field(
        default="units_sold",
        description="Evaluated demand target (observed historical sales)",
    )
    is_synthetic_benchmark: bool = Field(
        default=True,
        description="Flags that evaluation was performed on synthetic demo data",
    )
    split_boundaries: Dict[str, str] = Field(
        ...,
        description="Chronological split dates (train, validation, and holdout test)",
    )
    series_evaluated: int = Field(..., description="Number of store-product time series evaluated")
    total_test_observations: int = Field(..., description="Total holdout test daily observations evaluated")
    method_metrics: List[MethodMetrics] = Field(..., description="Metrics compared across baseline models")
    best_method: str = Field(..., description="Method with lowest holdout WAPE/MAE")
    warnings: List[str] = Field(default_factory=list, description="Warnings encountered during evaluation")
