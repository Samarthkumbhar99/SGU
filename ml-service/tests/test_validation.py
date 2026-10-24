"""Comprehensive test suite for Phase 02 Data Ingestion and Validation."""

import json
from pathlib import Path
import pandas as pd
import pytest

from src.config import settings
from src.data.loader import load_dataset_bundle
from src.data.validator import DataValidator
from src.schemas.validation import ValidationReport


@pytest.fixture
def minimal_valid_dataset(tmp_path: Path):
    """Create a minimal valid synthetic dataset fixture in a temporary directory."""
    # 1. products.csv
    products_df = pd.DataFrame([
        {
            "product_id": "SKU-001",
            "sku": "SKU-001",
            "product_name": "Test Milk",
            "category": "Dairy",
            "unit_of_measure": "unit",
            "unit_cost": 1.20,
            "unit_price": 2.00,
            "pack_size": 1,
            "shelf_life_days": 14,
        }
    ])
    products_df.to_csv(tmp_path / "products.csv", index=False)

    # 2. warehouses.csv
    warehouses_df = pd.DataFrame([
        {
            "warehouse_id": "WH-01",
            "warehouse_name": "Central Hub",
            "region": "Central",
            "latitude": 18.5,
            "longitude": 73.8,
            "storage_capacity_units": 10000,
        }
    ])
    warehouses_df.to_csv(tmp_path / "warehouses.csv", index=False)

    # 3. stores.csv
    stores_df = pd.DataFrame([
        {
            "store_id": "STORE-01",
            "store_name": "Retail Store 1",
            "region": "Central",
            "latitude": 18.52,
            "longitude": 73.85,
            "store_capacity_units": 1500,
        }
    ])
    stores_df.to_csv(tmp_path / "stores.csv", index=False)

    # 4. daily_demand.csv
    daily_demand_df = pd.DataFrame([
        {
            "date": "2025-01-01",
            "store_id": "STORE-01",
            "product_id": "SKU-001",
            "region": "Central",
            "day_of_week": 2,
            "month": 1,
            "is_weekend": 0,
            "promotion_flag": 0,
            "unit_price": 2.00,
            "true_demand_units": 10,
            "units_sold": 10,
            "stockout_flag": 0,
            "data_source": "synthetic_demo",
        }
    ])
    daily_demand_df.to_csv(tmp_path / "daily_demand.csv", index=False)

    # 5. inventory_snapshot.csv
    snapshot_df = pd.DataFrame([
        {
            "snapshot_date": "2025-12-31",
            "location_type": "warehouse",
            "location_id": "WH-01",
            "product_id": "SKU-001",
            "quantity_on_hand": 500,
            "quantity_reserved": 10,
            "reorder_point": 50,
            "unit_cost": 1.20,
            "data_source": "synthetic_demo",
        }
    ])
    snapshot_df.to_csv(tmp_path / "inventory_snapshot.csv", index=False)

    # 6. transport_lanes.csv
    lanes_df = pd.DataFrame([
        {
            "lane_id": "WH-01__STORE-01",
            "source_warehouse_id": "WH-01",
            "destination_store_id": "STORE-01",
            "distance_km_estimate": 15.5,
            "unit_transport_cost": 0.05,
            "lead_time_hours": 12.0,
            "capacity_units_per_day": 300,
            "availability_status": "active",
            "data_source": "synthetic_demo",
        }
    ])
    lanes_df.to_csv(tmp_path / "transport_lanes.csv", index=False)

    # 7. inventory_batches.csv
    batches_df = pd.DataFrame([
        {
            "batch_id": "BATCH-001",
            "location_type": "warehouse",
            "location_id": "WH-01",
            "product_id": "SKU-001",
            "batch_number": "BN-1001",
            "quantity_available": 100,
            "quantity_reserved": 0,
            "snapshot_date": "2025-12-31",
            "expiry_date": "2026-01-15",
            "days_to_expiry": 15,
            "data_source": "synthetic_demo",
        }
    ])
    batches_df.to_csv(tmp_path / "inventory_batches.csv", index=False)

    # 8. scenarios.csv
    scenarios_df = pd.DataFrame([
        {
            "scenario_id": "SCN-TEST-1",
            "scenario_name": "Test Closure",
            "disruption_type": "route_closure",
            "target_id": "WH-01__STORE-01",
            "change_value": "unavailable",
            "description": "Test route closure",
        }
    ])
    scenarios_df.to_csv(tmp_path / "scenarios.csv", index=False)

    # 9. data_dictionary.json
    dd = {
        "dataset_name": "Test dataset",
        "date_range": {"start": "2025-01-01", "end": "2025-01-01"},
    }
    with open(tmp_path / "data_dictionary.json", "w") as f:
        json.dump(dd, f)

    # 10. README.md
    with open(tmp_path / "README.md", "w") as f:
        f.write("# Demo Test Dataset\n")

    return tmp_path


# 1. Successful loading of valid fixture data
def test_successful_loading_valid_fixture(minimal_valid_dataset):
    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "valid"
    assert report.summary.total_errors == 0
    assert report.summary.files_loaded == 10
    assert report.row_counts["products.csv"] == 1


# 2. Missing required file
def test_missing_required_file(minimal_valid_dataset):
    (minimal_valid_dataset / "daily_demand.csv").unlink()
    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "invalid"
    error_codes = [e.code for e in report.errors]
    assert "FILE_MISSING" in error_codes


