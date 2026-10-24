"""Machine Learning forecasters (LightGBM and XGBoost) for SupplyShield AI."""

import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from src.forecasting.features import FEATURE_COLUMNS


def round_forecast_for_ordering(val: float, policy: str = "round") -> int:
    """Documented integer rounding policy for inventory order quantities.

    Args:
        val: Continuous point forecast.
        policy: 'round' (standard nearest integer half-up) or 'ceil' (conservative buffer).

    Returns:
        Non-negative integer units.
    """
    clipped = max(0.0, float(val))
    if policy == "ceil":
        return int(math.ceil(clipped))
    return int(round(clipped))


class LightGBMForecaster:
    """LightGBM regressor with robust fallback to Ridge regression if lightgbm is missing."""

    def __init__(
        self,
        n_estimators: int = 150,
        learning_rate: float = 0.05,
        max_depth: int = 6,
        num_leaves: int = 31,
        random_state: int = 42,
    ):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.num_leaves = num_leaves
        self.random_state = random_state
        self.feature_columns = FEATURE_COLUMNS

        if HAS_LIGHTGBM:
            self.model = lgb.LGBMRegressor(
                n_estimators=self.n_estimators,
                learning_rate=self.learning_rate,
                max_depth=self.max_depth,
                num_leaves=self.num_leaves,
                random_state=self.random_state,
                verbose=-1,
            )
            self.model_type = "LightGBM"
        else:
            self.model = Ridge(alpha=1.0, random_state=self.random_state)
            self.model_type = "RidgeFallback"

        self.is_fitted = False

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "LightGBMForecaster":
        """Fit model on feature matrix and target."""
        X_clean = X[self.feature_columns].fillna(0.0)
        self.model.fit(X_clean, y)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Generate non-negative predictions."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict.")
        X_clean = X[self.feature_columns].fillna(0.0)
        raw_preds = self.model.predict(X_clean)
        return np.maximum(0.0, np.round(raw_preds, 2))


class XGBoostForecaster:
    """XGBoost regressor with fallback to Ridge regression if xgboost is missing."""

    def __init__(
        self,
        n_estimators: int = 150,
        learning_rate: float = 0.05,
        max_depth: int = 6,
        random_state: int = 42,
    ):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.random_state = random_state
        self.feature_columns = FEATURE_COLUMNS

        if HAS_XGBOOST:
            self.model = xgb.XGBRegressor(
                n_estimators=self.n_estimators,
                learning_rate=self.learning_rate,
                max_depth=self.max_depth,
                random_state=self.random_state,
            )
            self.model_type = "XGBoost"
        else:
            self.model = Ridge(alpha=1.0, random_state=self.random_state)
            self.model_type = "RidgeFallback"

        self.is_fitted = False

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "XGBoostForecaster":
        """Fit model on feature matrix and target."""
        X_clean = X[self.feature_columns].fillna(0.0)
        self.model.fit(X_clean, y)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Generate non-negative predictions."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict.")
        X_clean = X[self.feature_columns].fillna(0.0)
        raw_preds = self.model.predict(X_clean)
        return np.maximum(0.0, np.round(raw_preds, 2))
