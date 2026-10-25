"""Inventory Planning & Continuous-Review Replenishment Module.

Implements mathematically grounded stochastic safety stock, reorder point (ROP),
and batch-constrained recommended order quantity (ROQ) calculations.
"""

import math
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


# Standard normal quantiles for cycle-service levels
SERVICE_LEVEL_Z: Dict[float, float] = {
    0.80: 0.8416,
    0.85: 1.0364,
    0.90: 1.2816,
    0.95: 1.6449,
    0.98: 2.0537,
    0.99: 2.3263,
}


def get_z_score(service_level: float = 0.95) -> float:
    """Retrieve normal distribution quantile z for cycle-service level."""
    if service_level in SERVICE_LEVEL_Z:
        return SERVICE_LEVEL_Z[service_level]
    # Nearest key approximation for continuous inputs
    closest_sl = min(SERVICE_LEVEL_Z.keys(), key=lambda k: abs(k - service_level))
    return SERVICE_LEVEL_Z[closest_sl]


class InventoryPosition(BaseModel):
    """Current stock posture at a single facility."""

    sku_id: str
    location_id: str
    on_hand_quantity: int = Field(..., ge=0)
    reserved_quantity: int = Field(default=0, ge=0)
    in_transit_quantity: int = Field(default=0, ge=0)
    reorder_point: Optional[int] = None
    target_stock: Optional[int] = None
    unit_cost: float = Field(default=1.0, gt=0)
    pack_size: int = Field(default=1, ge=1)
    minimum_order_quantity: int = Field(default=1, ge=1)


class DemandProfile(BaseModel):
    """Demand parameters estimated from historical time series or ML models."""

    avg_daily_demand: float = Field(..., ge=0.0)
    std_daily_demand: float = Field(..., ge=0.0)
    supplier_lead_time_days: float = Field(..., ge=0.0)
    lead_time_std_days: float = Field(default=0.0, ge=0.0)
    service_level: float = Field(default=0.95, ge=0.50, le=0.999)


class ReplenishmentRecommendation(BaseModel):
    """Actionable replenishment decision output."""

    sku_id: str
    location_id: str
    net_inventory: int
    safety_stock: int
    expected_lead_time_demand: int
    reorder_point: int
    is_reorder_triggered: bool
    recommended_order_quantity: int
    estimated_procurement_cost: float
    urgency_level: str  # 'HEALTHY', 'REORDER_REQUIRED', 'CRITICAL_SHORTAGE'
    reason: str


class InventoryPlanner:
    """Computes safety stocks, ROP, and replenishment orders."""

    @staticmethod
    def calculate_safety_stock(
        profile: DemandProfile,
    ) -> int:
        """Calculate safety stock buffer with constant or stochastic lead time.

        If lead time is constant:
            SS = z * sigma_d * sqrt(L)
        If lead time is stochastic:
            SS = z * sqrt(L * sigma_d^2 + mu_d^2 * sigma_L^2)
        """
        z = get_z_score(profile.service_level)
        mu_d = profile.avg_daily_demand
        sigma_d = profile.std_daily_demand
        L = profile.supplier_lead_time_days
        sigma_L = profile.lead_time_std_days

        if L <= 0:
            return 0

        if sigma_L <= 0:
            variance = L * (sigma_d**2)
        else:
            variance = (L * (sigma_d**2)) + ((mu_d**2) * (sigma_L**2))

        ss = z * math.sqrt(max(0.0, variance))
        return int(math.ceil(ss))

    @staticmethod
    def calculate_reorder_point(
        profile: DemandProfile,
    ) -> Tuple[int, int, int]:
        """Calculate reorder point: ROP = Expected Lead Time Demand + Safety Stock."""
        lead_time_demand = int(math.ceil(profile.avg_daily_demand * profile.supplier_lead_time_days))
        safety_stock = InventoryPlanner.calculate_safety_stock(profile)
        rop = lead_time_demand + safety_stock
        return rop, lead_time_demand, safety_stock

    @staticmethod
    def compute_replenishment(
        position: InventoryPosition,
        profile: DemandProfile,
        review_horizon_days: int = 7,
    ) -> ReplenishmentRecommendation:
        """Evaluate stock posture and compute batch-constrained replenishment order."""
        # 1. Net available inventory
        net_inventory = position.on_hand_quantity - position.reserved_quantity + position.in_transit_quantity

        # 2. Reorder point and safety stock
        calculated_rop, ltd, ss = InventoryPlanner.calculate_reorder_point(profile)
        effective_rop = position.reorder_point if position.reorder_point is not None else calculated_rop

        # Target stock level (Order-Up-To Level S): ROP + review horizon demand
        review_demand = int(math.ceil(profile.avg_daily_demand * review_horizon_days))
        target_stock = position.target_stock or (effective_rop + review_demand)

        is_triggered = net_inventory <= effective_rop

        order_qty = 0
        if is_triggered:
            # Deficit from target
            raw_order = target_stock - net_inventory

            # Enforce Minimum Order Quantity (MOQ)
            order_moq = max(raw_order, position.minimum_order_quantity)

            # Round up to nearest integer multiple of pack size
            pack = position.pack_size
            order_qty = int(math.ceil(order_moq / pack) * pack)

        cost = round(order_qty * position.unit_cost, 2)

        # Determine operational urgency
        if net_inventory <= 0:
            urgency = "CRITICAL_SHORTAGE"
            reason = f"Inventory completely exhausted (Net: {net_inventory}). Immediate emergency restock required."
        elif net_inventory <= effective_rop * 0.5:
            urgency = "CRITICAL_SHORTAGE"
            reason = f"Severe breach: stock ({net_inventory}) is below 50% of reorder threshold ({effective_rop})."
        elif is_triggered:
            urgency = "REORDER_REQUIRED"
            reason = f"Net stock ({net_inventory}) breached reorder point ({effective_rop}). Order recommended."
        else:
            urgency = "HEALTHY"
            reason = f"Net stock ({net_inventory}) remains safely above reorder point ({effective_rop})."

        return ReplenishmentRecommendation(
            sku_id=position.sku_id,
            location_id=position.location_id,
            net_inventory=net_inventory,
            safety_stock=ss,
            expected_lead_time_demand=ltd,
            reorder_point=effective_rop,
            is_reorder_triggered=is_triggered,
            recommended_order_quantity=order_qty,
            estimated_procurement_cost=cost,
            urgency_level=urgency,
            reason=reason,
        )
