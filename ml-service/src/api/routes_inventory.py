"""Inventory planning and health API routes for SupplyShield AI ML Service."""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
import pandas as pd

from src.inventory.planning import (
    DemandProfile,
    InventoryPlanner,
    InventoryPosition,
    ReplenishmentRecommendation,
)

router = APIRouter(prefix="/inventory", tags=["Inventory Planning"])


class ReplenishmentPlanRequest(BaseModel):
    """Batch replenishment evaluation request."""

    items: List[Dict[str, Any]] = Field(
        ...,
        description="List of combined position and demand profile records",
    )
    review_horizon_days: int = Field(default=7, ge=1, le=60)


class ReplenishmentPlanResponse(BaseModel):
    """Batch replenishment evaluation response."""

    total_items_evaluated: int
    reorder_triggered_count: int
    critical_shortage_count: int
    total_recommended_order_units: int
    total_estimated_procurement_cost: float
    recommendations: List[ReplenishmentRecommendation]


@router.post(
    "/plan",
    response_model=ReplenishmentPlanResponse,
    summary="Compute Replenishment Plan",
    description="Calculates safety stock, ROP, and batch-constrained ROQ for multiple SKUs.",
)
def compute_inventory_plan(req: ReplenishmentPlanRequest) -> ReplenishmentPlanResponse:
    """Evaluate replenishment requirements using continuous-review policy."""
    recs: List[ReplenishmentRecommendation] = []
    reorder_count = 0
    critical_count = 0
    total_units = 0
    total_cost = 0.0

    for item in req.items:
        try:
            pos = InventoryPosition(
                sku_id=str(item.get("sku_id", "UNKNOWN")),
                location_id=str(item.get("location_id", "UNKNOWN")),
                on_hand_quantity=int(item.get("on_hand_quantity", 0)),
                reserved_quantity=int(item.get("reserved_quantity", 0)),
                in_transit_quantity=int(item.get("in_transit_quantity", 0)),
                reorder_point=item.get("reorder_point"),
                target_stock=item.get("target_stock"),
                unit_cost=float(item.get("unit_cost", 1.0)),
                pack_size=int(item.get("pack_size", 1)),
                minimum_order_quantity=int(item.get("minimum_order_quantity", 1)),
            )
            prof = DemandProfile(
                avg_daily_demand=float(item.get("avg_daily_demand", 10.0)),
                std_daily_demand=float(item.get("std_daily_demand", 3.0)),
                supplier_lead_time_days=float(item.get("supplier_lead_time_days", 7.0)),
                lead_time_std_days=float(item.get("lead_time_std_days", 0.0)),
                service_level=float(item.get("service_level", 0.95)),
            )
            rec = InventoryPlanner.compute_replenishment(
                position=pos,
                profile=prof,
                review_horizon_days=req.review_horizon_days,
            )
            recs.append(rec)
            if rec.is_reorder_triggered:
                reorder_count += 1
            if rec.urgency_level == "CRITICAL_SHORTAGE":
                critical_count += 1
            total_units += rec.recommended_order_quantity
            total_cost += rec.estimated_procurement_cost
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid inventory planning input item: {str(exc)}",
            )

    return ReplenishmentPlanResponse(
        total_items_evaluated=len(recs),
        reorder_triggered_count=reorder_count,
        critical_shortage_count=critical_count,
        total_recommended_order_units=total_units,
        total_estimated_procurement_cost=round(total_cost, 2),
        recommendations=recs,
    )


