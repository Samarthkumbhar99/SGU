"""Data loading module for SupplyShield AI demo datasets.

Safely loads CSV files, JSON data dictionary, and text README without hardcoding paths.
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd


EXPECTED_FILES = [
    "daily_demand.csv",
    "products.csv",
    "warehouses.csv",
    "stores.csv",
    "inventory_snapshot.csv",
    "transport_lanes.csv",
    "inventory_batches.csv",
    "scenarios.csv",
    "data_dictionary.json",
    "README.md",
]


@dataclass
class LoadedDataset:
    """Container for loaded dataset files and load-time issues."""

    daily_demand: Optional[pd.DataFrame] = None
    products: Optional[pd.DataFrame] = None
    warehouses: Optional[pd.DataFrame] = None
    stores: Optional[pd.DataFrame] = None
    inventory_snapshot: Optional[pd.DataFrame] = None
    transport_lanes: Optional[pd.DataFrame] = None
    inventory_batches: Optional[pd.DataFrame] = None
    scenarios: Optional[pd.DataFrame] = None
    data_dictionary: Optional[Dict[str, Any]] = None
    readme_text: Optional[str] = None

    loaded_files: List[str] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    warnings: List[Dict[str, Any]] = field(default_factory=list)


def load_dataset_bundle(dataset_dir: Path) -> LoadedDataset:
    """Load all demo dataset files from the specified directory.

    Args:
        dataset_dir: Path to directory containing demo dataset files.

    Returns:
        LoadedDataset containing DataFrames, parsed dictionary, readme text, and any load errors.
    """
    dataset = LoadedDataset()

    if not dataset_dir.exists() or not dataset_dir.is_dir():
        dataset.errors.append({
            "code": "DATASET_DIR_NOT_FOUND",
            "message": f"Dataset directory '{dataset_dir.name}' does not exist or is not a directory.",
            "file": None,
            "column": None,
            "context": {"resolved_name": dataset_dir.name},
        })
        return dataset

    # 1. Load data_dictionary.json
    dd_path = dataset_dir / "data_dictionary.json"
    if not dd_path.exists():
        dataset.errors.append({
            "code": "FILE_MISSING",
            "message": "Required file 'data_dictionary.json' is missing.",
            "file": "data_dictionary.json",
            "column": None,
            "context": None,
        })
    else:
        try:
            with open(dd_path, "r", encoding="utf-8") as f:
                dataset.data_dictionary = json.load(f)
            dataset.loaded_files.append("data_dictionary.json")
        except json.JSONDecodeError as exc:
            dataset.errors.append({
                "code": "MALFORMED_JSON",
                "message": f"Malformed JSON in 'data_dictionary.json': {str(exc)}",
                "file": "data_dictionary.json",
                "column": None,
                "context": {"error": str(exc)},
            })
        except Exception as exc:
            dataset.errors.append({
                "code": "FILE_READ_ERROR",
                "message": f"Could not read 'data_dictionary.json': {str(exc)}",
                "file": "data_dictionary.json",
                "column": None,
                "context": {"error": str(exc)},
            })

    # 2. Load README.md
    readme_path = dataset_dir / "README.md"
    if not readme_path.exists():
        dataset.warnings.append({
            "code": "README_MISSING",
            "message": "Documentation file 'README.md' is missing from dataset directory.",
            "file": "README.md",
            "column": None,
            "context": None,
        })
    else:
        try:
            with open(readme_path, "r", encoding="utf-8") as f:
                dataset.readme_text = f.read()
            dataset.loaded_files.append("README.md")
        except Exception as exc:
            dataset.warnings.append({
                "code": "README_READ_ERROR",
                "message": f"Could not read 'README.md': {str(exc)}",
                "file": "README.md",
                "column": None,
                "context": {"error": str(exc)},
            })

    # 3. Load CSV files
    csv_configs = {
        "daily_demand.csv": "daily_demand",
        "products.csv": "products",
        "warehouses.csv": "warehouses",
        "stores.csv": "stores",
        "inventory_snapshot.csv": "inventory_snapshot",
        "transport_lanes.csv": "transport_lanes",
        "inventory_batches.csv": "inventory_batches",
        "scenarios.csv": "scenarios",
    }

    for filename, attr_name in csv_configs.items():
        file_path = dataset_dir / filename
        if not file_path.exists():
            dataset.errors.append({
                "code": "FILE_MISSING",
                "message": f"Required CSV file '{filename}' is missing.",
                "file": filename,
                "column": None,
                "context": None,
            })
            continue

        try:
            # Safe CSV read with pandas
            df = pd.read_csv(file_path)
            setattr(dataset, attr_name, df)
            dataset.loaded_files.append(filename)
        except Exception as exc:
            dataset.errors.append({
                "code": "CSV_PARSE_ERROR",
                "message": f"Failed to parse CSV file '{filename}': {str(exc)}",
                "file": filename,
                "column": None,
                "context": {"error": str(exc)},
            })

    return dataset
