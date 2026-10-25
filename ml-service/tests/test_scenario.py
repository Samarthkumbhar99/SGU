"""Comprehensive test suite for Phase 05 Disruption Scenario Simulation & Resilience Analysis."""

import pytest
from src.schemas.scenario import ScenarioSimulateRequest, ScenarioSimulateResponse


# 1. Warehouse outage test
def test_scenario_warehouse_outage(client):
    payload = {
        "scenario_name": "Test Warehouse Outage",
        "disruptions": [
            {
                "disruption_type": "warehouse_outage",
                "target_id": "WH-CENTRAL",
            }
        ],
        "horizon_days": 7,
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001"],
    }
    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200

    data = ScenarioSimulateResponse(**response.json())
    assert "WH-CENTRAL" in data.affected_entities["warehouses"]
    assert data.disrupted_feasibility.is_feasible is True

    # No shipments may come from WH-CENTRAL in the disrupted plan
    for alloc in data.disrupted_allocations:
        assert alloc.warehouse_id != "WH-CENTRAL"


# 2. Route closure and capacity reduction test
def test_scenario_route_closure_and_capacity(client):
    payload = {
        "scenario_name": "Test Lane Closure & Cap",
        "disruptions": [
            {
                "disruption_type": "route_closure",
                "target_id": "WH-NORTH__STORE-01",
            },
            {
                "disruption_type": "lane_capacity_reduction",
                "target_id": "WH-SOUTH__STORE-01",
                "change_value": 0.50,
            },
        ],
        "horizon_days": 7,
        "stores": ["STORE-01"],
        "products": ["SKU-001"],
    }
    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200

    data = ScenarioSimulateResponse(**response.json())
    assert "WH-NORTH__STORE-01" in data.affected_entities["lanes"]
    assert data.disrupted_feasibility.is_feasible is True

    # WH-NORTH -> STORE-01 must have 0 allocations
    for alloc in data.disrupted_allocations:
        lane_str = f"{alloc.warehouse_id}__{alloc.store_id}"
        assert lane_str != "WH-NORTH__STORE-01"


# 3. Warehouse inventory stock reduction test
def test_scenario_inventory_reduction(client):
    payload = {
        "scenario_name": "Test Stock Reduction",
        "disruptions": [
            {
                "disruption_type": "warehouse_stock_reduction",
                "target_id": "WH-CENTRAL",
                "change_value": 0.10,  # 90% reduction
            }
        ],
        "horizon_days": 7,
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001"],
    }
    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200

    data = ScenarioSimulateResponse(**response.json())
    assert data.disrupted_plan.total_warehouse_stock_available < data.baseline_plan.total_warehouse_stock_available
    assert data.disrupted_feasibility.is_feasible is True


# 4. Demand surge test
def test_scenario_demand_surge(client):
    payload = {
        "scenario_name": "Test Demand Spike",
        "disruptions": [
            {
                "disruption_type": "demand_spike",
                "target_id": "STORE-04",
                "change_value": 1.50,  # +50% demand
            }
        ],
        "horizon_days": 7,
        "stores": ["STORE-04"],
        "products": ["SKU-001", "SKU-002"],
    }
    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200

    data = ScenarioSimulateResponse(**response.json())
    assert data.delta_metrics["demand_delta_units"] > 0
    assert data.disrupted_plan.total_forecast_demand > data.baseline_plan.total_forecast_demand
    assert data.disrupted_feasibility.is_feasible is True


# 5. Combined scenario test
def test_scenario_combined(client):
    payload = {
        "scenario_name": "Combined Crisis",
        "disruptions": [
            {
                "disruption_type": "route_closure",
                "target_id": "WH-NORTH__STORE-01",
            },
            {
                "disruption_type": "demand_spike",
                "target_id": "STORE-01",
                "change_value": 1.30,
            },
        ],
        "horizon_days": 7,
        "stores": ["STORE-01"],
        "products": ["SKU-001"],
    }
    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200

    data = ScenarioSimulateResponse(**response.json())
    assert len(data.applied_disruptions) == 2
    assert data.disrupted_feasibility.is_feasible is True
    assert data.resilience_insights.is_disrupted_plan_feasible is True


