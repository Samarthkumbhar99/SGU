"""Comprehensive test suite for Phase 3 Demand Forecasting Engine."""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.forecasting.baselines import (
    HistoricalAverageModel,
    MovingAverageModel,
    SeasonalNaiveModel,
)
from src.forecasting.evaluator import evaluate_chronological_holdout
from src.forecasting.features import build_tabular_features, verify_no_future_leakage, FEATURE_COLUMNS
from src.forecasting.metrics import calculate_metrics, calculate_relative_improvement
from src.forecasting.ml_models import LightGBMForecaster, XGBoostForecaster, round_forecast_for_ordering
from src.forecasting.model_registry import ModelRegistry
from src.schemas.forecasting import EvaluationResponse, ForecastResponse


# 1. Seasonal-naive predictions on known weekly-pattern fixture data
def test_seasonal_naive_predictions_known_pattern():
    weekly_pattern = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0]
    dates = pd.date_range("2024-01-01", periods=14, freq="D")
    df = pd.DataFrame({"date": dates, "units_sold": weekly_pattern * 2})

    model = SeasonalNaiveModel(season_length=7).fit(df)
    preds = model.predict(horizon_days=14)

    assert len(preds) == 14
    assert preds[:7] == weekly_pattern
    assert preds[7:] == weekly_pattern


# 2. Moving-average predictions on known fixture data
def test_moving_average_predictions_known_fixture():
    dates = pd.date_range("2024-01-01", periods=10, freq="D")
    sales = [5, 10, 15, 10, 10, 15, 20, 30, 40, 50]
    df = pd.DataFrame({"date": dates, "units_sold": sales})

    model = MovingAverageModel(window_days=4).fit(df)
    preds = model.predict(horizon_days=5)

    assert len(preds) == 5
    assert all(p == 35.0 for p in preds)


# 3. Non-negative predictions
def test_non_negative_predictions_edge_case():
    dates = pd.date_range("2024-01-01", periods=5, freq="D")
    df = pd.DataFrame({"date": dates, "units_sold": [0, 0, 0, 0, 0]})

    snaive = SeasonalNaiveModel().fit(df).predict(7)
    ma = MovingAverageModel().fit(df).predict(7)
    havg = HistoricalAverageModel().fit(df).predict(7)

    assert all(p >= 0.0 for p in snaive)
    assert all(p >= 0.0 for p in ma)
    assert all(p >= 0.0 for p in havg)


# 4. Unknown store/warehouse and product/SKU identifiers return 400
def test_unknown_store_or_product_returns_400(client):
    payload = {
        "sku_id": "SKU_GHOST_99",
        "warehouse_id": "WH_1",
        "horizon_days": 14,
    }
    response = client.post("/api/v1/forecast/predict", json=payload)
    assert response.status_code == 400
    assert "No historical demand records found" in response.json()["detail"]


# 5. Invalid forecast horizon returns 422
def test_invalid_forecast_horizon_returns_422(client):
    # horizon 0 is < 1
    p1 = {"sku_id": "SKU_1", "warehouse_id": "WH_1", "horizon_days": 0}
    r1 = client.post("/api/v1/forecast/predict", json=p1)
    assert r1.status_code == 422

    # horizon 91 is > 90
    p2 = {"sku_id": "SKU_1", "warehouse_id": "WH_1", "horizon_days": 91}
    r2 = client.post("/api/v1/forecast/predict", json=p2)
    assert r2.status_code == 422


# 6. Insufficient history and fallback behavior
def test_insufficient_history_fallback():
    dates = pd.date_range("2024-01-01", periods=3, freq="D")
    df = pd.DataFrame({"date": dates, "units_sold": [10, 20, 30]})

    model = SeasonalNaiveModel(season_length=7).fit(df)
    preds = model.predict(7)

    assert len(preds) == 7
    assert all(p == 20.0 for p in preds)


# 7. Leakage-safe feature generation test
def test_leakage_safe_feature_generation():
    dates = pd.date_range("2024-01-01", periods=60, freq="D")
    df = pd.DataFrame({
        "Date": dates,
        "SKU_ID": ["SKU_1"] * 60,
        "Warehouse_ID": ["WH_1"] * 60,
        "Units_Sold": [float(i + 1) for i in range(60)],
        "Promotion_Flag": [0] * 60,
        "Supplier_Lead_Time_Days": [7.0] * 60,
    })

    # Verifies that perturbing observations after 2024-01-31 does not alter features on or before 2024-01-31
    assert verify_no_future_leakage(df, cutoff_date="2024-01-31") is True


