import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


import joblib
import numpy as np
import pandas as pd

from src.config import settings
from src.forecasting.features import FEATURE_COLUMNS


class ModelRegistry:
    """Manages disk-based versioned model persistence, artifact loading, and validation."""

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = Path(models_dir or settings.models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.active_file = self.models_dir / "active_model.json"

    def _validate_model_can_infer(self, model_obj: Any) -> bool:
        """Sanity-check that model can run inference without errors or NaN outputs."""
        dummy_row = pd.DataFrame([{col: 0.0 for col in FEATURE_COLUMNS}])
        try:
            preds = model_obj.predict(dummy_row)
            if len(preds) != 1 or np.isnan(preds[0]) or preds[0] < 0.0:
                return False
            return True
        except Exception:
            return False

    def save_model(
        self,
        model_obj: Any,
        model_name: str,
        model_version: str,
        metadata: Dict[str, Any],
        set_active: bool = True,
    ) -> Path:
        """Persist model artifact and metadata to versioned directory.

        Args:
            model_obj: Trained forecaster instance (e.g. LightGBMForecaster).
            model_name: Name identifier (e.g., 'lightgbm').
            model_version: Unique version string (e.g., 'v1_20261024_163000').
            metadata: Evaluation metrics, feature schema, cutoff dates, and parameters.
            set_active: Whether to promote this version to active model if valid.

        Returns:
            Path to saved artifact directory.
        """
        # 1. Validate artifact can infer before persisting
        if not self._validate_model_can_infer(model_obj):
            raise ValueError(f"Model validation failed: artifact produced invalid or NaN predictions.")

        version_dir = self.models_dir / f"{model_name}_{model_version}"
        version_dir.mkdir(parents=True, exist_ok=True)

        artifact_file = version_dir / "model.joblib"
        metadata_file = version_dir / "metadata.json"

        # 2. Serialize model
        joblib.dump(model_obj, artifact_file)

        # 3. Assemble metadata
        full_metadata = {
            "model_name": model_name,
            "model_version": model_version,
            "artifact_path": str(artifact_file.resolve()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "feature_schema": FEATURE_COLUMNS,
            "validation_metrics": metadata.get("validation_metrics", {}),
            "holdout_metrics": metadata.get("holdout_metrics", {}),
            "training_cutoff_date": metadata.get("training_cutoff_date"),
            "training_data_range": metadata.get("training_data_range"),
            "validation_configuration": metadata.get("validation_configuration", {}),
            "is_active": set_active,
        }

        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(full_metadata, f, indent=2)

        # 4. Update active pointer
        if set_active:
            with open(self.active_file, "w", encoding="utf-8") as f:
                json.dump({"active_version": model_version, "active_name": model_name, "version_dir": str(version_dir)}, f, indent=2)

        return version_dir

    def load_model(self, version: str = "active") -> Tuple[Any, Dict[str, Any]]:
        """Load a persisted model artifact and its metadata.

        Args:
            version: 'active', 'latest', or specific version string.

        Returns:
            Tuple of (loaded_model, metadata_dict).
        """
        target_dir: Optional[Path] = None

        if version == "active" and self.active_file.exists():
            with open(self.active_file, "r", encoding="utf-8") as f:
                active_info = json.load(f)
                target_dir = Path(active_info["version_dir"])

        if target_dir is None or not target_dir.exists():
            # Search by version or take latest
            all_dirs = sorted([d for d in self.models_dir.iterdir() if d.is_dir() and (d / "model.joblib").exists()], reverse=True)
            if not all_dirs:
                raise FileNotFoundError("No registered model artifacts found in models directory.")

            if version in ["active", "latest"]:
                target_dir = all_dirs[0]
            else:
                matched = [d for d in all_dirs if version in d.name]
                if not matched:
                    raise FileNotFoundError(f"Model version '{version}' not found.")
                target_dir = matched[0]

        artifact_file = target_dir / "model.joblib"
        metadata_file = target_dir / "metadata.json"

        if not artifact_file.exists():
            raise FileNotFoundError(f"Model artifact '{artifact_file}' does not exist.")

        model = joblib.load(artifact_file)
        metadata = {}
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        return model, metadata

    def list_models(self) -> List[Dict[str, Any]]:
        """List all persisted model artifacts with metadata."""
        models: List[Dict[str, Any]] = []
        active_ver = None
        if self.active_file.exists():
            try:
                with open(self.active_file, "r", encoding="utf-8") as f:
                    active_ver = json.load(f).get("active_version")
            except Exception:
                pass

        for d in sorted(self.models_dir.iterdir(), reverse=True):
            if d.is_dir() and (d / "metadata.json").exists():
                try:
                    with open(d / "metadata.json", "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        meta["is_active"] = (meta.get("model_version") == active_ver)
                        models.append(meta)
                except Exception:
                    continue

        return models
