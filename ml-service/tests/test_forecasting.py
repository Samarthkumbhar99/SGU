"""Comprehensive test suite for Phase 03 Baseline Demand Forecasting & Evaluation."""

from pathlib import Path
import pandas as pd
import pytest

from src.config import settings
from src.forecasting.baselines import (
    HistoricalAverageModel,
    MovingAverageModel,
    SeasonalNaiveModel,
)
from src.forecasting.evaluator import evaluate_chronological_holdout
from src.forecasting.metrics import calculate_metrics
from src.schemas.forecasting import EvaluationResponse, ForecastResponse


# 1. Seasonal-naive predictions on known weekly-pattern fixture data
def test_seasonal_naive_predictions_known_pattern():
    # 7-day pattern: 10, 20, 30, 40, 50, 60, 70
    weekly_pattern = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0]
    dates = pd.date_range("2025-01-01", periods=14, freq="D")
    df = pd.DataFrame({
        "date": dates,
        "units_sold": weekly_pattern * 2,
    })

    model = SeasonalNaiveModel(season_length=7).fit(df)
    preds = model.predict(horizon_days=14)

    assert len(preds) == 14
    assert preds[:7] == weekly_pattern
    assert preds[7:] == weekly_pattern


# 2. Moving-average predictions on known fixture data
def test_moving_average_predictions_known_fixture():
    dates = pd.date_range("2025-01-01", periods=10, freq="D")
    # Last 4 values: 20, 30, 40, 50 -> mean = 35.0
    sales = [5, 10, 15, 10, 10, 15, 20, 30, 40, 50]
    df = pd.DataFrame({"date": dates, "units_sold": sales})

    model = MovingAverageModel(window_days=4).fit(df)
    preds = model.predict(horizon_days=5)

    assert len(preds) == 5
    assert all(p == 35.0 for p in preds)


# 3. Non-negative predictions
def test_non_negative_predictions_edge_case():
    dates = pd.date_range("2025-01-01", periods=5, freq="D")
    df = pd.DataFrame({"date": dates, "units_sold": [0, 0, 0, 0, 0]})

    snaive = SeasonalNaiveModel().fit(df).predict(7)
    ma = MovingAverageModel().fit(df).predict(7)
    havg = HistoricalAverageModel().fit(df).predict(7)

    assert all(p >= 0.0 for p in snaive)
    assert all(p >= 0.0 for p in ma)
    assert all(p >= 0.0 for p in havg)


# 4. Unknown store and product identifiers return 400
def test_unknown_store_or_product_returns_400(client):
    payload = {
        "store_id": "STORE-GHOST-99",
        "product_id": "SKU-001",
        "horizon_days": 14,
    }
    response = client.post("/api/v1/forecast", json=payload)
    assert response.status_code == 400
    assert "No historical demand records found" in response.json()["detail"]


# 5. Invalid forecast horizon returns 422
def test_invalid_forecast_horizon_returns_422(client):
    # horizon 0 is < 1
    p1 = {"store_id": "STORE-01", "product_id": "SKU-001", "horizon_days": 0}
    r1 = client.post("/api/v1/forecast", json=p1)
    assert r1.status_code == 422

    # horizon 91 is > 90
    p2 = {"store_id": "STORE-01", "product_id": "SKU-001", "horizon_days": 91}
    r2 = client.post("/api/v1/forecast", json=p2)
    assert r2.status_code == 422


# 6. Insufficient history and fallback behavior
def test_insufficient_history_fallback():
    # Only 3 days of history available (< 7)
    dates = pd.date_range("2025-01-01", periods=3, freq="D")
    df = pd.DataFrame({"date": dates, "units_sold": [10, 20, 30]})

    model = SeasonalNaiveModel(season_length=7).fit(df)
    preds = model.predict(7)

    assert len(preds) == 7
    # Should fallback to historical mean = (10+20+30)/3 = 20.0
    assert all(p == 20.0 for p in preds)


# 7. Chronological training/validation/test boundaries
def test_chronological_evaluation_boundaries():
    dates = pd.date_range("2025-01-01", "2025-12-31", freq="D")
    df = pd.DataFrame({
        "date": dates,
        "store_id": "STORE-01",
        "product_id": "SKU-001",
        "units_sold": 25.0,
    })

    result = evaluate_chronological_holdout(
        df=df,
        train_end_date="2025-10-31",
        test_start_date="2025-11-01",
        test_end_date="2025-12-31",
    )

    assert result["split_boundaries"]["train_end_date"] == "2025-10-31"
    assert result["split_boundaries"]["test_start_date"] == "2025-11-01"
    assert result["split_boundaries"]["test_end_date"] == "2025-12-31"
    # Nov has 30 days, Dec has 31 days -> 61 test days
    assert result["total_test_observations"] == 61


