"""Optimization service orchestrator connecting forecasting, CP-SAT solver, baseline, and feasibility audit."""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import pandas as pd

from src.data.loader import load_dataset_bundle
from src.forecasting.service import ForecastingService
from src.optimization.baseline import solve_baseline_allocation
from src.optimization.optimizer import AllocationOptimizer
from src.optimization.validator import validate_allocation_plan
from src.schemas.forecasting import ForecastRequest
from src.schemas.optimization import (
    AllocationRecord,
    FeasibilityReport,
    OptimizeRequest,
    OptimizeResponse,
    PlanSummary,
    StoreProductDemandSummary,
)


class OptimizationService:
    """High-level service coordinating optimization runs."""

    def __init__(self, dataset_dir: Path):
        self.dataset_dir = dataset_dir

    def run_optimization(self, req: OptimizeRequest) -> OptimizeResponse:
        """Execute end-to-end allocation optimization and baseline comparison."""
        bundle = load_dataset_bundle(self.dataset_dir)
        if (
            bundle.products is None
            or bundle.warehouses is None
            or bundle.stores is None
            or bundle.inventory_snapshot is None
            or bundle.transport_lanes is None
            or bundle.daily_demand is None
        ):
            raise FileNotFoundError("One or more required dataset files are missing or unreadable.")

        # 1. Determine active entity sets
        all_stores = sorted(list(bundle.stores["store_id"].unique()))
        all_products = sorted(list(bundle.products["product_id"].unique()))
        all_warehouses = sorted(list(bundle.warehouses["warehouse_id"].unique()))

        active_stores = [s for s in (req.stores or all_stores) if s in all_stores]
        active_products = [p for p in (req.products or all_products) if p in all_products]

        if not active_stores:
            raise ValueError(f"Requested stores {req.stores} not found in store catalog.")
        if not active_products:
            raise ValueError(f"Requested products {req.products} not found in product catalog.")

        # 2. Extract Inventory Snapshots
        snap = bundle.inventory_snapshot
        warehouse_stock: Dict[Tuple[str, str], int] = {}
        store_inventory: Dict[Tuple[str, str], int] = {}

        for _, row in snap[snap["location_type"] == "warehouse"].iterrows():
            w_id = str(row["location_id"])
            p_id = str(row["product_id"])
            q_avail = max(0, int(row["quantity_on_hand"]) - int(row.get("quantity_reserved", 0)))
            if p_id in active_products:
                warehouse_stock[(w_id, p_id)] = q_avail

        for _, row in snap[snap["location_type"] == "store"].iterrows():
            s_id = str(row["location_id"])
            p_id = str(row["product_id"])
            q_on_hand = max(0, int(row["quantity_on_hand"]))
            if s_id in active_stores and p_id in active_products:
                store_inventory[(s_id, p_id)] = q_on_hand

        # 3. Extract Transport Lanes
        valid_lanes: Set[Tuple[str, str]] = set()
        lane_costs: Dict[Tuple[str, str], float] = {}
        lane_lead_times: Dict[Tuple[str, str], float] = {}
        lane_capacities: Dict[Tuple[str, str], int] = {}

        for _, row in bundle.transport_lanes.iterrows():
            w_id = str(row["source_warehouse_id"])
            s_id = str(row["destination_store_id"])
            avail = str(row["availability_status"]).lower()

            if avail == "available" and s_id in active_stores:
                lane_key = (w_id, s_id)
                valid_lanes.add(lane_key)
                lane_costs[lane_key] = float(row["unit_transport_cost"])
                lane_lead_times[lane_key] = float(row["lead_time_hours"])
                lane_capacities[lane_key] = int(row["capacity_units_per_day"])

        # 4. Generate Demand Forecasts over planning horizon
        forecasting_service = ForecastingService(self.dataset_dir, daily_demand=bundle.daily_demand)
        forecast_demand: Dict[Tuple[str, str], int] = {}
        forecast_origin = str(bundle.daily_demand["date"].max())

        for s_id in active_stores:
            for p_id in active_products:
                # Fast historical average / moving average forecast for horizon
                fc_req = ForecastRequest(
                    store_id=s_id,
                    product_id=p_id,
                    horizon_days=req.horizon_days,
                    model_type="moving_average",
                    window_days=14,
                )
                fc_res = forecasting_service.generate_forecast(fc_req)
                # Sum daily predictions over horizon and round to integer units
                tot_demand = int(round(sum(item.predicted_demand for item in fc_res.forecasts)))
                forecast_demand[(s_id, p_id)] = max(0, tot_demand)

        # 5. Solve CP-SAT Optimal Plan
        optimizer = AllocationOptimizer(
            warehouse_stock=warehouse_stock,
            store_inventory=store_inventory,
            forecast_demand=forecast_demand,
            valid_lanes=valid_lanes,
            lane_costs=lane_costs,
            lane_lead_times=lane_lead_times,
            lane_capacities=lane_capacities,
            stores=active_stores,
            products=active_products,
            warehouses=all_warehouses,
            planning_horizon_days=req.horizon_days,
            shortage_penalty_per_unit=req.shortage_penalty_per_unit,
            transport_cost_multiplier=req.transport_cost_multiplier,
            solver_time_limit_seconds=req.solver_time_limit_seconds,
        )
        status_str, runtime, opt_allocs, opt_summaries, opt_plan = optimizer.solve()

        # 6. Solve Deterministic Baseline Plan (on identical inputs)
        base_allocs, base_summaries, base_plan = solve_baseline_allocation(
            warehouse_stock=warehouse_stock,
            store_inventory=store_inventory,
            forecast_demand=forecast_demand,
            valid_lanes=valid_lanes,
            lane_costs=lane_costs,
            lane_lead_times=lane_lead_times,
            stores=active_stores,
            products=active_products,
            warehouses=all_warehouses,
            shortage_penalty_per_unit=req.shortage_penalty_per_unit,
            transport_cost_multiplier=req.transport_cost_multiplier,
        )

        # 7. Independent Feasibility Validation on Optimized Plan
        feasibility = validate_allocation_plan(
            allocations=opt_allocs,
            store_summaries=opt_summaries,
            warehouse_stock=warehouse_stock,
            valid_lanes=valid_lanes,
            lane_capacities=lane_capacities,
            planning_horizon_days=req.horizon_days,
        )

        # 8. Compute Comparative Deltas
        delta_metrics = {
            "unmet_demand_reduction_units": base_plan.total_unmet_demand_units - opt_plan.total_unmet_demand_units,
            "transport_cost_difference_dollars": round(opt_plan.total_transport_cost - base_plan.total_transport_cost, 2),
            "objective_penalty_reduction": round(base_plan.objective_score - opt_plan.objective_score, 2),
            "fulfillment_rate_gain_pct": round(opt_plan.demand_fulfillment_rate - base_plan.demand_fulfillment_rate, 2),
        }

        warnings: List[str] = list(feasibility.warnings)
        if opt_plan.total_unmet_demand_units > 0:
            warnings.append(
                f"Residual shortage exists: network supply is insufficient to fulfill {opt_plan.total_unmet_demand_units} units."
            )

        return OptimizeResponse(
            status=status_str,
            planning_horizon_days=req.horizon_days,
            forecast_origin=forecast_origin,
            solver_runtime_seconds=runtime,
            optimized_plan=opt_plan,
            baseline_plan=base_plan,
            delta_metrics=delta_metrics,
            allocations=opt_allocs,
            store_summaries=opt_summaries,
            feasibility=feasibility,
            warnings=warnings,
        )
