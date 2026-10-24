"""Deterministic baseline demand-first inventory allocation."""

from typing import Dict, List, Set, Tuple
from src.schemas.optimization import AllocationRecord, PlanSummary, StoreProductDemandSummary


def solve_baseline_allocation(
    warehouse_stock: Dict[Tuple[str, str], int],
    store_inventory: Dict[Tuple[str, str], int],
    forecast_demand: Dict[Tuple[str, str], int],
    valid_lanes: Set[Tuple[str, str]],
    lane_costs: Dict[Tuple[str, str], float],
    lane_lead_times: Dict[Tuple[str, str], float],
    stores: List[str],
    products: List[str],
    warehouses: List[str],
    shortage_penalty_per_unit: float = 100.0,
    transport_cost_multiplier: float = 1.0,
) -> Tuple[List[AllocationRecord], List[StoreProductDemandSummary], PlanSummary]:
    """Execute deterministic greedy demand-first allocation baseline.

    Heuristic Rule:
    1. For each store-SKU with unmet requirement (forecast - on_hand > 0):
    2. Sort candidate warehouses by transport cost ascending.
    3. Greedily allocate available warehouse stock along valid lanes until requirement is met or stock depleted.

    Respects identical physical constraints (warehouse stock and lane validity).

    Returns:
        (allocations, store_summaries, plan_summary)
    """
    remaining_wh_stock = dict(warehouse_stock)
    allocations: List[AllocationRecord] = []
    store_summaries: List[StoreProductDemandSummary] = []

    total_forecast = 0
    total_store_on_hand = 0
    total_gross_req = 0
    total_allocated = 0
    total_unmet = 0
    total_transport_cost = 0.0

    for s_id in sorted(stores):
        for p_id in sorted(products):
            f_demand = forecast_demand.get((s_id, p_id), 0)
            on_hand = store_inventory.get((s_id, p_id), 0)
            gross_req = max(0, f_demand - on_hand)

            total_forecast += f_demand
            total_store_on_hand += on_hand
            total_gross_req += gross_req

            needed = gross_req
            shipped_to_store_sku = 0

            # Find valid candidate warehouses sorted by unit transport cost ascending
            candidate_whs = [w for w in warehouses if (w, s_id) in valid_lanes]
            candidate_whs.sort(key=lambda w: (lane_costs.get((w, s_id), float("inf")), w))

            for w_id in candidate_whs:
                if needed <= 0:
                    break
                avail = remaining_wh_stock.get((w_id, p_id), 0)
                if avail > 0:
                    ship = min(needed, avail)
                    remaining_wh_stock[(w_id, p_id)] -= ship
                    needed -= ship
                    shipped_to_store_sku += ship

                    cost = lane_costs.get((w_id, s_id), 0.0)
                    lead_time = lane_lead_times.get((w_id, s_id), 0.0)
                    tot_lane_cost = round(ship * cost, 4)
                    total_transport_cost += tot_lane_cost

                    allocations.append(
                        AllocationRecord(
                            warehouse_id=w_id,
                            store_id=s_id,
                            product_id=p_id,
                            allocated_units=ship,
                            unit_transport_cost=cost,
                            total_transport_cost=tot_lane_cost,
                            lead_time_hours=lead_time,
                        )
                    )

            unmet = max(0, gross_req - shipped_to_store_sku)
            total_allocated += shipped_to_store_sku
            total_unmet += unmet

            store_summaries.append(
                StoreProductDemandSummary(
                    store_id=s_id,
                    product_id=p_id,
                    store_inventory_on_hand=on_hand,
                    forecast_demand_units=f_demand,
                    gross_requirement=gross_req,
                    allocated_units=shipped_to_store_sku,
                    unmet_demand_units=unmet,
                )
            )

    total_wh_avail = sum(warehouse_stock.values())
    fulfillment_rate = (
        round((total_allocated / total_gross_req) * 100.0, 2) if total_gross_req > 0 else 100.0
    )

    # Objective score matching CP-SAT weights
    objective_score = round(
        (total_unmet * shortage_penalty_per_unit) + (total_transport_cost * transport_cost_multiplier),
        2,
    )

    total_effective_store_stock = sum(
        min(forecast_demand.get((s, p), 0), store_inventory.get((s, p), 0))
        for s in stores for p in products
    )
    total_surplus_store_stock = sum(
        max(0, store_inventory.get((s, p), 0) - forecast_demand.get((s, p), 0))
        for s in stores for p in products
    )

    overall_satisfied_rate = (
        round(((total_effective_store_stock + total_allocated) / total_forecast) * 100.0, 2)
        if total_forecast > 0 else 100.0
    )

    summary = PlanSummary(
        total_forecast_demand=total_forecast,
        total_store_inventory_on_hand=total_store_on_hand,
        total_effective_store_stock_utilized=total_effective_store_stock,
        total_surplus_store_stock=total_surplus_store_stock,
        total_gross_requirement=total_gross_req,
        total_warehouse_stock_available=total_wh_avail,
        total_allocated_units=total_allocated,
        total_unmet_demand_units=total_unmet,
        total_transport_cost=round(total_transport_cost, 2),
        demand_fulfillment_rate=fulfillment_rate,
        overall_demand_satisfied_rate=overall_satisfied_rate,
        objective_score=objective_score,
    )

    return allocations, store_summaries, summary
