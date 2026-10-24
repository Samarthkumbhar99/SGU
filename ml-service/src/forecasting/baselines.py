"""Baseline demand forecasting models for SupplyShield AI.

Implements:
1. SeasonalNaiveModel: Predicts demand based on same day-of-week from previous week(s).
2. MovingAverageModel: Predicts demand based on recent N-day rolling average.
3. HistoricalAverageModel: Robust fallback taking historical mean.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
import numpy as np
import pandas as pd


class BaseForecaster(ABC):
    """Abstract base class for demand forecasters."""

    @abstractmethod
    def fit(self, history: pd.DataFrame) -> "BaseForecaster":
        """Fit model on historical time series dataframe sorted chronologically."""
        pass

    @abstractmethod
    def predict(self, horizon_days: int) -> List[float]:
        """Generate non-negative daily forecasts for horizon_days."""
        pass


class SeasonalNaiveModel(BaseForecaster):
    """Seasonal Naive model using 7-day weekly seasonality cycle.

    If horizon > 7, repeats the latest full week cycle. If history < 7 days,
    falls back safely to available historical mean.
    """

    def __init__(self, season_length: int = 7):
        self.season_length = season_length
        self._pattern: List[float] = []
        self._fallback_value: float = 0.0

    def fit(self, history: pd.DataFrame) -> "SeasonalNaiveModel":
        if history.empty or "units_sold" not in history.columns:
            self._pattern = []
            self._fallback_value = 0.0
            return self

        sales = history["units_sold"].values
        self._fallback_value = max(0.0, float(np.mean(sales)))

        if len(sales) >= self.season_length:
            # Take the most recent 7 days as the baseline weekly cycle
            recent_cycle = sales[-self.season_length :]
            self._pattern = [max(0.0, float(v)) for v in recent_cycle]
        else:
            self._pattern = [self._fallback_value] * self.season_length

        return self

    def predict(self, horizon_days: int) -> List[float]:
        if horizon_days <= 0:
            return []
        if not self._pattern:
            return [0.0] * horizon_days

        predictions: List[float] = []
        for i in range(horizon_days):
            val = self._pattern[i % self.season_length]
            predictions.append(round(max(0.0, val), 2))
        return predictions


class MovingAverageModel(BaseForecaster):
    """Moving Average model calculating mean demand over a recent window.

    Projects the non-negative rolling mean forward across the horizon.
    """

    def __init__(self, window_days: int = 14):
        self.window_days = max(2, window_days)
        self._pred_value: float = 0.0

    def fit(self, history: pd.DataFrame) -> "MovingAverageModel":
        if history.empty or "units_sold" not in history.columns:
            self._pred_value = 0.0
            return self

        sales = history["units_sold"].values
        recent = sales[-self.window_days :]
        self._pred_value = max(0.0, float(np.mean(recent)))
        return self

    def predict(self, horizon_days: int) -> List[float]:
        if horizon_days <= 0:
            return []
        val = round(self._pred_value, 2)
        return [val] * horizon_days


class HistoricalAverageModel(BaseForecaster):
    """Historical Average baseline model.

    Computes overall historical average demand across all available history.
    Acts as a robust fallback for intermittent, noisy, or short histories.
    """

    def __init__(self):
        self._mean_value: float = 0.0

    def fit(self, history: pd.DataFrame) -> "HistoricalAverageModel":
        if history.empty or "units_sold" not in history.columns:
            self._mean_value = 0.0
            return self

        sales = history["units_sold"].values
        self._mean_value = max(0.0, float(np.mean(sales)))
        return self

    def predict(self, horizon_days: int) -> List[float]:
        if horizon_days <= 0:
            return []
        val = round(self._mean_value, 2)
        return [val] * horizon_days