@router.get(
    "/health",
    summary="Facility Inventory Health Status",
    description="Evaluates stock postures across warehouses using canonical processed dataset metrics.",
)
def get_inventory_health(
    location_id: Optional[str] = Query(None, description="Optional warehouse ID filter"),
    service_level: float = Query(0.95, ge=0.50, le=0.999),
) -> Dict[str, Any]:
    """Retrieve inventory health posture across facilities."""
    repo_root = Path(__file__).resolve().parents[3]
    parquet_path = repo_root / "data" / "processed" / "supply_chain_daily.parquet"

    if not parquet_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canonical parquet dataset not found. Run python -m src.data.canonical first.",
        )

    df = pd.read_parquet(parquet_path)
    if location_id:
        df = df[df["warehouse_id"] == location_id]
        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No records found for warehouse '{location_id}'.",
            )

    # Compute latest stock posture per SKU-warehouse
    latest_date = df["date"].max()
    latest_df = df[df["date"] == latest_date]

    # Compute 30-day demand statistics
    cutoff_date = latest_date - pd.Timedelta(days=30)
    recent_df = df[df["date"] >= cutoff_date]

    demand_stats = recent_df.groupby(["warehouse_id", "sku_id"])["units_sold"].agg(["mean", "std"]).reset_index()

    health_records = []
    total_on_hand = 0
    at_risk_count = 0

    for _, row in latest_df.iterrows():
        wh = str(row["warehouse_id"])
        sku = str(row["sku_id"])
        on_hand = int(row["inventory_level"])
        lt = float(row.get("lead_time_days", 7.0))
        unit_cost = float(row.get("unit_cost", 10.0))

        stat_match = demand_stats[(demand_stats["warehouse_id"] == wh) & (demand_stats["sku_id"] == sku)]
        avg_d = float(stat_match["mean"].iloc[0]) if not stat_match.empty else 15.0
        std_d = float(stat_match["std"].iloc[0]) if not stat_match.empty else 4.0

        pos = InventoryPosition(
            sku_id=sku,
            location_id=wh,
            on_hand_quantity=on_hand,
            unit_cost=unit_cost,
        )
        prof = DemandProfile(
            avg_daily_demand=avg_d,
            std_daily_demand=std_d,
            supplier_lead_time_days=lt,
            service_level=service_level,
        )
        rec = InventoryPlanner.compute_replenishment(pos, prof)
        total_on_hand += on_hand
        if rec.is_reorder_triggered:
            at_risk_count += 1

        health_records.append(rec)

    return {
        "status": "HEALTHY" if at_risk_count == 0 else "ACTION_REQUIRED",
        "as_of_date": str(latest_date),
        "total_sku_locations_audited": len(health_records),
        "total_units_on_hand": total_on_hand,
        "sku_locations_triggering_reorder": at_risk_count,
        "service_level": service_level,
        "details": health_records[:50],  # sample preview
    }


class InventorySimulationRequest(BaseModel):
    """Dynamic multi-day inventory simulation parameters."""

    sku_id: str = Field(default="SKU-001")
    location_id: str = Field(default="WH-CENTRAL")
    starting_on_hand: int = Field(default=350, ge=0)
    avg_daily_demand: float = Field(default=22.0, ge=0.1)
    std_daily_demand: float = Field(default=4.5, ge=0.0)
    supplier_lead_time_days: float = Field(default=5.0, ge=1.0)
    lead_time_delay_days: float = Field(default=0.0, ge=0.0)
    demand_multiplier: float = Field(default=1.0, ge=0.1, le=5.0)
    service_level: float = Field(default=0.95, ge=0.50, le=0.999)
    pack_size: int = Field(default=10, ge=1)
    minimum_order_quantity: int = Field(default=50, ge=1)
    review_horizon_days: int = Field(default=30, ge=7, le=60)
    enable_replenishment: bool = Field(default=True)


class DailySimulationStep(BaseModel):
    day: int
    demand: float
    starting_stock: int
    order_arrived: int
    units_sold: int
    ending_stock: int
    net_inventory: int
    unmanaged_ending_stock: int
    is_stockout: bool
    unmet_demand: int
    reorder_point: int
    safety_stock: int


class InventorySimulationResponse(BaseModel):
    sku_id: str
    location_id: str
    safety_stock: int
    reorder_point: int
    recommended_order_quantity: int
    effective_lead_time_days: float
    effective_daily_demand: float
    total_simulated_demand: int
    managed_total_fulfilled: int
    managed_total_unmet: int
    managed_service_level_achieved: float
    managed_min_stock: int
    unmanaged_stockout_day: Optional[int]
    unmanaged_total_unmet: int
    replenishment_orders_count: int
    timeline: List[DailySimulationStep]