# 8. Prevention of future-data leakage
def test_prevention_of_future_data_leakage():
    # Construct synthetic scenario where test period has massive 1000x surge
    # If the model trained on test data, predictions would be huge.
    # If strictly trained on Jan-Oct, predictions must reflect only Jan-Oct levels.
    train_dates = pd.date_range("2025-01-01", "2025-10-31", freq="D")
    test_dates = pd.date_range("2025-11-01", "2025-12-31", freq="D")

    train_df = pd.DataFrame({
        "date": train_dates,
        "store_id": "STORE-01",
        "product_id": "SKU-001",
        "units_sold": 10.0,
    })
    test_df = pd.DataFrame({
        "date": test_dates,
        "store_id": "STORE-01",
        "product_id": "SKU-001",
        "units_sold": 10000.0,  # massive future spike
    })
    full_df = pd.concat([train_df, test_df], ignore_index=True)

    result = evaluate_chronological_holdout(
        df=full_df,
        train_end_date="2025-10-31",
        test_start_date="2025-11-01",
        test_end_date="2025-12-31",
    )

    # In seasonal naive and moving average, prediction should remain ~10.0, NOT 10,000!
    ma_metric = next(m for m in result["method_metrics"] if m.method == "moving_average_14d")
    # bias = mean(pred - actual) = 10 - 10000 = -9990
    assert ma_metric.bias == pytest.approx(-9990.0, abs=1.0)


# 9. Metric calculations for MAE, RMSE, WAPE, and bias
def test_metric_calculations():
    actual = [10.0, 20.0, 30.0]
    # predicted errors: +2, -5, +3 -> abs errors: 2, 5, 3 -> sum=10, mean=3.3333
    predicted = [12.0, 15.0, 33.0]

    metrics = calculate_metrics(actual, predicted)
    assert metrics["mae"] == pytest.approx(10.0 / 3.0, abs=1e-3)
    # RMSE = sqrt((4 + 25 + 9)/3) = sqrt(38/3) = 3.559
    assert metrics["rmse"] == pytest.approx((38.0 / 3.0) ** 0.5, abs=1e-3)
    # WAPE = sum(abs_err)/sum(act) = 10 / 60 = 0.1667
    assert metrics["wape"] == pytest.approx(10.0 / 60.0, abs=1e-3)
    # bias = sum(pred - act)/3 = (2 - 5 + 3)/3 = 0.0
    assert metrics["bias"] == pytest.approx(0.0, abs=1e-3)


# 10. Zero-total-demand WAPE behavior
def test_zero_total_demand_wape_behavior():
    actual = [0.0, 0.0, 0.0]
    predicted = [1.0, 2.0, 1.0]

    metrics = calculate_metrics(actual, predicted)
    assert metrics["mae"] == pytest.approx(4.0 / 3.0, abs=1e-3)
    assert metrics["wape"] is None  # Undefined division by zero represented explicitly as None


# 11. Deterministic output
def test_deterministic_forecast_output(client):
    payload = {
        "store_id": "STORE-01",
        "product_id": "SKU-001",
        "horizon_days": 14,
        "model_type": "auto",
    }
    r1 = client.post("/api/v1/forecast", json=payload)
    r2 = client.post("/api/v1/forecast", json=payload)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()


# 12. API request/response validation
def test_api_forecast_and_evaluation_endpoints(client):
    # Forecast test
    f_res = client.post(
        "/api/v1/forecast",
        json={"store_id": "STORE-01", "product_id": "SKU-001", "horizon_days": 7},
    )
    assert f_res.status_code == 200
    f_data = ForecastResponse(**f_res.json())
    assert f_data.store_id == "STORE-01"
    assert f_data.horizon_days == 7
    assert len(f_data.forecasts) == 7
    assert all(f.predicted_demand >= 0.0 for f in f_data.forecasts)

    # Evaluation test on single store-product pair for fast validation
    e_res = client.post(
        "/api/v1/evaluate-forecast",
        json={
            "store_id": "STORE-01",
            "product_id": "SKU-001",
            "train_end_date": "2025-10-31",
            "test_start_date": "2025-11-01",
            "test_end_date": "2025-12-31",
        },
    )
    assert e_res.status_code == 200
    e_data = EvaluationResponse(**e_res.json())
    assert e_data.series_evaluated == 1
    assert e_data.total_test_observations == 61
    assert len(e_data.method_metrics) == 4
    assert e_data.is_synthetic_benchmark is True

    # Root alias test (/evaluate-forecast)
    root_alias_res = client.post(
        "/evaluate-forecast",
        json={"store_id": "STORE-01", "product_id": "SKU-001"},
    )
    assert root_alias_res.status_code == 200
