from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from src.config import settings
from src.data.loader import load_dataset_bundle
from src.forecasting.baselines import (
    HistoricalAverageModel,
    MovingAverageModel,
    SeasonalNaiveModel,
)
from src.forecasting.evaluator import evaluate_chronological_holdout
from src.forecasting.features import FEATURE_COLUMNS, build_tabular_features
from src.forecasting.metrics import calculate_metrics
from src.forecasting.ml_models import LightGBMForecaster, XGBoostForecaster, round_forecast_for_ordering
from src.forecasting.model_registry import ModelRegistry
from src.schemas.forecasting import (
    EvaluationRequest,
    EvaluationResponse,
    ForecastItem,
    ForecastRequest,
    ForecastResponse,
    ModelListResponse,
    TrainRequest,
    TrainResponse,
)


class ForecastingService:
    """Coordinates daily demand forecasting, training, evaluation, and registry."""

    def __init__(self, dataset_dir: Optional[Path] = None, models_dir: Optional[Path] = None):
        self.dataset_dir = Path(dataset_dir or settings.dataset_dir)
        self.registry = ModelRegistry(models_dir or settings.models_dir)

    def _get_daily_demand(self) -> pd.DataFrame:
        """Load historical demand records from primary CSV or demo bundle."""
        # 1. Try primary supply_chain_dataset1.csv
        csv_path = settings.dataset_csv_path
        if not csv_path.exists():
            csv_path = self.dataset_dir / "supply_chain_dataset1.csv"
        if not csv_path.exists():
            csv_path = self.dataset_dir.parent / "data" / "supply_chain_dataset1.csv"

        if csv_path.exists():
            df = pd.read_csv(csv_path)
            # Create dual-compatibility aliases
            df["date"] = df["Date"]
            df["sku_id"] = df["SKU_ID"]
            df["warehouse_id"] = df["Warehouse_ID"]
            df["product_id"] = df["SKU_ID"]
            df["store_id"] = df["Warehouse_ID"]
            df["units_sold"] = df["Units_Sold"]
            df["promotion_flag"] = df["Promotion_Flag"]
            df["stockout_flag"] = df["Stockout_Flag"]
            return df

        # 2. Fallback to bundle loader
        bundle = load_dataset_bundle(self.dataset_dir)
        if bundle.daily_demand is not None:
            df = bundle.daily_demand.copy()
            df["Date"] = df["date"]
            df["SKU_ID"] = df.get("sku_id", df.get("product_id"))
            df["Warehouse_ID"] = df.get("warehouse_id", df.get("store_id"))
            df["Units_Sold"] = df["units_sold"]
            df["Promotion_Flag"] = df.get("promotion_flag", 0)
            df["Stockout_Flag"] = df.get("stockout_flag", 0)
            return df

        raise FileNotFoundError("Could not find supply_chain_dataset1.csv or daily_demand.csv.")

    def train_model(self, req: TrainRequest) -> TrainResponse:
        """Train and persist versioned forecaster artifact with holdout validation."""
        df = self._get_daily_demand()

        # Build leakage-safe tabular features
        feat_df = build_tabular_features(df)
        clean_df = feat_df.dropna(subset=["lag_28", "rolling_mean_28", "rolling_std_28"]).copy()

        # Chronological splits
        train_mask = clean_df["Date"] <= pd.to_datetime("2024-11-04")
        val_mask = (clean_df["Date"] >= pd.to_datetime("2024-11-05")) & (clean_df["Date"] <= pd.to_datetime("2024-12-02"))
        test_mask = clean_df["Date"] >= pd.to_datetime("2024-12-03")

        train_df = clean_df[train_mask]
        val_df = clean_df[val_mask]
        test_df = clean_df[test_mask]

        X_train, y_train = train_df[FEATURE_COLUMNS], train_df["Units_Sold"]
        X_val, y_val = val_df[FEATURE_COLUMNS], val_df["Units_Sold"]
        X_test, y_test = test_df[FEATURE_COLUMNS], test_df["Units_Sold"]

        model_name = req.model_type
        if model_name == "lightgbm":
            forecaster = LightGBMForecaster(n_estimators=120, learning_rate=0.05)
        elif model_name == "xgboost":
            forecaster = XGBoostForecaster(n_estimators=120, learning_rate=0.05)
        else:
            forecaster = LightGBMForecaster(n_estimators=120, learning_rate=0.05)
            model_name = "lightgbm"

        # Fit forecaster on training split
        forecaster.fit(X_train, y_train)

        # Validation split metrics
        val_preds = forecaster.predict(X_val)
        val_metrics = calculate_metrics(y_val.values, val_preds)

        # Holdout test metrics
        test_preds = forecaster.predict(X_test)
        holdout_metrics = calculate_metrics(y_test.values, test_preds)

        # Version string
        version_str = f"v_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"


        metadata = {
            "validation_metrics": val_metrics,
            "holdout_metrics": holdout_metrics,
            "training_cutoff_date": "2024-11-04",
            "training_data_range": f"{train_df['Date'].min().strftime('%Y-%m-%d')} to 2024-11-04",
            "validation_configuration": {
                "validation_split": "2024-11-05 to 2024-12-02",
                "holdout_split": "2024-12-03 to 2024-12-30",
            },
        }

        # Persist and validate artifact
        artifact_path = self.registry.save_model(
            model_obj=forecaster,
            model_name=model_name,
            model_version=version_str,
            metadata=metadata,
            set_active=req.set_active,
        )

        return TrainResponse(
            success=True,
            model_name=model_name,
            model_version=version_str,
            training_cutoff_date="2024-11-04",
            train_observations=len(train_df),
            validation_metrics=val_metrics,
            holdout_metrics=holdout_metrics,
            artifact_path=str(artifact_path),
            is_active=req.set_active,
        )

    def generate_forecast(self, req: ForecastRequest) -> ForecastResponse:
        """Generate non-negative daily demand predictions for requested SKU and warehouse."""
        df = self._get_daily_demand()

        sku = req.sku_id or req.product_id
        wh = req.warehouse_id or req.store_id

        # Filter to requested series
        series_df = df[(df["SKU_ID"] == sku) & (df["Warehouse_ID"] == wh)].sort_values("Date").reset_index(drop=True)
        if series_df.empty:
            raise ValueError(f"No historical demand records found for SKU '{sku}' and Warehouse '{wh}'.")

        warnings: List[str] = [
            "Stockout_Flag is 0 in source dataset; Units_Sold reflects observed sales rather than unconstrained demand."
        ]

        # Origin date
        last_date = pd.to_datetime(series_df["Date"].max())
        last_date_str = last_date.strftime("%Y-%m-%d")

        model_version: Optional[str] = None
        applied_name = req.model_type
        validation_metadata: Optional[Dict[str, Any]] = None
        predicted_values: List[float] = []

        # Route by model type
        if req.model_type in ["lightgbm", "xgboost", "auto"]:
            try:
                # Try loading registered active model
                model_obj, meta = self.registry.load_model(req.model_version or "active")
                model_version = meta.get("model_version")
                applied_name = meta.get("model_name", "lightgbm")
                validation_metadata = meta.get("holdout_metrics")

                # Build forward feature rows recursively for horizon
                recent_sales = series_df["Units_Sold"].values[-28:].tolist()
                lead_time = float(series_df["Supplier_Lead_Time_Days"].iloc[-1]) if "Supplier_Lead_Time_Days" in series_df.columns else 7.0

                for step in range(1, req.horizon_days + 1):
                    f_date = last_date + timedelta(days=step)
                    dow = f_date.dayofweek
                    doy = f_date.dayofyear
                    is_wknd = 1 if dow in [5, 6] else 0
                    m_val = f_date.month
                    m_sin = float(np.sin(2 * np.pi * m_val / 12.0))
                    m_cos = float(np.cos(2 * np.pi * m_val / 12.0))

                    # Lags from recent buffer
                    l1 = recent_sales[-1]
                    l7 = recent_sales[-7] if len(recent_sales) >= 7 else recent_sales[-1]
                    l14 = recent_sales[-14] if len(recent_sales) >= 14 else recent_sales[-1]
                    l28 = recent_sales[-28] if len(recent_sales) >= 28 else recent_sales[-1]

                    rm7 = float(np.mean(recent_sales[-7:]))
                    rm14 = float(np.mean(recent_sales[-14:]))
                    rm28 = float(np.mean(recent_sales[-28:]))
                    rs7 = float(np.std(recent_sales[-7:])) if len(recent_sales) >= 7 else 0.0
                    rs28 = float(np.std(recent_sales[-28:])) if len(recent_sales) >= 28 else 0.0

                    row_dict = {
                        "dayofweek": dow,
                        "dayofyear": doy,
                        "is_weekend": is_wknd,
                        "month_sin": m_sin,
                        "month_cos": m_cos,
                        "lag_1": l1,
                        "lag_7": l7,
                        "lag_14": l14,
                        "lag_28": l28,
                        "rolling_mean_7": rm7,
                        "rolling_mean_14": rm14,
                        "rolling_mean_28": rm28,
                        "rolling_std_7": rs7,
                        "rolling_std_28": rs28,
                        "Promotion_Flag": 0,
                        "Supplier_Lead_Time_Days": lead_time,
                    }
                    X_step = pd.DataFrame([row_dict])
                    p_val = float(model_obj.predict(X_step)[0])
                    predicted_values.append(round(max(0.0, p_val), 2))
                    recent_sales.append(p_val)

            except Exception as e:
                # Fallback to Seasonal Naive baseline if ML model is not available
                applied_name = "seasonal_naive_fallback"
                warnings.append(f"ML artifact load bypassed ({str(e)}). Fell back to Seasonal Naive baseline.")
                model = SeasonalNaiveModel(season_length=7).fit(series_df)
                predicted_values = model.predict(req.horizon_days)

        elif req.model_type == "seasonal_naive":
            model = SeasonalNaiveModel(season_length=7).fit(series_df)
            predicted_values = model.predict(req.horizon_days)
            applied_name = "seasonal_naive_7d"

        elif req.model_type == "moving_average":
            win = req.window_days or 7
            model = MovingAverageModel(window_days=win).fit(series_df)
            predicted_values = model.predict(req.horizon_days)
            applied_name = f"moving_average_{win}d"

        else:
            model = HistoricalAverageModel().fit(series_df)
            predicted_values = model.predict(req.horizon_days)
            applied_name = "historical_average"

        # Build forecast items
        forecast_items: List[ForecastItem] = []
        for step, val in enumerate(predicted_values, start=1):
            f_date_str = (last_date + timedelta(days=step)).strftime("%Y-%m-%d")
            ord_round = round_forecast_for_ordering(val, policy=req.rounding_policy)
            forecast_items.append(
                ForecastItem(
                    date=f_date_str,
                    predicted_demand=val,
                    order_quantity_round=ord_round,
                )
            )

        return ForecastResponse(
            sku_id=sku,
            warehouse_id=wh,
            product_id=sku,
            store_id=wh,
            forecast_origin=last_date_str,
            horizon_days=req.horizon_days,
            model_applied=applied_name,
            model_version=model_version,
            selection_metric="Chronological holdout MAE" if validation_metadata else None,
            selection_score=validation_metadata.get("mae") if validation_metadata else None,
            forecasts=forecast_items,
            validation_metadata=validation_metadata,
            warnings=warnings,
        )

    def evaluate_forecasts(self, req: EvaluationRequest) -> EvaluationResponse:
        """Run chronological backtest evaluation across series on holdout test set."""
        df = self._get_daily_demand()

        results = evaluate_chronological_holdout(
            df=df,
            train_end_date=req.train_end_date,
            test_start_date=req.test_start_date,
            test_end_date=req.test_end_date,
            sku_id=req.sku_id,
            warehouse_id=req.warehouse_id,
            include_ml_models=req.include_ml_models,
        )

        warnings: List[str] = [
            "Evaluated on observed Units_Sold. Unconstrained true demand during stockout periods is unobservable in this dataset.",
            "Demand_Forecast was excluded from model features due to contemporaneous synthetic target leakage.",
        ]

        return EvaluationResponse(
            target_evaluated="Units_Sold (observed demand)",
            is_synthetic_benchmark=False,
            split_boundaries=results["split_boundaries"],
            holdout_dates=results["holdout_dates"],
            series_evaluated=results["series_evaluated"],
            total_test_observations=results["total_test_observations"],
            method_metrics=results["method_metrics"],
            best_method=results["best_method"],
            warnings=warnings,
        )

    def list_models(self) -> ModelListResponse:
        """List registered model versions."""
        active_ver = None
        if self.registry.active_file.exists():
            import json
            try:
                with open(self.registry.active_file, "r") as f:
                    active_ver = json.load(f).get("active_version")
            except Exception:
                pass

        models = self.registry.list_models()
        return ModelListResponse(success=True, active_version=active_ver, models=models)
