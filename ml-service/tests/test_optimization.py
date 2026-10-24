"""Comprehensive test suite for Phase 04 OR-Tools Inventory Allocation & Optimization Engine."""

import pytest
from src.optimization.baseline import solve_baseline_allocation
from src.optimization.optimizer import AllocationOptimizer
from src.optimization.validator import validate_allocation_plan
from src.schemas.optimization import AllocationRecord, OptimizeResponse, StoreProductDemandSummary


@pytest.fixture
def optimization_fixture():
    """Deterministic synthetic supply chain network fixture.

    Warehouses: WH-1, WH-2
    Stores: S-1, S-2
    Product: SKU-1

    WH-1: 50 units (Close to S-1, cost 0.10; Far from S-2, cost 0.90)
    WH-2: 50 units (Far from S-1, cost 0.80; Close to S-2, cost 0.15)
    Lane WH-2 -> S-1 is disabled/invalid.

    S-1 demand: 40 units, on-hand: 10 units -> Gross req: 30 units
    S-2 demand: 50 units, on-hand: 10 units -> Gross req: 40 units
    """
    warehouses = ["WH-1", "WH-2"]
    stores = ["S-1", "S-2"]
    products = ["SKU-1"]

    warehouse_stock = {
        ("WH-1", "SKU-1"): 50,
        ("WH-2", "SKU-1"): 50,
    }

    store_inventory = {
        ("S-1", "SKU-1"): 10,
        ("S-2", "SKU-1"): 10,
    }

    forecast_demand = {
        ("S-1", "SKU-1"): 40,
        ("S-2", "SKU-1"): 50,
    }

    # Only 3 valid lanes (WH-2 -> S-1 is disabled)
    valid_lanes = {
        ("WH-1", "S-1"),
        ("WH-1", "S-2"),
        ("WH-2", "S-2"),
    }

    lane_costs = {
        ("WH-1", "S-1"): 0.10,
        ("WH-1", "S-2"): 0.90,
        ("WH-2", "S-2"): 0.15,
    }

    lane_lead_times = {
        ("WH-1", "S-1"): 4.0,
        ("WH-1", "S-2"): 24.0,
        ("WH-2", "S-2"): 6.0,
    }

    lane_capacities = {
        ("WH-1", "S-1"): 100,
        ("WH-1", "S-2"): 100,
        ("WH-2", "S-2"): 100,
    }

    return {
        "warehouses": warehouses,
        "stores": stores,
        "products": products,
        "warehouse_stock": warehouse_stock,
        "store_inventory": store_inventory,
        "forecast_demand": forecast_demand,
        "valid_lanes": valid_lanes,
        "lane_costs": lane_costs,
        "lane_lead_times": lane_lead_times,
        "lane_capacities": lane_capacities,
    }


# 1. Small fixture with known optimal allocation
def test_known_optimal_allocation(optimization_fixture):
    f = optimization_fixture
    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
        planning_horizon_days=7,
        shortage_penalty_per_unit=100.0,
    )
    status, runtime, allocs, summaries, plan = optimizer.solve()

    assert status in ("OPTIMAL", "FEASIBLE")
    assert plan.total_unmet_demand_units == 0  # Total req is 30+40=70, total stock is 100
    assert plan.demand_fulfillment_rate == 100.0

    alloc_map = {(a.warehouse_id, a.store_id): a.allocated_units for a in allocs}
    # Optimal should ship 30 from WH-1 to S-1 (cheap lane 0.10)
    assert alloc_map.get(("WH-1", "S-1")) == 30
    # Optimal should ship 40 from WH-2 to S-2 (cheap lane 0.15)
    assert alloc_map.get(("WH-2", "S-2")) == 40
    # Nothing should be shipped along expensive lane WH-1 -> S-2 (0.90)
    assert alloc_map.get(("WH-1", "S-2"), 0) == 0


# 2. Warehouse inventory constraints (no phantom stock)
def test_warehouse_inventory_conservation(optimization_fixture):
    f = optimization_fixture
    # Reduce WH-1 stock to only 15 units (less than S-1 requirement of 30)
    f["warehouse_stock"][("WH-1", "SKU-1")] = 15

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    status, _, allocs, _, plan = optimizer.solve()

    alloc_map = {(a.warehouse_id, a.store_id): a.allocated_units for a in allocs}
    # WH-1 cannot ship more than its 15 available units
    assert alloc_map.get(("WH-1", "S-1"), 0) <= 15
    # Since WH-2 -> S-1 is disabled, S-1 must face a shortage of 15 units
    assert plan.total_unmet_demand_units == 15


