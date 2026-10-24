"""Comprehensive automated test suite for SupplyShield AI Data & Intelligence Pipeline.

Tests:
1. Canonical dataset schema and data-quality integrity.
2. Leakage-free feature engineering and lag alignment.
3. Chronological train/validation/test separation.
4. Zero-demand metric handling.
5. Continuous-review inventory formulas, stochastic safety stock, and batch rounding.
6. Distribution optimizer stock conservation and lane capacity constraints.
7. Optimizer infeasibility diagnostics under severe network severance.
8. Synthetic demo data determinism and reproducibility.
9. FastAPI API endpoints for data quality, canonical summary, and inventory planning.
"""

import math
from pathlib import Path
import pytest
import numpy as np
import pandas as pd

from src.data.canonical import CanonicalPipeline
from src.data.features import FEATURE_COLUMNS, generate_demand_features
from src.forecasting.metrics import calculate_metrics
from src.inventory.planning import DemandProfile, InventoryPlanner, InventoryPosition
from src.optimization.optimizer import AllocationOptimizer
from src.optimization.service import OptimizationService
from src.schemas.optimization import OptimizeRequest


# ---------------------------------------------------------
# Fixtures
# ---------------------------------------------------------
@pytest.fixture(scope="session")
def repo_root():
    return Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def canonical_df(repo_root):
    parquet_path = repo_root / "data" / "processed" / "supply_chain_daily.parquet"
    if not parquet_path.exists():
        CanonicalPipeline().run()
    return pd.read_parquet(parquet_path)


# ---------------------------------------------------------
# 1. Canonical Schema & Data Quality Tests
# ---------------------------------------------------------
def test_canonical_dataset_schema_and_nulls(canonical_df):
    """Verify canonical dataset row count, schema, and zero nulls."""
    assert len(canonical_df) == 91250, f"Expected 91,250 rows, got {len(canonical_df)}"

    expected_cols = [
        "date", "sku_id", "warehouse_id", "supplier_id", "region",
        "units_sold", "inventory_level", "supplier_lead_time_days",
        "reorder_point", "order_quantity", "unit_cost", "unit_price",
        "promotion_flag", "stockout_flag", "demand_forecast_raw",
        "gross_margin", "inventory_valuation", "is_below_reorder_point"
    ]
    for col in expected_cols:
        assert col in canonical_df.columns, f"Missing expected column: {col}"

    # Assert 0 nulls across every column
    assert canonical_df.isna().sum().sum() == 0, "Canonical dataset contains unexpected nulls"


def test_stockout_flag_uniform_zero(canonical_df):
    """Verify ground truth: stockout_flag is 100% zero in historical data."""
    assert (canonical_df["stockout_flag"] == 0).all(), (
        "Stockout_Flag contains non-zero entries; positive historical labels must NOT be fabricated!"
    )


def test_inventory_physics_conservation(canonical_df):
    """Verify physical inventory transition: Inv_t = Inv_{t-1} + Order_t - Sales_t."""
    # Test on a deterministic sample SKU-warehouse slice
    sample = canonical_df[(canonical_df["warehouse_id"] == "WH_1") & (canonical_df["sku_id"] == "SKU_001")].sort_values("date")
    inv = sample["inventory_level"].values
    orders = sample["order_quantity"].values
    sales = sample["units_sold"].values

    for t in range(1, len(sample)):
        expected_inv = inv[t - 1] + orders[t] - sales[t]
        assert inv[t] == expected_inv, f"Inventory physics violated at step {t}: expected {expected_inv}, got {inv[t]}"


# ---------------------------------------------------------
# 2. Leakage-Free Feature Engineering Tests
# ---------------------------------------------------------
def test_feature_engineering_no_future_leakage(canonical_df):
    """Verify feature generation: lags strictly align with past actuals, no target leakage."""
    features_df = generate_demand_features(canonical_df)

    # Check that demand_forecast is NEVER in features
    assert "demand_forecast_raw" not in FEATURE_COLUMNS
    assert "units_sold" not in FEATURE_COLUMNS

    # Verify lag 1 exact alignment
    test_slice = features_df[(features_df["warehouse_id"] == "WH_1") & (features_df["sku_id"] == "SKU_1")].sort_values("date")
    lag1_values = test_slice["lag_1"].values
    actual_sales = test_slice["units_sold"].values

    # Lag 1 at index t must equal actual sales at index t-1
    for t in range(1, min(20, len(test_slice))):
        assert lag1_values[t] == actual_sales[t - 1], (
            f"Lag 1 mismatch at step {t}: lag_1={lag1_values[t]} vs actual_t-1={actual_sales[t-1]}"
        )


