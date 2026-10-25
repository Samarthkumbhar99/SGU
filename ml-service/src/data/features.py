"""Leakage-free, reproducible feature engineering module for SupplyShield AI demand forecasting.

All rolling and lag features are strictly computed using historical observations prior to
the prediction timestamp, partitioned by (warehouse_id, sku_id).
"""

from typing import List, Optional, Tuple
import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    # Calendar features
    "day_of_week",
    "day_of_month",
    "month",
    "week_of_year",
    "is_weekend",
    # Historical lags (strictly prior days)
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_28",
    # Rolling window aggregates (shifted by 1 day)
    "rolling_mean_7",
    "rolling_std_7",
    "rolling_mean_14",
    "rolling_std_14",
    "rolling_mean_28",
    # Known commercial & supply attributes
    "promotion_flag",
    "unit_cost",
    "unit_price",
    "gross_margin",
    "supplier_lead_time_days",
    # Categorical entity encodings
    "sku_code",
    "warehouse_code",
    "region_code",
]

TARGET_COLUMN = "units_sold"


def generate_demand_features(
    df: pd.DataFrame,
    drop_na_lags: bool = True,
) -> pd.DataFrame:
    """Generate leakage-free demand forecasting features.

    Args:
        df: Input DataFrame containing canonical columns:
            date, sku_id, warehouse_id, units_sold, promotion_flag,
            unit_cost, unit_price, supplier_lead_time_days.
        drop_na_lags: If True, drop the initial warmup rows (first 28 days)
            where lag_28 is NaN.

    Returns:
        DataFrame enriched with calendar, lag, rolling, and categorical features.
    """
    df_feat = df.copy()

    # Ensure chronological order per entity
    df_feat["date_dt"] = pd.to_datetime(df_feat["date"])
    df_feat = df_feat.sort_values(["warehouse_id", "sku_id", "date_dt"]).reset_index(drop=True)

    # 1. Calendar Features (Known at any time horizon)
    df_feat["day_of_week"] = df_feat["date_dt"].dt.dayofweek.astype(np.int32)
    df_feat["day_of_month"] = df_feat["date_dt"].dt.day.astype(np.int32)
    df_feat["month"] = df_feat["date_dt"].dt.month.astype(np.int32)
    df_feat["week_of_year"] = df_feat["date_dt"].dt.isocalendar().week.astype(np.int32)
    df_feat["is_weekend"] = df_feat["day_of_week"].isin([5, 6]).astype(np.int32)

    # 2. Financial margin
    if "gross_margin" not in df_feat.columns:
        df_feat["gross_margin"] = (df_feat["unit_price"] - df_feat["unit_cost"]).round(2)

    # 3. Categorical Encodings (Consistent deterministic integer codes)
    df_feat["sku_code"] = df_feat["sku_id"].astype("category").cat.codes.astype(np.int32)
    df_feat["warehouse_code"] = df_feat["warehouse_id"].astype("category").cat.codes.astype(np.int32)
    if "region" in df_feat.columns:
        df_feat["region_code"] = df_feat["region"].astype("category").cat.codes.astype(np.int32)
    else:
        df_feat["region_code"] = 0

    # 4. Partitioned Lag and Rolling Features
    # Shifted by 1 so day t can NEVER access day t sales
    grouped = df_feat.groupby(["warehouse_id", "sku_id"])["units_sold"]

    # Point lags
    df_feat["lag_1"] = grouped.shift(1)
    df_feat["lag_7"] = grouped.shift(7)
    df_feat["lag_14"] = grouped.shift(14)
    df_feat["lag_28"] = grouped.shift(28)

    # Rolling statistics: computed strictly over shifted window
    # lag1_series ensures that the current day's observation is excluded from rolling window
    lag1_grouped = df_feat.groupby(["warehouse_id", "sku_id"])["lag_1"]

    df_feat["rolling_mean_7"] = lag1_grouped.rolling(window=7, min_periods=1).mean().reset_index(drop=True)
    df_feat["rolling_std_7"] = lag1_grouped.rolling(window=7, min_periods=1).std().fillna(0.0).reset_index(drop=True)

    df_feat["rolling_mean_14"] = lag1_grouped.rolling(window=14, min_periods=1).mean().reset_index(drop=True)
    df_feat["rolling_std_14"] = lag1_grouped.rolling(window=14, min_periods=1).std().fillna(0.0).reset_index(drop=True)

    df_feat["rolling_mean_28"] = lag1_grouped.rolling(window=28, min_periods=1).mean().reset_index(drop=True)

    if drop_na_lags:
        # Drop rows where 28-day history is not yet established
        df_feat = df_feat.dropna(subset=["lag_28"]).reset_index(drop=True)

    # Clean up temporary date_dt
    df_feat = df_feat.drop(columns=["date_dt"])

    return df_feat


def get_chronological_splits(
    df_feat: pd.DataFrame,
    train_end: str = "2024-09-30",
    val_end: str = "2024-10-31",
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split dataset chronologically into Train, Validation, and Test partitions.

    Strict time-series split with zero lookahead or row shuffling.

    Args:
        df_feat: Feature-enriched DataFrame with 'date' column.
        train_end: Inclusive end date for training partition.
        val_end: Inclusive end date for validation partition.

    Returns:
        (train_df, val_df, test_df)
    """
    train_df = df_feat[df_feat["date"] <= train_end].copy().reset_index(drop=True)
    val_df = (
        df_feat[(df_feat["date"] > train_end) & (df_feat["date"] <= val_end)]
        .copy()
        .reset_index(drop=True)
    )
    test_df = df_feat[df_feat["date"] > val_end].copy().reset_index(drop=True)

    return train_df, val_df, test_df
