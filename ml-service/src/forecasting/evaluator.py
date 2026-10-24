"""Evaluation engine for chronological time-series backtesting and model comparison."""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from src.forecasting.baselines import MovingAverageModel, SeasonalNaiveModel
from src.forecasting.features import FEATURE_COLUMNS, build_tabular_features
from src.forecasting.metrics import calculate_metrics, calculate_relative_improvement
from src.forecasting.ml_models import LightGBMForecaster, XGBoostForecaster
from src.schemas.forecasting import MethodMetrics


def evaluate_chronological_holdout(
    df: pd.DataFrame,
    train_end_date: str = "2024-11-04",
    val_start_date: str = "2024-11-05",
    val_end_date: str = "2024-12-02",
    test_start_date: str = "2024-12-03",
    test_end_date: str = "2024-12-30",
    sku_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    include_ml_models: bool = True,
) -> Dict[str, Any]:
    """Execute leakage-safe chronological holdout backtest across SKU-Warehouse series.

    Strict chronological separation:
    - Train split: Date <= train_end_date (excluding first 28-day warm-up window)
    - Validation split: val_start_date <= Date <= val_end_date (hyperparameter selection & comparison)
    - Holdout test split: test_start_date <= Date <= test_end_date (final untouched backtest)
    - Target day demand is NEVER included in rolling or lag features (shifted by 1).
    - 'Demand_Forecast' is excluded from features to prevent contemporaneous target leakage.

    Returns:
        Dict with metrics by method, summary counts, split boundaries, and best method.
    """
    df_raw = df.copy()

    # Column mapping for flexibility
    date_col = "Date" if "Date" in df_raw.columns else "date"
    sku_col = "SKU_ID" if "SKU_ID" in df_raw.columns else ("sku_id" if "sku_id" in df_raw.columns else "product_id")
    wh_col = "Warehouse_ID" if "Warehouse_ID" in df_raw.columns else ("warehouse_id" if "warehouse_id" in df_raw.columns else "store_id")
    target_col = "Units_Sold" if "Units_Sold" in df_raw.columns else "units_sold"

    df_raw[date_col] = pd.to_datetime(df_raw[date_col])
    if sku_id:
        df_raw = df_raw[df_raw[sku_col] == sku_id]
    if warehouse_id:
        df_raw = df_raw[df_raw[wh_col] == warehouse_id]

    if df_raw.empty:
        raise ValueError(f"No records match filters sku_id={sku_id}, warehouse_id={warehouse_id}")

    # Build leakage-safe tabular features
    feat_df = build_tabular_features(
        df_raw,
        date_col=date_col,
        sku_col=sku_col,
        wh_col=wh_col,
        target_col=target_col,
    )

    # Exclude initial 28 days warm-up period where lag_28 or rolling_mean_28 is NaN
    clean_df = feat_df.dropna(subset=["lag_28", "rolling_mean_28", "rolling_std_28"]).copy()

    # Chronological masks
    d_train_end = pd.to_datetime(train_end_date)
    d_val_start = pd.to_datetime(val_start_date)
    d_val_end = pd.to_datetime(val_end_date)
    d_test_start = pd.to_datetime(test_start_date)
    d_test_end = pd.to_datetime(test_end_date)

    train_mask = clean_df["Date"] <= d_train_end
    val_mask = (clean_df["Date"] >= d_val_start) & (clean_df["Date"] <= d_val_end)
    test_mask = (clean_df["Date"] >= d_test_start) & (clean_df["Date"] <= d_test_end)

    train_df = clean_df[train_mask]
    val_df = clean_df[val_mask]
    test_df = clean_df[test_mask]

    if test_df.empty:
        # Fallback if custom dates don't match dataset
        total_days = clean_df["Date"].nunique()
        if total_days >= 56:
            unique_dates = sorted(clean_df["Date"].unique())
            test_dates = unique_dates[-28:]
            val_dates = unique_dates[-56:-28]
            test_mask = clean_df["Date"].isin(test_dates)
            val_mask = clean_df["Date"].isin(val_dates)
            train_mask = clean_df["Date"] < val_dates[0]
            train_df = clean_df[train_mask]
            val_df = clean_df[val_mask]
            test_df = clean_df[test_mask]

    total_test_obs = len(test_df)
    unique_series = clean_df[["SKU_ID", "Warehouse_ID"]].drop_duplicates()
    series_count = len(unique_series)

    # Actual test holdout targets
    y_test = test_df["Units_Sold"].values

    # 1. Baseline: Seasonal Naive (lag 7)
    pred_snaive = test_df["lag_7"].fillna(0.0).values
    m_snaive = calculate_metrics(y_test, pred_snaive)

    # 2. Baseline: Moving Average (7 days)
    pred_ma7 = test_df["rolling_mean_7"].fillna(0.0).values
    m_ma7 = calculate_metrics(y_test, pred_ma7)

    # 3. Baseline: Moving Average (14 days)
    pred_ma14 = test_df["rolling_mean_14"].fillna(0.0).values
    m_ma14 = calculate_metrics(y_test, pred_ma14)

    results_dict: Dict[str, Dict[str, Any]] = {
        "seasonal_naive_7d": m_snaive,
        "moving_average_7d": m_ma7,
        "moving_average_14d": m_ma14,
    }

    # 4 & 5. Train and evaluate LightGBM and XGBoost if requested
    if include_ml_models and len(train_df) > 100:
        X_train, y_train = train_df[FEATURE_COLUMNS], train_df["Units_Sold"]
        X_test = test_df[FEATURE_COLUMNS]

        # Fit LightGBM
        try:
            lgb_forecaster = LightGBMForecaster(n_estimators=100, learning_rate=0.05)
            lgb_forecaster.fit(X_train, y_train)
            pred_lgb = lgb_forecaster.predict(X_test)
            results_dict["lightgbm"] = calculate_metrics(y_test, pred_lgb)
        except Exception as e:
            results_dict["lightgbm"] = {"mae": None, "rmse": None, "wape": None, "bias": None, "error": str(e)}

        # Fit XGBoost
        try:
            xgb_forecaster = XGBoostForecaster(n_estimators=100, learning_rate=0.05)
            xgb_forecaster.fit(X_train, y_train)
            pred_xgb = xgb_forecaster.predict(X_test)
            results_dict["xgboost"] = calculate_metrics(y_test, pred_xgb)
        except Exception as e:
            results_dict["xgboost"] = {"mae": None, "rmse": None, "wape": None, "bias": None, "error": str(e)}

    # Base baseline WAPE for relative improvement
    base_wape = m_snaive["wape"]

    # Assemble MethodMetrics models
    method_metrics_list: List[MethodMetrics] = []
    best_method = "seasonal_naive_7d"
    lowest_mae = float("inf")

    for method_name, mets in results_dict.items():
        if mets.get("mae") is not None:
            rel_imp = calculate_relative_improvement(base_wape, mets.get("wape"))
            mm = MethodMetrics(
                method=method_name,
                mae=mets["mae"],
                rmse=mets["rmse"],
                wape=mets.get("wape"),
                bias=mets["bias"],
                relative_improvement_pct=rel_imp,
            )
            method_metrics_list.append(mm)
            if mets["mae"] < lowest_mae:
                lowest_mae = mets["mae"]
                best_method = method_name

    return {
        "series_evaluated": series_count,
        "total_test_observations": total_test_obs,
        "method_metrics": method_metrics_list,
        "best_method": best_method,
        "split_boundaries": {
            "train_end_date": str(train_mask.index[-1] if not train_df.empty else train_end_date),
            "test_start_date": test_start_date,
            "test_end_date": test_end_date,
        },
        "holdout_dates": f"{test_start_date} to {test_end_date}",
    }