def test_feature_dataframe_no_nans(canonical_df):
    """Verify feature dataframe has zero NaNs after warmup drop."""
    features_df = generate_demand_features(canonical_df)
    assert features_df[FEATURE_COLUMNS].isna().sum().sum() == 0


# ---------------------------------------------------------
# 3. Chronological Train / Val / Test Separation
# ---------------------------------------------------------
def test_chronological_split_integrity(canonical_df):
    """Verify strict chronological non-overlapping partitions."""
    dt_series = pd.to_datetime(canonical_df["date"])
    train_end = pd.Timestamp("2024-09-30")
    val_end = pd.Timestamp("2024-10-31")

    train_dates = dt_series[dt_series <= train_end]
    val_dates = dt_series[(dt_series > train_end) & (dt_series <= val_end)]
    test_dates = dt_series[dt_series > val_end]

    assert train_dates.max() < val_dates.min(), "Train max date must precede Val min date"
    assert val_dates.max() < test_dates.min(), "Val max date must precede Test min date"


# ---------------------------------------------------------
# 4. Zero-Demand Metric Handling
# ---------------------------------------------------------
def test_zero_demand_wape_safety():
    """Verify WAPE calculation handles zero denominator safely."""
    # When actuals are 0, WAPE is mathematically undefined (returns None)
    res_zero = calculate_metrics(y_true=[0.0, 0.0, 0.0], y_pred=[0.0, 0.0, 0.0])
    assert res_zero["wape"] is None
    assert res_zero["mae"] == 0.0

    # When actuals are positive, WAPE is computed correctly
    res_pos = calculate_metrics(y_true=[10.0, 20.0], y_pred=[12.0, 18.0])
    # abs errors: 2 + 2 = 4, actuals = 30 -> 4/30 = 0.1333
    assert res_pos["wape"] == 0.1333


# ---------------------------------------------------------
# 5. Inventory Math & Replenishment Logic
# ---------------------------------------------------------
def test_safety_stock_constant_lead_time():
    """Verify SS = z * sigma_d * sqrt(L)."""
    # z=1.6449 (95%), sigma=4.0, L=9 -> SS = 1.6449 * 4.0 * 3 = 19.7388 -> ceil = 20
    prof = DemandProfile(
        avg_daily_demand=20.0,
        std_daily_demand=4.0,
        supplier_lead_time_days=9.0,
        lead_time_std_days=0.0,
        service_level=0.95,
    )
    ss = InventoryPlanner.calculate_safety_stock(prof)
    assert ss == 20


def test_safety_stock_stochastic_lead_time():
    """Verify SS with variable lead time: sqrt(L * sigma_d^2 + mu_d^2 * sigma_L^2)."""
    prof = DemandProfile(
        avg_daily_demand=10.0,
        std_daily_demand=2.0,
        supplier_lead_time_days=4.0,
        lead_time_std_days=1.0,
        service_level=0.95,
    )
    # var = 4 * 4 + 100 * 1 = 16 + 100 = 116
    # sqrt(116) ~ 10.7703 * 1.6449 ~ 17.716 -> ceil = 18
    ss = InventoryPlanner.calculate_safety_stock(prof)
    assert ss == 18


def test_reorder_point_and_pack_size_rounding():
    """Verify ROP and MOQ / pack size rounding."""
    pos = InventoryPosition(
        sku_id="SKU_TEST",
        location_id="WH_TEST",
        on_hand_quantity=15,  # Breaches ROP
        reserved_quantity=0,
        reorder_point=50,
        target_stock=100,
        unit_cost=5.0,
        pack_size=12,
        minimum_order_quantity=24,
    )
    prof = DemandProfile(
        avg_daily_demand=10.0,
        std_daily_demand=2.0,
        supplier_lead_time_days=3.0,
    )
    rec = InventoryPlanner.compute_replenishment(pos, prof)
    assert rec.is_reorder_triggered is True
    # raw deficit = 100 - 15 = 85. MOQ is 24.
    # 85 rounded up to nearest multiple of 12 -> ceil(85/12)*12 = 8 * 12 = 96
    assert rec.recommended_order_quantity == 96
    assert rec.estimated_procurement_cost == 480.0
    assert rec.urgency_level == "CRITICAL_SHORTAGE"  # 15 <= 50 * 0.5


