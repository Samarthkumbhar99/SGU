"""Pydantic schemas for Demand Forecasting, Training, Evaluation, and Registry."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class ForecastItem(BaseModel):
    """Daily forecast point prediction."""

    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    predicted_demand: float = Field(..., ge=0.0, description="Predicted non-negative continuous demand units")
    order_quantity_round: Optional[int] = Field(None, ge=0, description="Integer order quantity under rounding policy")


class ForecastRequest(BaseModel):
    """Request payload for daily demand forecasting."""

    sku_id: Optional[str] = Field(None, description="SKU identifier (e.g., SKU_1)")
    warehouse_id: Optional[str] = Field(None, description="Warehouse identifier (e.g., WH_1)")
    # Backward compatibility aliases
    product_id: Optional[str] = Field(None, description="Product SKU identifier alias")
    store_id: Optional[str] = Field(None, description="Store / Warehouse identifier alias")

    horizon_days: int = Field(default=14, ge=1, le=90, description="Forecast horizon in days (1-90)")
    model_type: Literal["auto", "lightgbm", "xgboost", "seasonal_naive", "moving_average", "historical_average"] = Field(
        default="auto",
        description="Forecasting method to apply",
    )
    model_version: Optional[str] = Field(default="active", description="Specific model version or 'active'")
    window_days: Optional[int] = Field(default=14, ge=2, le=90, description="Historical window size for moving average method")
    rounding_policy: Literal["round", "ceil"] = Field(default="round", description="Integer rounding policy for order quantities")

    @model_validator(mode="after")
    def resolve_identifiers(self):
        # Resolve sku_id from product_id if omitted
        if not self.sku_id and self.product_id:
            self.sku_id = self.product_id
        if not self.product_id and self.sku_id:
            self.product_id = self.sku_id

        # Resolve warehouse_id from store_id if omitted
        if not self.warehouse_id and self.store_id:
            self.warehouse_id = self.store_id
        if not self.store_id and self.warehouse_id:
            self.store_id = self.warehouse_id

        if not self.sku_id or not self.warehouse_id:
            raise ValueError("Both SKU identifier and Warehouse identifier must be provided.")
        return self


class ForecastResponse(BaseModel):
    """Forecast output response."""

    sku_id: str = Field(..., description="SKU identifier")
    warehouse_id: str = Field(..., description="Warehouse identifier")
    product_id: Optional[str] = Field(None, description="Product SKU identifier alias")
    store_id: Optional[str] = Field(None, description="Store / Warehouse identifier alias")
    forecast_origin: str = Field(..., description="Last available date in historical training series")
    horizon_days: int = Field(..., description="Number of forecasted days")
    model_applied: str = Field(..., description="Model method used for prediction")
    model_version: Optional[str] = Field(None, description="Persisted model artifact version if applicable")
    selection_metric: Optional[str] = Field(None, description="Metric used if 'auto' selection was requested")
    selection_score: Optional[float] = Field(None, description="Validation score of the selected model")
    forecasts: List[ForecastItem] = Field(..., description="Daily point predictions")
    validation_metadata: Optional[Dict[str, Any]] = Field(None, description="Model validation and accuracy metadata")
    warnings: List[str] = Field(default_factory=list, description="Operational or data warnings")


class MethodMetrics(BaseModel):
    """Accuracy metrics for a single forecasting method."""

    method: str = Field(..., description="Method name")
    mae: float = Field(..., description="Mean Absolute Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    wape: Optional[float] = Field(None, description="Weighted Absolute Percentage Error (null if sum of actuals is zero)")
    bias: float = Field(..., description="Signed bias / Mean Error (predicted - actual)")
    relative_improvement_pct: Optional[float] = Field(None, description="% WAPE improvement relative to baseline")


class TrainRequest(BaseModel):
    """Request payload for model training trigger."""

    model_type: Literal["lightgbm", "xgboost", "all"] = Field(default="lightgbm", description="Model architecture to train")
    force_retrain: bool = Field(default=False, description="Force training even if active model exists")
    set_active: bool = Field(default=True, description="Promote newly trained model to active if validated")


class TrainResponse(BaseModel):
    """Response payload after model training."""

    success: bool = True
    model_name: str = Field(..., description="Name of trained model")
    model_version: str = Field(..., description="Generated model version string")
    training_cutoff_date: str = Field(..., description="Latest date used in training set")
    train_observations: int = Field(..., description="Number of observations in training set")
    validation_metrics: Dict[str, Any] = Field(..., description="Metrics on validation split")
    holdout_metrics: Dict[str, Any] = Field(..., description="Metrics on untouched holdout split")
    artifact_path: str = Field(..., description="Path to persisted artifact on disk")
    is_active: bool = Field(..., description="Whether model was activated for inference")


class EvaluationRequest(BaseModel):
    """Request payload for historical backtest evaluation."""

    sku_id: Optional[str] = Field(None, description="Optional SKU filter")
    warehouse_id: Optional[str] = Field(None, description="Optional warehouse filter")
    product_id: Optional[str] = Field(None, description="Alias for sku_id")
    store_id: Optional[str] = Field(None, description="Alias for warehouse_id")
    train_end_date: str = Field(default="2024-11-04", description="Last date of training split")
    test_start_date: str = Field(default="2024-12-03", description="Start date of holdout test split")
    test_end_date: str = Field(default="2024-12-30", description="End date of holdout test split")
    include_ml_models: bool = Field(default=True, description="Whether to include LightGBM and XGBoost in evaluation")

    @model_validator(mode="after")
    def resolve_identifiers(self):
        if not self.sku_id and self.product_id:
            self.sku_id = self.product_id
        if not self.warehouse_id and self.store_id:
            self.warehouse_id = self.store_id
        return self


class EvaluationResponse(BaseModel):
    """Comprehensive holdout backtest evaluation response."""

    target_evaluated: str = Field(default="Units_Sold (observed demand)", description="Target field evaluated")
    is_synthetic_benchmark: bool = Field(default=False, description="Flag indicating live production dataset")
    split_boundaries: Dict[str, str] = Field(..., description="Chronological split boundaries")
    holdout_dates: str = Field(..., description="Holdout evaluation date interval")
    series_evaluated: int = Field(..., description="Number of time series evaluated")
    total_test_observations: int = Field(..., description="Total test observations evaluated")
    method_metrics: List[MethodMetrics] = Field(..., description="Comparative metrics across models")
    best_method: str = Field(..., description="Method with lowest holdout MAE/WAPE")
    warnings: List[str] = Field(default_factory=list, description="Warnings encountered during evaluation")


class ModelListResponse(BaseModel):
    """Response containing list of registered models."""

    success: bool = True
    active_version: Optional[str] = None
    models: List[Dict[str, Any]] = Field(default_factory=list)
