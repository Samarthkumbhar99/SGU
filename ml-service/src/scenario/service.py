"""Disruption scenario simulation and resilience analysis service."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import pandas as pd

from src.data.loader import load_dataset_bundle
from src.forecasting.service import ForecastingService
from src.optimization.optimizer import AllocationOptimizer
from src.optimization.validator import validate_allocation_plan
from src.schemas.forecasting import ForecastRequest
from src.schemas.scenario import (
    DisruptionItem,
    ResilienceInsights,
    ScenarioSimulateRequest,
    ScenarioSimulateResponse,
)


class ScenarioService:
    """Simulates disruption shocks on network topology and executes resilience recovery."""

    def __init__(self, dataset_dir: Path):
        self.dataset_dir = dataset_dir

    def _resolve_preset_disruptions(self, preset_id: str, scenarios_df: pd.DataFrame) -> Tuple[str, List[DisruptionItem]]:
        """Look up predefined scenario from scenarios.csv."""
        match = scenarios_df[scenarios_df["scenario_id"] == preset_id]
        if match.empty:
            raise ValueError(f"Preset scenario '{preset_id}' not found in scenarios.csv.")

        row = match.iloc[0]
        s_name = str(row["scenario_name"])
        raw_type = str(row["disruption_type"])
        target = str(row["target_id"])
        raw_val = row["change_value"]

        val: Optional[float] = None
        try:
            val = float(raw_val)
        except (ValueError, TypeError):
            val = None

        type_map = {
            "route_closure": "route_closure",
            "demand_spike": "demand_spike",
            "warehouse_stock_reduction": "warehouse_stock_reduction",
            "delivery_delay": "lane_capacity_reduction",  # modeled as capacity impact
        }

        if raw_type not in type_map:
            raise ValueError(
                f"Scenario '{preset_id}' uses unsupported or unimplemented disruption type '{raw_type}'."
            )

        disruption_item = DisruptionItem(
            disruption_type=type_map[raw_type],
            target_id=target,
            change_value=val,
        )
        return s_name, [disruption_item]

    def simulate_scenario(self, req: ScenarioSimulateRequest) -> ScenarioSimulateResponse:
        """Execute baseline solve, apply disruption shocks, re-optimize, and synthesize deltas."""
        bundle = load_dataset_bundle(self.dataset_dir)
        if (
            bundle.products is None
            or bundle.warehouses is None
            or bundle.stores is None
            or bundle.inventory_snapshot is None
            or bundle.transport_lanes is None
            or bundle.daily_demand is None
            or bundle.scenarios is None
        ):
            raise FileNotFoundError("One or more required dataset files are missing or unreadable.")

        # 1. Resolve Scenario Name and Disruptions
        scenario_name = req.scenario_name
        disruptions_to_apply = list(req.disruptions)

        if req.preset_scenario_id:
            preset_name, preset_items = self._resolve_preset_disruptions(
                req.preset_scenario_id, bundle.scenarios
            )
            scenario_name = f"{preset_name} ({req.preset_scenario_id})"
            disruptions_to_apply.extend(preset_items)

        if not disruptions_to_apply:
            raise ValueError("No disruptions provided. Specify 'preset_scenario_id' or 'disruptions'.")

        # 2. Extract Valid Entities
        all_warehouses = sorted(list(bundle.warehouses["warehouse_id"].unique()))
        all_stores = sorted(list(bundle.stores["store_id"].unique()))
        all_products = sorted(list(bundle.products["product_id"].unique()))

        active_stores = [s for s in (req.stores or all_stores) if s in all_stores]
        active_products = [p for p in (req.products or all_products) if p in all_products]

        # 3. Base Warehouse Stock & Store Inventory
        snap = bundle.inventory_snapshot
        base_wh_stock: Dict[Tuple[str, str], int] = {}
        base_st_inventory: Dict[Tuple[str, str], int] = {}

        for _, row in snap[snap["location_type"] == "warehouse"].iterrows():
            w = str(row["location_id"])
            p = str(row["product_id"])
            q_avail = max(0, int(row["quantity_on_hand"]) - int(row.get("quantity_reserved", 0)))
            if p in active_products:
                base_wh_stock[(w, p)] = q_avail

        for _, row in snap[snap["location_type"] == "store"].iterrows():
            s = str(row["location_id"])
            p = str(row["product_id"])
            if s in active_stores and p in active_products:
                base_st_inventory[(s, p)] = max(0, int(row["quantity_on_hand"]))

        # 4. Base Lanes
        base_valid_lanes: Set[Tuple[str, str]] = set()
        base_lane_costs: Dict[Tuple[str, str], float] = {}
        base_lane_lead_times: Dict[Tuple[str, str], float] = {}
        base_lane_capacities: Dict[Tuple[str, str], int] = {}

        all_lane_ids: Set[str] = set()

        for _, row in bundle.transport_lanes.iterrows():
            w = str(row["source_warehouse_id"])
            s = str(row["destination_store_id"])
            lane_id = str(row["lane_id"])
            all_lane_ids.add(lane_id)

            if str(row["availability_status"]).lower() == "available" and s in active_stores:
                lane_key = (w, s)
                base_valid_lanes.add(lane_key)
                base_lane_costs[lane_key] = float(row["unit_transport_cost"])
                base_lane_lead_times[lane_key] = float(row["lead_time_hours"])
                base_lane_capacities[lane_key] = int(row["capacity_units_per_day"])

        # 5. Base Forecast Demand
        forecasting_service = ForecastingService(self.dataset_dir)
        base_forecast_demand: Dict[Tuple[str, str], int] = {}

        for s in active_stores:
            for p in active_products:
                fc_req = ForecastRequest(
                    store_id=s,
                    product_id=p,
                    horizon_days=req.horizon_days,
                    model_type="moving_average",
                    window_days=14,
                )
                fc_res = forecasting_service.generate_forecast(fc_req)
                tot_d = int(round(sum(item.predicted_demand for item in fc_res.forecasts)))
                base_forecast_demand[(s, p)] = max(0, tot_d)

        # 6. Run Baseline Optimization (Undisrupted)
        base_optimizer = AllocationOptimizer(
            warehouse_stock=base_wh_stock,
            store_inventory=base_st_inventory,
            forecast_demand=base_forecast_demand,
            valid_lanes=base_valid_lanes,
            lane_costs=base_lane_costs,
            lane_lead_times=base_lane_lead_times,
            lane_capacities=base_lane_capacities,
            stores=active_stores,
            products=active_products,
            warehouses=all_warehouses,
            planning_horizon_days=req.horizon_days,
            shortage_penalty_per_unit=req.shortage_penalty_per_unit,
            transport_cost_multiplier=req.transport_cost_multiplier,
            solver_time_limit_seconds=req.solver_time_limit_seconds,
        )
        (
            base_status,
            base_runtime,
            base_allocs,
            base_summaries,
            base_plan,
        ) = base_optimizer.solve()

        base_feasibility = validate_allocation_plan(
            allocations=base_allocs,
            store_summaries=base_summaries,
            warehouse_stock=base_wh_stock,
            valid_lanes=base_valid_lanes,
            lane_capacities=base_lane_capacities,
            planning_horizon_days=req.horizon_days,
        )

        # 7. Apply Disruptions on In-Memory Copy
        disrupted_wh_stock = dict(base_wh_stock)
        disrupted_valid_lanes = set(base_valid_lanes)
        disrupted_lane_capacities = dict(base_lane_capacities)
        disrupted_forecast_demand = dict(base_forecast_demand)

        affected_warehouses: Set[str] = set()
        affected_stores: Set[str] = set()
        affected_products: Set[str] = set()
        affected_lanes: Set[str] = set()

        for item in disruptions_to_apply:
            target = item.target_id
            dtype = item.disruption_type

            if dtype == "warehouse_outage":
                if target not in all_warehouses:
                    raise ValueError(f"Unknown warehouse '{target}' for warehouse_outage.")
                affected_warehouses.add(target)
                # Remove warehouse from stock and disable inbound/outbound lanes
                for p in active_products:
                    disrupted_wh_stock[(target, p)] = 0
                disrupted_valid_lanes = {
                    (w, s) for (w, s) in disrupted_valid_lanes if w != target
                }

            elif dtype == "route_closure":
                # Target can be lane_id or W__S format
                parts = target.split("__")
                if len(parts) == 2:
                    w, s = parts[0], parts[1]
                else:
                    raise ValueError(f"Invalid route identifier '{target}'. Expected 'WAREHOUSE__STORE'.")
                if (w, s) not in base_valid_lanes:
                    raise ValueError(f"Route '{target}' is not an active lane.")
                affected_lanes.add(target)
                disrupted_valid_lanes.discard((w, s))

            elif dtype == "lane_capacity_reduction":
                parts = target.split("__")
                if len(parts) == 2:
                    w, s = parts[0], parts[1]
                else:
                    raise ValueError(f"Invalid lane identifier '{target}'. Expected 'WAREHOUSE__STORE'.")
                if (w, s) not in base_valid_lanes:
                    raise ValueError(f"Lane '{target}' is not an active lane.")
                factor = item.change_value if item.change_value is not None else 0.50
                if factor < 0.0 or factor > 1.0:
                    raise ValueError(f"Capacity factor {factor} must be between 0.0 and 1.0.")
                affected_lanes.add(target)
                disrupted_lane_capacities[(w, s)] = int(round(base_lane_capacities[(w, s)] * factor))

            elif dtype == "warehouse_stock_reduction":
                if target not in all_warehouses:
                    raise ValueError(f"Unknown warehouse '{target}' for warehouse_stock_reduction.")
                factor = item.change_value if item.change_value is not None else 0.50
                if factor < 0.0 or factor > 1.0:
                    raise ValueError(f"Stock reduction factor {factor} must be between 0.0 and 1.0.")
                affected_warehouses.add(target)
                for p in active_products:
                    old_stock = disrupted_wh_stock.get((target, p), 0)
                    disrupted_wh_stock[(target, p)] = int(round(old_stock * factor))

            elif dtype == "demand_spike":
                if target not in all_stores:
                    raise ValueError(f"Unknown store '{target}' for demand_spike.")
                mult = item.change_value if item.change_value is not None else 1.50
                if mult < 1.0 or mult > 5.0:
                    raise ValueError(f"Demand spike multiplier {mult} must be between 1.0 and 5.0.")
                affected_stores.add(target)
                for p in active_products:
                    old_dem = disrupted_forecast_demand.get((target, p), 0)
                    disrupted_forecast_demand[(target, p)] = int(round(old_dem * mult))

        # 8. Re-solve Optimizer on Disrupted Inputs
        disrupted_optimizer = AllocationOptimizer(
            warehouse_stock=disrupted_wh_stock,
            store_inventory=base_st_inventory,
            forecast_demand=disrupted_forecast_demand,
            valid_lanes=disrupted_valid_lanes,
            lane_costs=base_lane_costs,
            lane_lead_times=base_lane_lead_times,
            lane_capacities=disrupted_lane_capacities,
            stores=active_stores,
            products=active_products,
            warehouses=all_warehouses,
            planning_horizon_days=req.horizon_days,
            shortage_penalty_per_unit=req.shortage_penalty_per_unit,
            transport_cost_multiplier=req.transport_cost_multiplier,
            solver_time_limit_seconds=req.solver_time_limit_seconds,
        )
        (
            disrupted_status,
            disrupted_runtime,
            disrupted_allocs,
            disrupted_summaries,
            disrupted_plan,
        ) = disrupted_optimizer.solve()

        disrupted_feasibility = validate_allocation_plan(
            allocations=disrupted_allocs,
            store_summaries=disrupted_summaries,
            warehouse_stock=disrupted_wh_stock,
            valid_lanes=disrupted_valid_lanes,
            lane_capacities=disrupted_lane_capacities,
            planning_horizon_days=req.horizon_days,
        )

        # 9. Calculate Delta Vectors (Disrupted - Baseline)
        delta_metrics = {
            "demand_delta_units": disrupted_plan.total_forecast_demand - base_plan.total_forecast_demand,
            "allocated_units_delta": disrupted_plan.total_allocated_units - base_plan.total_allocated_units,
            "unmet_demand_delta_units": disrupted_plan.total_unmet_demand_units - base_plan.total_unmet_demand_units,
            "fulfillment_rate_delta_pct": round(disrupted_plan.demand_fulfillment_rate - base_plan.demand_fulfillment_rate, 2),
            "transport_cost_delta_dollars": round(disrupted_plan.total_transport_cost - base_plan.total_transport_cost, 2),
            "objective_score_delta": round(disrupted_plan.objective_score - base_plan.objective_score, 2),
        }

        # 10. Synthesize Resilience Insights & Root Bottlenecks
        shortage_by_store: Dict[str, int] = {}
        shortage_by_product: Dict[str, int] = {}

        # Compare per-store shortage deltas
        base_summary_map = {(s.store_id, s.product_id): s.unmet_demand_units for s in base_summaries}
        for d_sum in disrupted_summaries:
            base_unmet = base_summary_map.get((d_sum.store_id, d_sum.product_id), 0)
            diff = d_sum.unmet_demand_units - base_unmet
            if diff > 0:
                shortage_by_store[d_sum.store_id] = shortage_by_store.get(d_sum.store_id, 0) + diff
                shortage_by_product[d_sum.product_id] = shortage_by_product.get(d_sum.product_id, 0) + diff

        top_stores = sorted(shortage_by_store.keys(), key=lambda s: shortage_by_store[s], reverse=True)[:3]
        top_products = sorted(shortage_by_product.keys(), key=lambda p: shortage_by_product[p], reverse=True)[:3]

        # Determine primary constraint bottleneck
        if affected_warehouses and delta_metrics["unmet_demand_delta_units"] > 0:
            bottleneck = f"Supply constraint: Warehouse capacity/outage at {sorted(list(affected_warehouses))}"
        elif affected_lanes and delta_metrics["transport_cost_delta_dollars"] > 0:
            bottleneck = f"Network topology bottleneck: Lane disruption on {sorted(list(affected_lanes))}"
        elif affected_stores and delta_metrics["demand_delta_units"] > 0:
            bottleneck = f"Demand surge at stores: {sorted(list(affected_stores))}"
        else:
            bottleneck = "Network absorption: Alternate hubs/lanes rerouted flow without major shortages"

        exec_summary = (
            f"Under scenario '{scenario_name}', fulfillment rate moved from "
            f"{base_plan.demand_fulfillment_rate}% to {disrupted_plan.demand_fulfillment_rate}%. "
            f"Net additional shortages: +{delta_metrics['unmet_demand_delta_units']} units. "
            f"Transport cost delta: ${delta_metrics['transport_cost_delta_dollars']}. "
            f"Disrupted plan solved with status '{disrupted_status}' (Feasible: {disrupted_feasibility.is_feasible})."
        )

        insights = ResilienceInsights(
            primary_bottleneck=bottleneck,
            net_additional_unmet_units=delta_metrics["unmet_demand_delta_units"],
            freight_cost_delta_dollars=delta_metrics["transport_cost_delta_dollars"],
            top_shortage_stores=top_stores,
            top_shortage_products=top_products,
            is_disrupted_plan_feasible=disrupted_feasibility.is_feasible,
            solver_status=disrupted_status,
            executive_summary=exec_summary,
        )

        return ScenarioSimulateResponse(
            scenario_name=scenario_name,
            applied_disruptions=disruptions_to_apply,
            affected_entities={
                "warehouses": sorted(list(affected_warehouses)),
                "stores": sorted(list(affected_stores)),
                "products": sorted(list(affected_products)),
                "lanes": sorted(list(affected_lanes)),
            },
            baseline_plan=base_plan,
            disrupted_plan=disrupted_plan,
            delta_metrics=delta_metrics,
            baseline_feasibility=base_feasibility,
            disrupted_feasibility=disrupted_feasibility,
            baseline_runtime_seconds=base_runtime,
            disrupted_runtime_seconds=disrupted_runtime,
            disrupted_allocations=disrupted_allocs,
            resilience_insights=insights,
            warnings=list(disrupted_feasibility.warnings),
        )