# 3. Demand shortage calculation
def test_demand_shortage_calculation(optimization_fixture):
    f = optimization_fixture
    # Wipe out all warehouse inventory
    f["warehouse_stock"][("WH-1", "SKU-1")] = 0
    f["warehouse_stock"][("WH-2", "SKU-1")] = 0

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs, summaries, plan = optimizer.solve()

    assert len(allocs) == 0
    assert plan.total_allocated_units == 0
    # S-1 req=30, S-2 req=40 -> total shortage must equal 70
    assert plan.total_unmet_demand_units == 70
    assert plan.demand_fulfillment_rate == 0.0


# 4. Valid-lane enforcement
def test_valid_lane_enforcement(optimization_fixture):
    f = optimization_fixture
    # Lane WH-2 -> S-1 is not in valid_lanes
    assert ("WH-2", "S-1") not in f["valid_lanes"]

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs, _, _ = optimizer.solve()

    for a in allocs:
        assert (a.warehouse_id, a.store_id) in f["valid_lanes"]
        assert (a.warehouse_id, a.store_id) != ("WH-2", "S-1")


# 5. Store inventory accounting (net requirement = max(0, demand - on_hand))
def test_store_inventory_accounting(optimization_fixture):
    f = optimization_fixture
    # Store S-1 already has 100 on hand (> forecast 40) -> gross req = 0
    f["store_inventory"][("S-1", "SKU-1")] = 100

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs, summaries, plan = optimizer.solve()

    s1_summary = next(s for s in summaries if s.store_id == "S-1")
    assert s1_summary.gross_requirement == 0
    assert s1_summary.allocated_units == 0
    assert s1_summary.unmet_demand_units == 0


# 6. Integer and non-negative allocations
def test_integer_and_non_negative_allocations(optimization_fixture):
    f = optimization_fixture
    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs, _, _ = optimizer.solve()

    for a in allocs:
        assert isinstance(a.allocated_units, int)
        assert a.allocated_units >= 0


# 7. Multiple stores competing for limited stock
def test_multiple_stores_competing_for_limited_stock(optimization_fixture):
    f = optimization_fixture
    # Only WH-1 has 30 units total. S-1 needs 30, S-2 needs 40.
    f["warehouse_stock"][("WH-1", "SKU-1")] = 30
    f["warehouse_stock"][("WH-2", "SKU-1")] = 0

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs, _, plan = optimizer.solve()

    total_shipped = sum(a.allocated_units for a in allocs)
    assert total_shipped <= 30
    # Total shipped cannot exceed 30; S-1 lane cost is 0.10 vs S-2 lane cost 0.90,
    # so solver should ship all 30 to S-1
    alloc_map = {(a.warehouse_id, a.store_id): a.allocated_units for a in allocs}
    assert alloc_map.get(("WH-1", "S-1")) == 30
    assert alloc_map.get(("WH-1", "S-2"), 0) == 0


# 8. Baseline vs Optimized comparison
def test_baseline_vs_optimized_comparison(optimization_fixture):
    f = optimization_fixture
    # Give both methods enough stock to fulfill all demand
    _, _, opt_allocs, opt_summaries, opt_plan = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    ).solve()

    base_allocs, base_summaries, base_plan = solve_baseline_allocation(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )

    # Both fulfill 100% of demand in this symmetric case
    assert opt_plan.total_allocated_units == base_plan.total_allocated_units
    assert opt_plan.objective_score <= base_plan.objective_score


# 9. Independent feasibility validator detects deliberately invalid plans
def test_independent_validator_detects_invalid_plans(optimization_fixture):
    f = optimization_fixture
    allocations = [
        AllocationRecord(
            warehouse_id="WH-1",
            store_id="S-1",
            product_id="SKU-1",
            allocated_units=999,  # exceeds available 50
            unit_transport_cost=0.1,
            total_transport_cost=99.9,
            lead_time_hours=4.0,
        )
    ]
    summaries = [
        StoreProductDemandSummary(
            store_id="S-1",
            product_id="SKU-1",
            store_inventory_on_hand=10,
            forecast_demand_units=40,
            gross_requirement=30,
            allocated_units=999,
            unmet_demand_units=0,
        )
    ]

    report = validate_allocation_plan(
        allocations=allocations,
        store_summaries=summaries,
        warehouse_stock=f["warehouse_stock"],
        valid_lanes=f["valid_lanes"],
        lane_capacities=f["lane_capacities"],
        planning_horizon_days=7,
    )

    assert report.is_feasible is False
    assert report.violations_count >= 1
    assert any("stock exceeded" in err for err in report.errors)