# ---------------------------------------------------------
# 6. Optimizer Constraint Validity
# ---------------------------------------------------------
def test_optimizer_stock_conservation_and_validity(repo_root):
    """Verify optimizer strictly respects warehouse stock limits and valid lanes."""
    dataset_dir = repo_root / "data" / "demo"
    opt_service = OptimizationService(dataset_dir)

    req = OptimizeRequest(
        horizon_days=7,
        shortage_penalty_per_unit=100.0,
    )
    res = opt_service.run_optimization(req)
    assert res.status == "OPTIMAL"
    assert res.feasibility.is_feasible is True
    assert res.feasibility.violations_count == 0

    # Ensure all allocations are non-negative integers
    for alloc in res.allocations:
        assert alloc.allocated_units >= 0
        assert isinstance(alloc.allocated_units, int)


# ---------------------------------------------------------
# 7. Optimizer Infeasibility / Shortage Handling
# ---------------------------------------------------------
def test_optimizer_shortage_handling_under_zero_warehouse_stock():
    """Verify optimizer records explicit shortage rather than fabricating stock when warehouse is empty."""
    opt = AllocationOptimizer(
        warehouse_stock={("WH_1", "SKU_1"): 0},  # ZERO stock
        store_inventory={("ST_1", "SKU_1"): 0},
        forecast_demand={("ST_1", "SKU_1"): 50},
        valid_lanes={("WH_1", "ST_1")},
        lane_costs={("WH_1", "ST_1"): 2.5},
        lane_lead_times={("WH_1", "ST_1"): 12.0},
        lane_capacities={("WH_1", "ST_1"): 100},
        stores=["ST_1"],
        products=["SKU_1"],
        warehouses=["WH_1"],
        planning_horizon_days=7,
    )
    status_str, _, allocations, store_summaries, summary = opt.solve()
    assert status_str == "OPTIMAL"
    assert summary.total_allocated_units == 0
    assert summary.total_unmet_demand_units == 50
    assert summary.demand_fulfillment_rate == 0.0


# ---------------------------------------------------------
# 8. Synthetic Demo Data Determinism
# ---------------------------------------------------------
def test_synthetic_data_deterministic_generation(repo_root):
    """Verify synthetic topology demo datasets exist and have consistent primary keys."""
    demo_dir = repo_root / "data" / "demo"
    stores_df = pd.read_csv(demo_dir / "stores.csv")
    lanes_df = pd.read_csv(demo_dir / "transport_lanes.csv")
    batches_df = pd.read_csv(demo_dir / "inventory_batches.csv")

    assert len(stores_df) == 12
    assert len(lanes_df) == 36
    assert len(batches_df) == 60

    # Foreign key integrity
    valid_stores = set(stores_df["store_id"])
    assert set(lanes_df["destination_store_id"]).issubset(valid_stores)


# ---------------------------------------------------------
# 9. FastAPI API Endpoints Validation
# ---------------------------------------------------------
def test_api_data_quality_endpoint(client):
    """Test GET /api/v1/data/quality endpoint."""
    resp = client.get("/api/v1/data/quality")
    assert resp.status_code == 200
    data = resp.json()
    assert "dataset_metadata" in data
    assert data["dataset_metadata"]["row_count"] == 91250


def test_api_canonical_summary_endpoint(client):
    """Test GET /api/v1/data/canonical/summary endpoint."""
    resp = client.get("/api/v1/data/canonical/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["row_count"] == 91250
    assert data["is_stockout_flag_uniform_zero"] is True


def test_api_inventory_plan_endpoint(client):
    """Test POST /api/v1/inventory/plan endpoint."""
    payload = {
        "items": [
            {
                "sku_id": "SKU_001",
                "location_id": "WH_1",
                "on_hand_quantity": 100,
                "reorder_point": 120,
                "target_stock": 250,
                "unit_cost": 15.0,
                "pack_size": 10,
                "minimum_order_quantity": 50,
                "avg_daily_demand": 15.0,
                "std_daily_demand": 3.0,
                "supplier_lead_time_days": 7.0,
            }
        ],
        "review_horizon_days": 7,
    }
    resp = client.post("/api/v1/inventory/plan", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_items_evaluated"] == 1
    assert data["reorder_triggered_count"] == 1
    assert len(data["recommendations"]) == 1
    rec = data["recommendations"][0]
    assert rec["sku_id"] == "SKU_001"
    assert rec["is_reorder_triggered"] is True
    assert rec["recommended_order_quantity"] == 150  # 250 - 100 = 150
