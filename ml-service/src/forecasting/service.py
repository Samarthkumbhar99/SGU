"""Demand forecasting service coordinator with auto-selection and evaluation."""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd

from src.data.loader import load_dataset_bundle
from src.forecasting.baselines import (
    BaseForecaster,
    HistoricalAverageModel,
    MovingAverageModel,
    SeasonalNaiveModel,
)
from src.forecasting.evaluator import evaluate_chronological_holdout
from src.forecasting.metrics import calculate_metrics
from src.schemas.forecasting import (
    EvaluationRequest,
    EvaluationResponse,
    ForecastItem,
    ForecastRequest,
    ForecastResponse,
)


class ForecastingService:
    """Coordinates daily demand forecasting and model evaluation."""

    def __init__(self, dataset_dir: Path, daily_demand: Optional[pd.DataFrame] = None):
        self.dataset_dir = dataset_dir
        self._daily_demand = daily_demand
        self._series_cache: Optional[Dict[Tuple[str, str], pd.DataFrame]] = None

    def _get_daily_demand(self) -> pd.DataFrame:
        """Load daily demand from dataset bundle, reusing cached instance data."""
        if self._daily_demand is None:
            bundle = load_dataset_bundle(self.dataset_dir)
            if bundle.daily_demand is None:
                raise FileNotFoundError("daily_demand.csv could not be loaded from dataset directory.")
            self._daily_demand = bundle.daily_demand
        return self._daily_demand

    def _get_series(self, store_id: str, product_id: str) -> pd.DataFrame:
        """Efficiently fetch store-product series using a pre-grouped index."""
        if self._series_cache is None:
            df = self._get_daily_demand()
            self._series_cache = {
                (str(s), str(p)): group.sort_values("date")
                for (s, p), group in df.groupby(["store_id", "product_id"])
            }
        return self._series_cache.get((store_id, product_id), pd.DataFrame())

    def _select_best_model_on_validation(
        self,
        series_history: pd.DataFrame,
        val_days: int = 14,
    ) -> Tuple[BaseForecaster, str, float]:
        """Select best baseline model using a chronological validation window from history.

        Uses the most recent val_days of available history as the validation set,
        and trains candidate models on all preceding days.
        """
        if len(series_history) < val_days * 2:
            # If history is too short for split, default to SeasonalNaive
            model = SeasonalNaiveModel().fit(series_history)
            return model, "seasonal_naive", 0.0

        train_part = series_history.iloc[:-val_days]
        val_part = series_history.iloc[-val_days:]
        actual_val = val_part["units_sold"].values.tolist()

        candidates = {
            "seasonal_naive": SeasonalNaiveModel().fit(train_part),
            "moving_average_14d": MovingAverageModel(window_days=14).fit(train_part),
            "historical_average": HistoricalAverageModel().fit(train_part),
        }

        best_model_name = "seasonal_naive"
        best_score = float("inf")

        for name, model in candidates.items():
            preds = model.predict(val_days)
            score = calculate_metrics(actual_val, preds)["mae"]
            if score < best_score:
                best_score = score
                best_model_name = name

        # Refit winning architecture on full available history
        if best_model_name == "seasonal_naive":
            final_model = SeasonalNaiveModel().fit(series_history)
        elif best_model_name == "moving_average_14d":
            final_model = MovingAverageModel(window_days=14).fit(series_history)
        else:
            final_model = HistoricalAverageModel().fit(series_history)

        return final_model, best_model_name, best_score

    def generate_forecast(self, req: ForecastRequest) -> ForecastResponse:
        # Validate identifiers via pre-indexed series cache
        series_df = self._get_series(req.store_id, req.product_id)
        if series_df.empty:
            raise ValueError(f"No historical demand records found for store '{req.store_id}' and product '{req.product_id}'.")

        warnings: List[str] = []

        # Check for stockout days in history
        stockouts_count = int(series_df["stockout_flag"].sum())
        if stockouts_count > 0:
            warnings.append(
                f"Historical series contains {stockouts_count} stockout day(s) where observed sales were censored."
            )

        # Determine last date in history
        last_date_str = str(series_df["date"].max())
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()

        selection_metric: Optional[str] = None
        selection_score: Optional[float] = None

        # Model selection & fitting
        if req.model_type == "auto":
            model, applied_name, score = self._select_best_model_on_validation(series_df)
            selection_metric = "MAE on 14-day chronological validation split"
            selection_score = score
        elif req.model_type == "seasonal_naive":
            model = SeasonalNaiveModel().fit(series_df)
            applied_name = "seasonal_naive"
        elif req.model_type == "moving_average":
            win = req.window_days or 14
            model = MovingAverageModel(window_days=win).fit(series_df)
            applied_name = f"moving_average_{win}d"
        elif req.model_type == "historical_average":
            model = HistoricalAverageModel().fit(series_df)
            applied_name = "historical_average"
        else:
            raise ValueError(f"Unknown model_type '{req.model_type}'.")

        # Generate forecasts
        predicted_values = model.predict(req.horizon_days)

        # Assemble daily forecast items with continuous forward dates
        forecast_items: List[ForecastItem] = []
        for step, val in enumerate(predicted_values, start=1):
            f_date = (last_date + timedelta(days=step)).strftime("%Y-%m-%d")
            forecast_items.append(ForecastItem(date=f_date, predicted_demand=val))

        return ForecastResponse(
            store_id=req.store_id,
            product_id=req.product_id,
            forecast_origin=last_date_str,
            horizon_days=req.horizon_days,
            model_applied=applied_name,
            selection_metric=selection_metric,
            selection_score=round(selection_score, 4) if selection_score is not None else None,
            forecasts=forecast_items,
            warnings=warnings,
        )

    def evaluate_forecasts(self, req: EvaluationRequest) -> EvaluationResponse:
        """Run chronological backtest evaluation across series on holdout test set."""
        df = self._get_daily_demand()

        # Validate filters if provided
        if req.store_id and req.store_id not in df["store_id"].values:
            raise ValueError(f"Store '{req.store_id}' not found in dataset.")
        if req.product_id and req.product_id not in df["product_id"].values:
            raise ValueError(f"Product '{req.product_id}' not found in dataset.")

        results = evaluate_chronological_holdout(
            df=df,
            train_end_date=req.train_end_date,
            test_start_date=req.test_start_date,
            test_end_date=req.test_end_date,
            store_id=req.store_id,
            product_id=req.product_id,
        )

        warnings: List[str] = [
            "Evaluation performed on observed 'units_sold'. Stockout days were not unconstrained demand."
        ]

        return EvaluationResponse(
            target_evaluated="units_sold",
            is_synthetic_benchmark=True,
            split_boundaries=results["split_boundaries"],
            series_evaluated=results["series_evaluated"],
            total_test_observations=results["total_test_observations"],
            method_metrics=results["method_metrics"],
            best_method=results["best_method"],
            warnings=warnings,
        )