# 10. Infeasible or invalid solver handling
def test_empty_lane_infeasible_behavior(optimization_fixture):
    f = optimization_fixture
    # Disable ALL valid lanes
    f["valid_lanes"] = set()

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    status, _, allocs, _, plan = optimizer.solve()

    assert len(allocs) == 0
    assert plan.total_allocated_units == 0
    assert plan.total_unmet_demand_units == 70


# 11. Deterministic output
def test_deterministic_solver_results(optimization_fixture):
    f = optimization_fixture
    opt1 = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs1, _, plan1 = opt1.solve()

    opt2 = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, allocs2, _, plan2 = opt2.solve()

    assert plan1.objective_score == plan2.objective_score
    assert len(allocs1) == len(allocs2)
    map1 = {(a.warehouse_id, a.store_id): a.allocated_units for a in allocs1}
    map2 = {(a.warehouse_id, a.store_id): a.allocated_units for a in allocs2}
    assert map1 == map2


# 12. API /optimize endpoint validation & status codes
def test_api_optimize_endpoint(client):
    # Valid optimization request
    req = {
        "horizon_days": 7,
        "stores": ["STORE-01", "STORE-02"],
        "products": ["SKU-001", "SKU-002"],
        "shortage_penalty_per_unit": 100.0,
        "solver_time_limit_seconds": 5.0,
    }
    response = client.post("/api/v1/optimize", json=req)
    assert response.status_code == 200

    data = OptimizeResponse(**response.json())
    assert data.status in ("OPTIMAL", "FEASIBLE")
    assert data.feasibility.is_feasible is True
    assert data.optimized_plan.total_forecast_demand > 0
    assert len(data.store_summaries) == 4  # 2 stores * 2 products

    # Invalid horizon validation
    bad_req = {"horizon_days": 0}
    bad_res = client.post("/api/v1/optimize", json=bad_req)
    assert bad_res.status_code == 422


# 13. Demand arithmetic reconciliation identity regression test
def test_demand_inventory_arithmetic_reconciliation(optimization_fixture):
    """Regression test ensuring demand arithmetic strictly adheres to:
    total_forecast_demand = total_effective_store_stock_utilized + total_gross_requirement
    and total_store_inventory_on_hand = total_effective_store_stock_utilized + total_surplus_store_stock.
    """
    f = optimization_fixture
    # S-1: demand=40, on_hand=10 -> gross_req=30, eff=10, surplus=0
    # S-2: demand=50, on_hand=100 -> gross_req=0, eff=50, surplus=50
    f["store_inventory"][("S-2", "SKU-1")] = 100

    optimizer = AllocationOptimizer(
        warehouse_stock=f["warehouse_stock"],
        store_inventory=f["store_inventory"],
        forecast_demand=f["forecast_demand"],
        valid_lanes=f["valid_lanes"],
        lane_costs=f["lane_costs"],
        lane_lead_times=f["lane_lead_times"],
        lane_capacities=f["lane_capacities"],
        stores=f["stores"],
        products=f["products"],
        warehouses=f["warehouses"],
    )
    _, _, _, _, plan = optimizer.solve()

    # Total demand = 40 + 50 = 90
    assert plan.total_forecast_demand == 90
    # Total store on hand = 10 + 100 = 110
    assert plan.total_store_inventory_on_hand == 110
    # Total gross requirement = 30 + 0 = 30
    assert plan.total_gross_requirement == 30
    # Total effective store stock = 10 + 50 = 60
    assert plan.total_effective_store_stock_utilized == 60
    # Total surplus store stock = 0 + 50 = 50
    assert plan.total_surplus_store_stock == 50

    # Strict Arithmetic Identities
    assert plan.total_forecast_demand == (
        plan.total_effective_store_stock_utilized + plan.total_gross_requirement
    )
    assert plan.total_store_inventory_on_hand == (
        plan.total_effective_store_stock_utilized + plan.total_surplus_store_stock
    )
    assert plan.total_gross_requirement - (
        plan.total_forecast_demand - plan.total_store_inventory_on_hand
    ) == plan.total_surplus_store_stock
