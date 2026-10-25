"""Data validation and quality API routes for SupplyShield AI ML Service."""

import json
from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
import pandas as pd

from src.config import settings
from src.data.validator import DataValidator
from src.schemas.validation import ValidationReport

router = APIRouter(prefix="/data", tags=["Data Quality & Validation"])


@router.get(
    "/validate",
    response_model=ValidationReport,
    summary="Validate Demo Dataset",
    description="Loads the demo dataset bundle and performs 12-point integrity and schema validation.",
)
def validate_dataset() -> JSONResponse:
    """Run full validation checks against the demo dataset directory."""
    validator = DataValidator(settings.dataset_dir)
    report = validator.validate()

    if report.status == "invalid":
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=report.model_dump(),
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=report.model_dump(),
    )


@router.get(
    "/quality",
    summary="Retrieve Data Quality Audit Report",
    description="Returns the comprehensive schema, cardinality, missing date, and ground-truth audit summary.",
)
def get_data_quality_report() -> Dict[str, Any]:
    """Retrieve precomputed machine-readable data quality report."""
    repo_root = Path(__file__).resolve().parents[3]
    report_file = repo_root / "reports" / "data_quality_report.json"

    if not report_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data quality report not found. Run scripts/audit_dataset.py first.",
        )

    try:
        with open(report_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read data quality report: {str(exc)}",
        )


@router.get(
    "/canonical/summary",
    summary="Canonical Processed Dataset Status",
    description="Verifies the state, row count, and schema of data/processed/supply_chain_daily.parquet.",
)
def get_canonical_dataset_summary() -> Dict[str, Any]:
    """Retrieve summary metadata for the canonical processed dataset."""
    repo_root = Path(__file__).resolve().parents[3]
    parquet_path = repo_root / "data" / "processed" / "supply_chain_daily.parquet"
    quarantine_path = repo_root / "data" / "processed" / "quarantine.csv"

    if not parquet_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canonical parquet dataset not found. Run python -m src.data.canonical first.",
        )

    df = pd.read_parquet(parquet_path)
    quarantine_count = 0
    if quarantine_path.exists():
        quarantine_df = pd.read_csv(quarantine_path)
        quarantine_count = len(quarantine_df)

    return {
        "status": "ready",
        "file_format": "parquet",
        "file_path": str(parquet_path.relative_to(repo_root)),
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "date_range": {
            "start": str(df["date"].min()),
            "end": str(df["date"].max()),
        },
        "unique_skus": int(df["sku_id"].nunique()),
        "unique_warehouses": int(df["warehouse_id"].nunique()),
        "unique_regions": int(df["region"].nunique()),
        "quarantined_records": quarantine_count,
        "is_stockout_flag_uniform_zero": bool((df["stockout_flag"] == 0).all()),
        "leakage_warning": "demand_forecast has contemporaneous leakage with units_sold (r=0.949); excluded from ML training features.",
    }