@router.post(
    "/simulate",
    response_model=InventorySimulationResponse,
    summary="Simulate Multi-Day Inventory Trajectory",
    description="Simulates day-over-day stock depletion, demand surge shocks, lead-time delay, and replenishment reorders.",
)
def simulate_inventory_trajectory(req: InventorySimulationRequest) -> InventorySimulationResponse:
    """Execute dynamic day-by-day inventory trajectory simulation."""
    effective_lt = req.supplier_lead_time_days + req.lead_time_delay_days
    effective_mu = req.avg_daily_demand * req.demand_multiplier

    profile = DemandProfile(
        avg_daily_demand=effective_mu,
        std_daily_demand=req.std_daily_demand,
        supplier_lead_time_days=effective_lt,
        service_level=req.service_level,
    )
    rop, ltd, ss = InventoryPlanner.calculate_reorder_point(profile)

    # Calculate ROQ
    pos = InventoryPosition(
        sku_id=req.sku_id,
        location_id=req.location_id,
        on_hand_quantity=req.starting_on_hand,
        reorder_point=rop,
        pack_size=req.pack_size,
        minimum_order_quantity=req.minimum_order_quantity,
    )
    init_plan = InventoryPlanner.compute_replenishment(pos, profile, review_horizon_days=7)
    roq = max(init_plan.recommended_order_quantity, req.minimum_order_quantity)

    # State tracking
    stock = req.starting_on_hand
    unmanaged_stock = req.starting_on_hand
    unmanaged_stockout_day: Optional[int] = None
    unmanaged_unmet = 0

    in_transit_orders: List[Dict[str, Any]] = []
    timeline: List[DailySimulationStep] = []

    total_demand = 0
    managed_fulfilled = 0
    managed_unmet = 0
    min_stock = stock
    order_count = 0

    # Weekly seasonality factors (Sun-Sat)
    seasonality = [0.85, 0.95, 1.0, 1.05, 1.15, 1.25, 0.9]

    for day in range(1, req.review_horizon_days + 1):
        # 1. Seasonality adjusted demand
        weekday_idx = (day - 1) % 7
        daily_d = round(effective_mu * seasonality[weekday_idx], 1)
        total_demand += int(round(daily_d))

        # 2. Check scheduled order arrivals for today
        arrived_units = 0
        remaining_in_transit = []
        for order in in_transit_orders:
            if order["arrival_day"] <= day:
                arrived_units += order["quantity"]
            else:
                remaining_in_transit.append(order)
        in_transit_orders = remaining_in_transit

        # Managed starting stock
        start_stock = stock + arrived_units

        # 3. Fulfillment
        sold = min(start_stock, int(round(daily_d)))
        unmet = max(0, int(round(daily_d)) - start_stock)
        stock = max(0, start_stock - sold)
        managed_fulfilled += sold
        managed_unmet += unmet
        min_stock = min(min_stock, stock)

        # 4. Unmanaged tracking (no replenishment ever)
        unmanaged_sold = min(unmanaged_stock, int(round(daily_d)))
        unmanaged_stock = max(0, unmanaged_stock - unmanaged_sold)
        if unmanaged_stock == 0 and unmanaged_stockout_day is None:
            unmanaged_stockout_day = day
        unmanaged_unmet += max(0, int(round(daily_d)) - unmanaged_sold)

        # 5. Check if reorder triggered
        in_transit_total = sum(o["quantity"] for o in in_transit_orders)
        net_inv = stock + in_transit_total

        if req.enable_replenishment and net_inv <= rop:
            # Place replenishment order
            arrival = day + int(round(effective_lt))
            in_transit_orders.append({"quantity": roq, "arrival_day": arrival})
            order_count += 1

        timeline.append(
            DailySimulationStep(
                day=day,
                demand=daily_d,
                starting_stock=start_stock,
                order_arrived=arrived_units,
                units_sold=sold,
                ending_stock=stock,
                net_inventory=net_inv,
                unmanaged_ending_stock=unmanaged_stock,
                is_stockout=stock == 0 and daily_d > 0,
                unmet_demand=unmet,
                reorder_point=rop,
                safety_stock=ss,
            )
        )

    service_level_achieved = (
        round((managed_fulfilled / total_demand) * 100.0, 1) if total_demand > 0 else 100.0
    )

    return InventorySimulationResponse(
        sku_id=req.sku_id,
        location_id=req.location_id,
        safety_stock=ss,
        reorder_point=rop,
        recommended_order_quantity=roq,
        effective_lead_time_days=effective_lt,
        effective_daily_demand=round(effective_mu, 2),
        total_simulated_demand=total_demand,
        managed_total_fulfilled=managed_fulfilled,
        managed_total_unmet=managed_unmet,
        managed_service_level_achieved=service_level_achieved,
        managed_min_stock=min_stock,
        unmanaged_stockout_day=unmanaged_stockout_day,
        unmanaged_total_unmet=unmanaged_unmet,
        replenishment_orders_count=order_count,
        timeline=timeline,
    )