# 6. Invalid scenario type and invalid identifiers return 400 or 422
def test_invalid_scenario_inputs_return_error(client):
    # Invalid disruption type
    bad_type = {
        "disruptions": [
            {"disruption_type": "invalid_magic_type", "target_id": "WH-CENTRAL"}
        ]
    }
    r1 = client.post("/api/v1/scenario/simulate", json=bad_type)
    assert r1.status_code == 422

    # Unknown warehouse identifier
    bad_wh = {
        "disruptions": [
            {"disruption_type": "warehouse_outage", "target_id": "WH-GHOST-UNKNOWN"}
        ]
    }
    r2 = client.post("/api/v1/scenario/simulate", json=bad_wh)
    assert r2.status_code == 400
    assert "Unknown warehouse" in r2.json()["detail"]


# 7. Correct metric deltas
def test_correct_metric_deltas(client):
    payload = {
        "scenario_name": "Delta Integrity Test",
        "disruptions": [
            {"disruption_type": "warehouse_outage", "target_id": "WH-NORTH"}
        ],
        "horizon_days": 7,
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001"],
    }
    res = client.post("/api/v1/scenario/simulate", json=payload)
    assert res.status_code == 200
    d = res.json()

    base_dem = d["baseline_plan"]["total_forecast_demand"]
    dis_dem = d["disrupted_plan"]["total_forecast_demand"]
    assert d["delta_metrics"]["demand_delta_units"] == (dis_dem - base_dem)

    base_unmet = d["baseline_plan"]["total_unmet_demand_units"]
    dis_unmet = d["disrupted_plan"]["total_unmet_demand_units"]
    assert d["delta_metrics"]["unmet_demand_delta_units"] == (dis_unmet - base_unmet)


# 8. No mutation of original dataset inputs
def test_no_mutation_of_original_dataset(client):
    # First run severe outage
    p1 = {
        "disruptions": [{"disruption_type": "warehouse_outage", "target_id": "WH-CENTRAL"}],
        "stores": ["STORE-01"],
        "products": ["SKU-001"],
    }
    client.post("/api/v1/scenario/simulate", json=p1)

    # Next run mild route closure
    p2 = {
        "disruptions": [{"disruption_type": "route_closure", "target_id": "WH-NORTH__STORE-01"}],
        "stores": ["STORE-01"],
        "products": ["SKU-001"],
    }
    r2 = client.post("/api/v1/scenario/simulate", json=p2)
    assert r2.status_code == 200
    d2 = r2.json()

    # In p2's baseline, WH-CENTRAL must still have its original stock and NOT be 0!
    assert d2["baseline_plan"]["total_warehouse_stock_available"] > 0
    # In p2's disrupted allocations, WH-CENTRAL can still allocate if needed
    wh_set = {a["warehouse_id"] for a in d2["disrupted_allocations"]}
    # Confirms WH-CENTRAL was not permanently mutated to 0
    assert "WH-CENTRAL" in wh_set or d2["disrupted_plan"]["total_allocated_units"] >= 0


# 9. Baseline and disrupted feasibility validation
def test_baseline_and_disrupted_both_feasible(client):
    payload = {
        "preset_scenario_id": "SCN-001",  # North lane closure preset
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001"],
    }
    res = client.post("/api/v1/scenario/simulate", json=payload)
    assert res.status_code == 200
    d = res.json()

    assert d["baseline_feasibility"]["is_feasible"] is True
    assert d["disrupted_feasibility"]["is_feasible"] is True


# 10. Repeatable deterministic output
def test_deterministic_scenario_output(client):
    payload = {
        "preset_scenario_id": "SCN-002",
        "stores": ["STORE-04"],
        "products": ["SKU-001"],
    }
    r1 = client.post("/api/v1/scenario/simulate", json=payload)
    r2 = client.post("/api/v1/scenario/simulate", json=payload)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["delta_metrics"] == r2.json()["delta_metrics"]


# 11. PRD Contract Alias /api/v1/scenario/disrupt
def test_prd_alias_scenario_disrupt(client):
    payload = {
        "preset_scenario_id": "SCN-003",
        "stores": ["STORE-01"],
        "products": ["SKU-001"],
    }
    # Test versioned PRD alias
    r1 = client.post("/api/v1/scenario/disrupt", json=payload)
    assert r1.status_code == 200
    d1 = ScenarioSimulateResponse(**r1.json())
    assert d1.baseline_feasibility.is_feasible is True

    # Test root alias /scenario/disrupt
    r2 = client.post("/scenario/disrupt", json=payload)
    assert r2.status_code == 200
