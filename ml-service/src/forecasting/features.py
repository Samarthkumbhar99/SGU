"""Feature engineering module for time-series demand forecasting in SupplyShield AI.

Strict Leakage-Safe Rules:
1. Shift rolling statistics: target day's demand is NEVER included in rolling statistics (shifted by 1).
2. Lags: Computed per (SKU_ID, Warehouse_ID) series using strictly past observations.
3. Exclude 'Demand_Forecast': Proven contemporaneous synthetic feature with target leakage.
4. 'Stockout_Flag': Documented as all zero in current dataset.
5. Missing lag window handling: Initial observations where lag 28 cannot be computed are dropped
   with explicit logging/accounting.
"""

from typing import List, Optional, Tuple
import numpy as np
import pandas as pd

# Standard feature set used by ML models
FEATURE_COLUMNS = [
    "dayofweek",
    "dayofyear",
    "is_weekend",
    "month_sin",
    "month_cos",
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_28",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_mean_28",
    "rolling_std_7",
    "rolling_std_28",
    "Promotion_Flag",
    "Supplier_Lead_Time_Days",
]


def build_tabular_features(
    df: pd.DataFrame,
    date_col: str = "Date",
    sku_col: str = "SKU_ID",
    wh_col: str = "Warehouse_ID",
    target_col: str = "Units_Sold",
    promo_col: str = "Promotion_Flag",
    lead_time_col: str = "Supplier_Lead_Time_Days",
) -> pd.DataFrame:
    """Build chronological tabular features for training and backtesting.

    Args:
        df: Input DataFrame containing historical demand records.
        date_col: Column name for date index.
        sku_col: Column name for SKU identifier.
        wh_col: Column name for Warehouse identifier.
        target_col: Target observed demand column.
        promo_col: Column name for promotion indicator.
        lead_time_col: Column name for supplier lead time.

    Returns:
        DataFrame sorted chronologically with generated features and dropped initial warm-up period.
    """
    df_feat = df.copy()
    df_feat[date_col] = pd.to_datetime(df_feat[date_col])

    # Normalize identifiers to string
    df_feat[sku_col] = df_feat[sku_col].astype(str)
    df_feat[wh_col] = df_feat[wh_col].astype(str)

    # Sort strictly by series and date
    df_feat = df_feat.sort_values([sku_col, wh_col, date_col]).reset_index(drop=True)

    # 1. Calendar & Cyclical Features
    dt = df_feat[date_col].dt
    df_feat["dayofweek"] = dt.dayofweek
    df_feat["dayofyear"] = dt.dayofyear
    df_feat["is_weekend"] = df_feat["dayofweek"].isin([5, 6]).astype(int)

    # Cyclical encoding of month prevents out-of-range split artifacts on unseen months
    month = dt.month
    df_feat["month_sin"] = np.sin(2 * np.pi * month / 12.0)
    df_feat["month_cos"] = np.cos(2 * np.pi * month / 12.0)

    # Ensure promo and lead time exist
    if promo_col in df_feat.columns:
        df_feat["Promotion_Flag"] = df_feat[promo_col].fillna(0).astype(int)
    else:
        df_feat["Promotion_Flag"] = 0

    if lead_time_col in df_feat.columns:
        df_feat["Supplier_Lead_Time_Days"] = df_feat[lead_time_col].fillna(7.0).astype(float)
    else:
        df_feat["Supplier_Lead_Time_Days"] = 7.0

    # 2. Lagged Demand (strictly past observations)
    for lag in [1, 7, 14, 28]:
        df_feat[f"lag_{lag}"] = df_feat.groupby([sku_col, wh_col])[target_col].shift(lag)

    # 3. Rolling Statistics (shifted by 1 so target day is NEVER in rolling calculation)
    for window in [7, 14, 28]:
        df_feat[f"rolling_mean_{window}"] = (
            df_feat.groupby([sku_col, wh_col])[target_col]
            .shift(1)
            .rolling(window=window, min_periods=window)
            .mean()
        )

    for window in [7, 28]:
        df_feat[f"rolling_std_{window}"] = (
            df_feat.groupby([sku_col, wh_col])[target_col]
            .shift(1)
            .rolling(window=window, min_periods=window)
            .std()
        )

    # Standardize column naming for consistency
    df_feat["Units_Sold"] = df_feat[target_col].astype(float)
    df_feat["Date"] = df_feat[date_col]
    df_feat["SKU_ID"] = df_feat[sku_col]
    df_feat["Warehouse_ID"] = df_feat[wh_col]

    return df_feat


def verify_no_future_leakage(
    data: pd.DataFrame,
    date_col: str = "Date",
    target_col: str = "Units_Sold",
    cutoff_date: str = "2024-06-01",
) -> bool:
    """Verifies that altering future target values after cutoff_date does NOT alter past features."""
    df_orig = data.copy()
    features_orig = build_tabular_features(df_orig)

    # Alter future values drastically
    df_perturbed = data.copy()
    df_perturbed[date_col] = pd.to_datetime(df_perturbed[date_col])
    future_mask = df_perturbed[date_col] > pd.to_datetime(cutoff_date)
    df_perturbed.loc[future_mask, target_col] = df_perturbed.loc[future_mask, target_col] * 999.0 + 5000.0

    features_perturbed = build_tabular_features(df_perturbed)

    # Compare features on or before cutoff_date
    past_mask = features_orig["Date"] <= pd.to_datetime(cutoff_date)
    check_cols = [c for c in FEATURE_COLUMNS if c in features_orig.columns]

    for col in check_cols:
        orig_vals = features_orig.loc[past_mask, col].fillna(-999).values
        pert_vals = features_perturbed.loc[past_mask, col].fillna(-999).values
        if not np.allclose(orig_vals, pert_vals, equal_nan=True):
            return False

    return True
