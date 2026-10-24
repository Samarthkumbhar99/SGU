"""Evaluation engine for chronological time-series backtesting."""

from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd

from src.forecasting.baselines import HistoricalAverageModel, MovingAverageModel, SeasonalNaiveModel
from src.forecasting.metrics import calculate_metrics
from src.schemas.forecasting import MethodMetrics


def evaluate_chronological_holdout(
    df: pd.DataFrame,
    train_end_date: str = "2025-10-31",
    test_start_date: str = "2025-11-01",
    test_end_date: str = "2025-12-31",
    store_id: Optional[str] = None,
    product_id: Optional[str] = None,
) -> Dict[str, any]:
    """Execute leakage-safe chronological holdout backtest across store-product series.

    Strict chronological separation:
    - Training data: date <= train_end_date. Models are fit ONLY on this period.
    - Test data: test_start_date <= date <= test_end_date.
    - Future actual observations in the test period are NEVER used to fit the models.

    Args:
        df: Full daily demand dataframe containing 'date', 'store_id', 'product_id', 'units_sold'.
        train_end_date: End of training period.
        test_start_date: Start of test holdout period.
        test_end_date: End of test holdout period.
        store_id: Optional filter for specific store.
        product_id: Optional filter for specific SKU.

    Returns:
        Dict with metrics by method, summary counts, and boundaries.
    """
    df = df.copy()
    df["date_str"] = df["date"].astype(str)

    if store_id:
        df = df[df["store_id"] == store_id]
    if product_id:
        df = df[df["product_id"] == product_id]

    series_keys = df[["store_id", "product_id"]].drop_duplicates().values

    # Metric accumulators per method
    actuals: List[float] = []
    preds_snaive: List[float] = []
    preds_ma14: List[float] = []
    preds_ma28: List[float] = []
    preds_hist_avg: List[float] = []

    series_evaluated_count = 0
    total_test_observations = 0

    for s_id, p_id in series_keys:
        series_df = df[(df["store_id"] == s_id) & (df["product_id"] == p_id)].sort_values("date")

        train_df = series_df[series_df["date_str"] <= train_end_date]
        test_df = series_df[(series_df["date_str"] >= test_start_date) & (series_df["date_str"] <= test_end_date)]

        if train_df.empty or test_df.empty:
            continue

        horizon = len(test_df)
        y_test = test_df["units_sold"].values.tolist()

        # 1. Seasonal Naive fit on train only
        m_snaive = SeasonalNaiveModel().fit(train_df)
        p_snaive = m_snaive.predict(horizon)

        # 2. Moving Average 14 days fit on train only
        m_ma14 = MovingAverageModel(window_days=14).fit(train_df)
        p_ma14 = m_ma14.predict(horizon)

        # 3. Moving Average 28 days fit on train only
        m_ma28 = MovingAverageModel(window_days=28).fit(train_df)
        p_ma28 = m_ma28.predict(horizon)

        # 4. Historical Average fit on train only
        m_hist_avg = HistoricalAverageModel().fit(train_df)
        p_hist_avg = m_hist_avg.predict(horizon)

        actuals.extend(y_test)
        preds_snaive.extend(p_snaive)
        preds_ma14.extend(p_ma14)
        preds_ma28.extend(p_ma28)
        preds_hist_avg.extend(p_hist_avg)

        series_evaluated_count += 1
        total_test_observations += horizon

    # Calculate metrics for each baseline method across all evaluated holdout observations
    methods_dict = {
        "seasonal_naive_7d": calculate_metrics(actuals, preds_snaive),
        "moving_average_14d": calculate_metrics(actuals, preds_ma14),
        "moving_average_28d": calculate_metrics(actuals, preds_ma28),
        "historical_average": calculate_metrics(actuals, preds_hist_avg),
    }

    method_metrics_list: List[MethodMetrics] = []
    best_method = "seasonal_naive_7d"
    lowest_wape = float("inf")

    for method_name, metrics in methods_dict.items():
        mm = MethodMetrics(
            method=method_name,
            mae=metrics["mae"],
            rmse=metrics["rmse"],
            wape=metrics["wape"],
            bias=metrics["bias"],
        )
        method_metrics_list.append(mm)
        wape_val = metrics["wape"] if metrics["wape"] is not None else float("inf")
        if wape_val < lowest_wape:
            lowest_wape = wape_val
            best_method = method_name

    return {
        "series_evaluated": series_evaluated_count,
        "total_test_observations": total_test_observations,
        "method_metrics": method_metrics_list,
        "best_method": best_method,
        "split_boundaries": {
            "train_end_date": train_end_date,
            "test_start_date": test_start_date,
            "test_end_date": test_end_date,
        },
    }
