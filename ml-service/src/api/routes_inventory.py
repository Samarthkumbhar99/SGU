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