# 8. Lag and rolling shifts: Target day demand is NOT included in its own features
def test_rolling_statistics_shift():
    dates = pd.date_range("2024-01-01", periods=10, freq="D")
    sales = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0]
    df = pd.DataFrame({
        "Date": dates,
        "SKU_ID": ["SKU_1"] * 10,
        "Warehouse_ID": ["WH_1"] * 10,
        "Units_Sold": sales,
        "Promotion_Flag": [0] * 10,
        "Supplier_Lead_Time_Days": [7.0] * 10,
    })
    feat = build_tabular_features(df)
    # At index 7 (day 8, sales=80), rolling_mean_7 should be mean of days 1-7 (sales 10-70 = 40.0), NOT including 80!
    day8_row = feat.iloc[7]
    assert day8_row["rolling_mean_7"] == 40.0
    assert day8_row["lag_1"] == 70.0


# 9. Zero-actual demand WAPE handling
def test_zero_actual_demand_wape_is_none():
    actual = [0.0, 0.0, 0.0]
    predicted = [1.0, 2.0, 1.0]

    metrics = calculate_metrics(actual, predicted)
    assert metrics["mae"] == pytest.approx(4.0 / 3.0, abs=1e-3)
    assert metrics["wape"] is None  # Undefined division by zero represented explicitly as None


# 10. Relative improvement calculation
def test_relative_improvement_calculation():
    # Baseline WAPE = 0.40, Candidate WAPE = 0.30 -> 25% improvement
    assert calculate_relative_improvement(0.40, 0.30) == 25.0
    # Degradation: Baseline = 0.30, Candidate = 0.36 -> -20% improvement
    assert calculate_relative_improvement(0.30, 0.36) == -20.0
    # None handling
    assert calculate_relative_improvement(None, 0.30) is None
    assert calculate_relative_improvement(0.0, 0.30) is None


# 11. Integer ordering rounding policies
def test_rounding_policy():
    assert round_forecast_for_ordering(14.2, policy="round") == 14
    assert round_forecast_for_ordering(14.8, policy="round") == 15
    assert round_forecast_for_ordering(14.2, policy="ceil") == 15
    assert round_forecast_for_ordering(-5.0, policy="round") == 0


# 12. Model registry persistence and artifact validation
def test_model_registry_save_and_load(tmp_path):
    registry = ModelRegistry(models_dir=tmp_path)
    forecaster = LightGBMForecaster(n_estimators=10)
    # Fit dummy data
    X = pd.DataFrame([{col: float(i) for col in FEATURE_COLUMNS} for i in range(20)])
    y = pd.Series([float(i * 2) for i in range(20)])
    forecaster.fit(X, y)

    saved_path = registry.save_model(
        model_obj=forecaster,
        model_name="lightgbm",
        model_version="test_v1",
        metadata={"holdout_metrics": {"mae": 1.23}},
        set_active=True,
    )
    assert saved_path.exists()
    assert (saved_path / "model.joblib").exists()
    assert (saved_path / "metadata.json").exists()

    loaded_model, meta = registry.load_model("active")
    assert meta["model_version"] == "test_v1"
    preds = loaded_model.predict(X.head(2))
    assert len(preds) == 2
    assert all(p >= 0.0 for p in preds)


# 13. API forecast predict endpoint with live data
def test_api_forecast_predict_live(client):
    payload = {
        "sku_id": "SKU_1",
        "warehouse_id": "WH_1",
        "horizon_days": 7,
        "model_type": "seasonal_naive",
    }
    res = client.post("/api/v1/forecast/predict", json=payload)
    assert res.status_code == 200
    data = ForecastResponse(**res.json())
    assert data.sku_id == "SKU_1"
    assert data.warehouse_id == "WH_1"
    assert len(data.forecasts) == 7
    assert all(f.predicted_demand >= 0.0 for f in data.forecasts)


# 14. API forecast models list endpoint
def test_api_forecast_models_list(client):
    res = client.get("/api/v1/forecast/models")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["models"], list)


# 15. API chronological holdout evaluation endpoint
def test_api_forecast_evaluate_endpoint(client):
    payload = {
        "sku_id": "SKU_1",
        "warehouse_id": "WH_1",
        "include_ml_models": False,  # fast test on baselines
    }
    res = client.post("/api/v1/forecast/evaluate", json=payload)
    assert res.status_code == 200
    data = EvaluationResponse(**res.json())
    assert data.series_evaluated == 1
    assert data.total_test_observations == 28
    assert len(data.method_metrics) >= 3
    assert data.best_method in ["seasonal_naive_7d", "moving_average_7d", "moving_average_14d"]
