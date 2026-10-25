"""End-to-End Integration Tests for SupplyShield AI ML Service.

Verifies complete inter-service workflows across Phases 01-05:
1. Health check -> Dataset validation
2. Forecast generation for known store-product pair
3. Forecast evaluation using chronological split
4. Optimization with independent feasibility audit
5. Scenario simulation with baseline-vs-disrupted comparison
6. Scenario PRD alias compatibility (/api/v1/scenario/disrupt)
7. Invalid request handling across endpoints
8. Infeasible/solver failure handling and status distinction
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.schemas.forecasting import EvaluationResponse, ForecastResponse
from src.schemas.optimization import OptimizeResponse
from src.schemas.scenario import ScenarioSimulateResponse
from src.schemas.validation import ValidationReport

client = TestClient(app)


def test_e2e_workflow_health_to_validation():
    """Workflow 1: Health check -> Dataset validation."""
    # Step 1: Check root health
    resp_health = client.get("/health")
    assert resp_health.status_code == 200
    data_health = resp_health.json()
    assert data_health["status"] in ("ok", "healthy")
    assert data_health["components"]["api_server"] == "running"
    assert data_health["components"]["forecasting_engine"] == "ready"
    assert data_health["components"]["optimization_solver"] == "ready"

    # Step 2: Check versioned health alias
    resp_v1_health = client.get("/api/v1/health")
    assert resp_v1_health.status_code == 200
    assert resp_v1_health.json()["status"] == data_health["status"]

    # Step 3: Run dataset validation gate
    resp_val = client.get("/api/v1/data/validate")
    assert resp_val.status_code == 200
    val_report = ValidationReport(**resp_val.json())
    assert val_report.status in ("valid", "valid_with_warnings")
    assert val_report.summary.total_files_checked == 10
    assert val_report.summary.files_loaded == 10
    assert val_report.summary.total_errors == 0
    assert len(val_report.errors) == 0


def test_e2e_workflow_forecasting():
    """Workflow 2: Demand forecast generation for known store-product pair."""
    req_payload = {
        "store_id": "STORE-01",
        "product_id": "SKU-001",
        "horizon_days": 14,
        "model_type": "auto",
    }
    resp = client.post("/api/v1/forecast", json=req_payload)
    assert resp.status_code == 200
    fc_data = ForecastResponse(**resp.json())

    assert fc_data.store_id == "STORE-01"
    assert fc_data.product_id == "SKU-001"
    assert fc_data.model_applied in ("seasonal_naive", "moving_average", "historical_average")
    assert len(fc_data.forecasts) == 14

    for point in fc_data.forecasts:
        assert point.date != ""
        assert point.predicted_demand >= 0.0


def test_e2e_workflow_forecast_evaluation():
    """Workflow 3: Forecast evaluation using chronological split."""
    req_payload = {
        "store_id": "STORE-01",
        "product_id": "SKU-001",
        "train_end_date": "2025-10-31",
        "test_start_date": "2025-11-01",
        "test_end_date": "2025-12-31",
    }
    resp = client.post("/api/v1/evaluate-forecast", json=req_payload)
    assert resp.status_code == 200
    eval_data = EvaluationResponse(**resp.json())

    assert eval_data.split_boundaries["train_end_date"] == "2025-10-31"
    assert eval_data.split_boundaries["test_start_date"] == "2025-11-01"
    assert eval_data.split_boundaries["test_end_date"] == "2025-12-31"
    assert eval_data.series_evaluated == 1
    assert eval_data.total_test_observations == 61
    assert len(eval_data.method_metrics) == 4
    for m in eval_data.method_metrics:
        assert m.mae >= 0.0
        assert m.rmse >= 0.0


def test_e2e_workflow_optimization_and_audit():
    """Workflow 4: Optimization with independent feasibility audit."""
    req_payload = {
        "horizon_days": 7,
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001", "SKU-002"],
        "shortage_penalty_per_unit": 100.0,
        "solver_time_limit_seconds": 5.0,
    }
    resp = client.post("/api/v1/optimize", json=req_payload)
    assert resp.status_code == 200
    opt_data = OptimizeResponse(**resp.json())

    assert opt_data.status in ("OPTIMAL", "FEASIBLE")
    assert opt_data.feasibility.is_feasible is True
    assert opt_data.feasibility.violations_count == 0

    plan = opt_data.optimized_plan
    assert plan.total_forecast_demand > 0
    assert plan.total_allocated_units > 0
    assert plan.overall_demand_satisfied_rate > 0.0

    # Strict Arithmetic Identities
    assert plan.total_forecast_demand == (
        plan.total_effective_store_stock_utilized + plan.total_gross_requirement
    )
    assert plan.total_store_inventory_on_hand == (
        plan.total_effective_store_stock_utilized + plan.total_surplus_store_stock
    )


def test_e2e_workflow_scenario_simulation():
    """Workflow 5: Scenario simulation with baseline-vs-disrupted comparison."""
    req_payload = {
        "scenario_name": "Integration Test SCN-001 Route Closure",
        "preset_scenario_id": "SCN-001",
        "horizon_days": 7,
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001", "SKU-002"],
    }
    resp = client.post("/api/v1/scenario/simulate", json=req_payload)
    assert resp.status_code == 200
    scn_data = ScenarioSimulateResponse(**resp.json())

    assert scn_data.baseline_plan.total_forecast_demand > 0
    assert scn_data.disrupted_plan.total_forecast_demand > 0
    assert scn_data.disrupted_feasibility.is_feasible is True

    # Validate delta metrics
    deltas = scn_data.delta_metrics
    assert "demand_delta_units" in deltas
    assert "allocated_units_delta" in deltas
    assert "unmet_demand_delta_units" in deltas
    assert "transport_cost_delta_dollars" in deltas
    assert "fulfillment_rate_delta_pct" in deltas

    # Validate resilience insights
    insights = scn_data.resilience_insights
    assert insights.primary_bottleneck != ""
    assert insights.is_disrupted_plan_feasible is True
    assert len(insights.executive_summary) > 0


def test_e2e_workflow_scenario_prd_alias():
    """Workflow 6: Scenario PRD alias compatibility (/api/v1/scenario/disrupt)."""
    req_payload = {
        "scenario_name": "PRD Alias Test Demand Surge",
        "preset_scenario_id": "SCN-002",
        "horizon_days": 7,
        "stores": ["STORE-01"],
        "products": ["SKU-001"],
    }
    resp = client.post("/api/v1/scenario/disrupt", json=req_payload)
    assert resp.status_code == 200
    scn_data = ScenarioSimulateResponse(**resp.json())
    assert scn_data.disrupted_feasibility.is_feasible is True


def test_e2e_invalid_request_handling_across_endpoints():
    """Workflow 7: Client error handling across endpoints."""
    # 1. Invalid forecast horizon (must be 1 <= horizon <= 90)
    resp_fc_bad = client.post(
        "/api/v1/forecast",
        json={"store_id": "STORE-01", "product_id": "SKU-001", "horizon_days": 180},
    )
    assert resp_fc_bad.status_code == 422

    # 2. Unknown store/SKU forecast request
    resp_fc_unknown = client.post(
        "/api/v1/forecast",
        json={"store_id": "STORE-999", "product_id": "SKU-999", "horizon_days": 14},
    )
    assert resp_fc_unknown.status_code == 400
    assert "No historical demand records found" in resp_fc_unknown.json()["detail"]

    # 3. Invalid scenario disruption type
    resp_scn_bad = client.post(
        "/api/v1/scenario/simulate",
        json={
            "scenario_name": "Bad Disruption",
            "disruptions": [{"disruption_type": "alien_invasion", "target_id": "WH-CENTRAL"}],
        },
    )
    assert resp_scn_bad.status_code == 422


def test_e2e_infeasible_handling_and_solver_outcome_distinction():
    """Workflow 8: Distinguish solver outcomes and handle infeasible/unsolvable conditions."""
    from src.optimization.optimizer import AllocationOptimizer

    # Construct impossible problem: demand exists, but all valid lanes are blocked
    warehouses = ["WH-1"]
    stores = ["S-1"]
    products = ["SKU-1"]
    warehouse_stock = {("WH-1", "SKU-1"): 100}
    store_inventory = {("S-1", "SKU-1"): 0}
    forecast_demand = {("S-1", "SKU-1"): 50}
    valid_lanes = set()  # No valid lane exists!
    lane_costs = {}
    lane_lead_times = {}
    lane_capacities = {}

    opt = AllocationOptimizer(
        warehouse_stock=warehouse_stock,
        store_inventory=store_inventory,
        forecast_demand=forecast_demand,
        valid_lanes=valid_lanes,
        lane_costs=lane_costs,
        lane_lead_times=lane_lead_times,
        lane_capacities=lane_capacities,
        stores=stores,
        products=products,
        warehouses=warehouses,
    )
    status_str, runtime, allocs, store_sums, plan = opt.solve()

    # The model still solves because unmet demand is penalized (slack variables)
    # Status should be OPTIMAL, allocated units should be 0, unmet demand should be 50
    assert status_str == "OPTIMAL"
    assert len(allocs) == 0
    assert plan.total_allocated_units == 0
    assert plan.total_unmet_demand_units == 50