# 3. Missing required column
def test_missing_required_column(minimal_valid_dataset):
    bad_products = pd.DataFrame([{"product_id": "SKU-001"}])
    bad_products.to_csv(minimal_valid_dataset / "products.csv", index=False)

    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "invalid"
    error_codes = [e.code for e in report.errors]
    assert "MISSING_COLUMNS" in error_codes


# 4. Malformed JSON data dictionary
def test_malformed_json_dictionary(minimal_valid_dataset):
    with open(minimal_valid_dataset / "data_dictionary.json", "w") as f:
        f.write("{malformed_json: true,")

    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "invalid"
    error_codes = [e.code for e in report.errors]
    assert "MALFORMED_JSON" in error_codes


# 5. Invalid date or numeric values
def test_invalid_date_or_numeric_values(minimal_valid_dataset):
    demand_df = pd.read_csv(minimal_valid_dataset / "daily_demand.csv")
    demand_df.loc[0, "date"] = "not-a-valid-date"
    demand_df.to_csv(minimal_valid_dataset / "daily_demand.csv", index=False)

    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "invalid"
    error_codes = [e.code for e in report.errors]
    assert "INVALID_DATE_FORMAT" in error_codes


# 6. Duplicate demand business key
def test_duplicate_demand_business_key(minimal_valid_dataset):
    demand_df = pd.read_csv(minimal_valid_dataset / "daily_demand.csv")
    dupe_row = demand_df.iloc[[0]]
    combined = pd.concat([demand_df, dupe_row], ignore_index=True)
    combined.to_csv(minimal_valid_dataset / "daily_demand.csv", index=False)

    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "invalid"
    error_codes = [e.code for e in report.errors]
    assert "DUPLICATE_DEMAND_RECORD" in error_codes


# 7. Invalid foreign-key reference
def test_invalid_foreign_key_reference(minimal_valid_dataset):
    lanes_df = pd.read_csv(minimal_valid_dataset / "transport_lanes.csv")
    lanes_df.loc[0, "source_warehouse_id"] = "WH-GHOST-UNKNOWN"
    lanes_df.to_csv(minimal_valid_dataset / "transport_lanes.csv", index=False)

    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "invalid"
    error_codes = [e.code for e in report.errors]
    assert "FOREIGN_KEY_VIOLATION" in error_codes


# 8. Stockout inconsistency warning
def test_stockout_inconsistency_warning(minimal_valid_dataset):
    demand_df = pd.read_csv(minimal_valid_dataset / "daily_demand.csv")
    # Mark as stockout (1) but units_sold equals true_demand_units
    demand_df.loc[0, "stockout_flag"] = 1
    demand_df.loc[0, "units_sold"] = 10
    demand_df.loc[0, "true_demand_units"] = 10
    demand_df.to_csv(minimal_valid_dataset / "daily_demand.csv", index=False)

    validator = DataValidator(minimal_valid_dataset)
    report = validator.validate()
    assert report.status == "valid_with_warnings"
    warning_codes = [w.code for w in report.warnings]
    assert "STOCKOUT_WITHOUT_UNMET_DEMAND" in warning_codes


# 9. Correct overall status for errors versus warnings
def test_overall_status_distinction(minimal_valid_dataset):
    # Case A: Valid
    v1 = DataValidator(minimal_valid_dataset).validate()
    assert v1.status == "valid"

    # Case B: Warning only (Unknown scenario target)
    scenarios_df = pd.read_csv(minimal_valid_dataset / "scenarios.csv")
    scenarios_df.loc[0, "target_id"] = "UNKNOWN_NON_FATAL_ENTITY"
    scenarios_df.to_csv(minimal_valid_dataset / "scenarios.csv", index=False)
    v2 = DataValidator(minimal_valid_dataset).validate()
    assert v2.status == "valid_with_warnings"
    assert v2.summary.total_errors == 0
    assert v2.summary.total_warnings >= 1

    # Case C: Fatal error overrides warning
    (minimal_valid_dataset / "products.csv").unlink()
    v3 = DataValidator(minimal_valid_dataset).validate()
    assert v3.status == "invalid"
    assert v3.summary.total_errors >= 1


# 10. API response and HTTP status behavior
def test_api_validate_endpoint_on_actual_dataset(client):
    response = client.get("/api/v1/data/validate")
    assert response.status_code == 200
    data = response.json()
    validated_report = ValidationReport(**data)
    assert validated_report.status in ["valid", "valid_with_warnings"]
    assert validated_report.summary.total_files_checked == 10
    assert validated_report.row_counts["daily_demand.csv"] == 87600
    assert validated_report.dimensions["products_count"] == 20
    assert validated_report.dimensions["warehouses_count"] == 3
    assert validated_report.dimensions["stores_count"] == 12


# 11. Dataset path resolution independent of working directory
def test_dataset_path_resolution_independent_of_cwd(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    assert settings.dataset_dir.exists()
    assert (settings.dataset_dir / "daily_demand.csv").exists()
    validator = DataValidator(settings.dataset_dir)
    report = validator.validate()
    assert report.summary.files_loaded == 10


# 12. Non-existent directory returns 422 on API
def test_api_validate_error_status_when_invalid(client, monkeypatch, tmp_path):
    empty_dir = tmp_path / "empty_dir"
    empty_dir.mkdir()
    monkeypatch.setattr(settings, "dataset_dir", empty_dir)

    response = client.get("/api/v1/data/validate")
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "invalid"
    assert len(data["errors"]) > 0
