"""Forecasting metrics module calculating MAE, RMSE, WAPE, and signed bias."""

from typing import Dict, List, Optional
import numpy as np


def calculate_metrics(y_true: List[float], y_pred: List[float]) -> Dict[str, Optional[float]]:
    """Compute standard retail forecasting metrics.

    Args:
        y_true: Actual demand values.
        y_pred: Predicted demand values.

    Returns:
        Dict containing 'mae', 'rmse', 'wape', and 'bias'.
    """
    actual = np.asarray(y_true, dtype=float)
    predicted = np.asarray(y_pred, dtype=float)

    if len(actual) == 0:
        return {"mae": 0.0, "rmse": 0.0, "wape": None, "bias": 0.0}

    errors = predicted - actual
    abs_errors = np.abs(errors)

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    bias = float(np.mean(errors))

    sum_actual = float(np.sum(actual))
    if sum_actual > 0.0:
        wape = float(np.sum(abs_errors) / sum_actual)
    else:
        # Documented behavior: When total actual demand is zero, WAPE is mathematically undefined
        wape = None

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 4) if wape is not None else None,
        "bias": round(bias, 4),
    }


def calculate_relative_improvement(
    baseline_wape: Optional[float],
    candidate_wape: Optional[float],
) -> Optional[float]:
    """Calculate percentage improvement in WAPE relative to baseline model.

    Formula: ((baseline_wape - candidate_wape) / baseline_wape) * 100%
    Positive value indicates candidate is better than baseline.
    """
    if baseline_wape is None or candidate_wape is None or baseline_wape <= 0.0:
        return None
    return round(((baseline_wape - candidate_wape) / baseline_wape) * 100.0, 2)

