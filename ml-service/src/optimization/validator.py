"""Independent feasibility validation for inventory allocation plans."""

from typing import Dict, List, Set, Tuple
from src.schemas.optimization import AllocationRecord, FeasibilityReport, StoreProductDemandSummary


def validate_allocation_plan(
    allocations: List[AllocationRecord],
    store_summaries: List[StoreProductDemandSummary],
    warehouse_stock: Dict[Tuple[str, str], int],
    valid_lanes: Set[Tuple[str, str]],
    lane_capacities: Dict[Tuple[str, str], int],
    planning_horizon_days: int,
) -> FeasibilityReport:
    """Independently audit an allocation plan against all mathematical and operational rules.

    Does not trust the solver or baseline output: directly re-calculates inventory balances,
    lane constraints, non-negativity, and shortage quantities.

    Args:
        allocations: List of allocated shipments.
        store_summaries: List of store replenishment reconciliations.
        warehouse_stock: Mapping of (warehouse_id, product_id) -> available stock units.
        valid_lanes: Set of available (warehouse_id, store_id) pairs.
        lane_capacities: Mapping of (warehouse_id, store_id) -> daily capacity units.
        planning_horizon_days: Number of days in planning horizon.

    Returns:
        FeasibilityReport indicating whether all constraints hold with zero violations.
    """
    errors: List[str] = []
    warnings: List[str] = []

    # 1. Non-negativity & Lane Validity
    wh_dispatches: Dict[Tuple[str, str], int] = {}
    lane_totals: Dict[Tuple[str, str], int] = {}
    store_sku_received: Dict[Tuple[str, str], int] = {}

    seen_records: Set[Tuple[str, str, str]] = set()

    for alloc in allocations:
        record_key = (alloc.warehouse_id, alloc.store_id, alloc.product_id)
        if record_key in seen_records:
            errors.append(f"Duplicate allocation record found for key: {record_key}")
        seen_records.add(record_key)

        if alloc.allocated_units < 0:
            errors.append(f"Negative allocation of {alloc.allocated_units} units for {record_key}")

        lane_key = (alloc.warehouse_id, alloc.store_id)
        if lane_key not in valid_lanes:
            errors.append(f"Shipment allocated along invalid or unavailable lane: {lane_key}")

        # Accumulators
        wh_key = (alloc.warehouse_id, alloc.product_id)
        wh_dispatches[wh_key] = wh_dispatches.get(wh_key, 0) + alloc.allocated_units

        lane_totals[lane_key] = lane_totals.get(lane_key, 0) + alloc.allocated_units

        st_sku_key = (alloc.store_id, alloc.product_id)
        store_sku_received[st_sku_key] = store_sku_received.get(st_sku_key, 0) + alloc.allocated_units

    # 2. Warehouse Stock Limits (No Phantom Stock)
    for (w_id, p_id), shipped in wh_dispatches.items():
        avail = warehouse_stock.get((w_id, p_id), 0)
        if shipped > avail:
            errors.append(
                f"Warehouse '{w_id}' stock exceeded for SKU '{p_id}': dispatched {shipped} > available {avail}"
            )

    # 3. Lane Capacity Bounds over Planning Horizon
    for (w_id, s_id), total_shipped in lane_totals.items():
        daily_cap = lane_capacities.get((w_id, s_id), float("inf"))
        max_horizon_cap = daily_cap * planning_horizon_days
        if total_shipped > max_horizon_cap:
            warnings.append(
                f"Lane ({w_id} -> {s_id}) shipped {total_shipped} units exceeding cumulative horizon capacity of {max_horizon_cap}"
            )

    # 4. Reconciliation with Store Summaries
    for summary in store_summaries:
        st_sku_key = (summary.store_id, summary.product_id)
        received = store_sku_received.get(st_sku_key, 0)

        if received != summary.allocated_units:
            errors.append(
                f"Reconciliation mismatch for ({summary.store_id}, {summary.product_id}): "
                f"summary states {summary.allocated_units} allocated, but sum of shipments is {received}"
            )

        expected_gross_req = max(0, summary.forecast_demand_units - summary.store_inventory_on_hand)
        if summary.gross_requirement != expected_gross_req:
            errors.append(
                f"Gross requirement calculation error for ({summary.store_id}, {summary.product_id}): "
                f"expected {expected_gross_req}, got {summary.gross_requirement}"
            )

        expected_unmet = max(0, expected_gross_req - summary.allocated_units)
        if summary.unmet_demand_units != expected_unmet:
            errors.append(
                f"Unmet demand calculation error for ({summary.store_id}, {summary.product_id}): "
                f"expected {expected_unmet}, got {summary.unmet_demand_units}"
            )

        if summary.allocated_units > expected_gross_req:
            warnings.append(
                f"Over-allocation for ({summary.store_id}, {summary.product_id}): "
                f"allocated {summary.allocated_units} > gross requirement {expected_gross_req}"
            )

    return FeasibilityReport(
        is_feasible=(len(errors) == 0),
        violations_count=len(errors),
        errors=errors,
        warnings=warnings,
    )
