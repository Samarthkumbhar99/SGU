"""Pydantic schemas for OR-Tools inventory allocation and optimization."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AllocationRecord(BaseModel):
    """Allocation from warehouse to store for a specific product."""

    warehouse_id: str = Field(..., description="Source warehouse identifier")
    store_id: str = Field(..., description="Destination store identifier")
    product_id: str = Field(..., description="Product SKU identifier")
    allocated_units: int = Field(..., ge=0, description="Integer units allocated along the lane")
    unit_transport_cost: float = Field(..., ge=0.0, description="Transport cost per unit on lane")
    total_transport_cost: float = Field(..., ge=0.0, description="Allocated units * unit transport cost")
    lead_time_hours: float = Field(..., ge=0.0, description="Transit lead time in hours")


class StoreProductDemandSummary(BaseModel):
    """Store-product replenishment reconciliation."""

    store_id: str = Field(..., description="Store identifier")
    product_id: str = Field(..., description="Product SKU identifier")
    store_inventory_on_hand: int = Field(..., ge=0, description="Existing stock already at the store")
    forecast_demand_units: int = Field(..., ge=0, description="Predicted demand over planning horizon")
    gross_requirement: int = Field(..., ge=0, description="Unmet demand before allocation: max(0, forecast - on_hand)")
    allocated_units: int = Field(..., ge=0, description="Total units shipped from all warehouses")
    unmet_demand_units: int = Field(..., ge=0, description="Remaining shortage after allocation: max(0, gross_req - allocated)")


class PlanSummary(BaseModel):
    """Aggregated metrics for an allocation plan."""

    total_forecast_demand: int = Field(..., description="Total demand across evaluated store-SKU combinations")
    total_store_inventory_on_hand: int = Field(..., description="Total physical stock already present across all stores")
    total_effective_store_stock_utilized: int = Field(..., description="Sum of min(demand, on_hand) utilized directly to fulfill demand")
    total_surplus_store_stock: int = Field(..., description="Sum of max(0, on_hand - demand) surplus inventory locked at specific stores")
    total_gross_requirement: int = Field(..., description="Total replenishment requirement from warehouses: sum of max(0, demand - on_hand)")
    total_warehouse_stock_available: int = Field(..., description="Total warehouse stock available for allocation")
    total_allocated_units: int = Field(..., description="Total units dispatched from warehouses")
    total_unmet_demand_units: int = Field(..., description="Total remaining unmet demand after allocation: max(0, gross_req - allocated)")
    total_transport_cost: float = Field(..., description="Total transportation cost across all lanes ($)")
    demand_fulfillment_rate: float = Field(..., description="Percentage of gross requirement fulfilled by warehouse allocations (0-100%)")
    overall_demand_satisfied_rate: float = Field(..., description="Percentage of total forecast demand fulfilled by store stock + warehouse allocations (0-100%)")
    objective_score: float = Field(..., description="Computed objective penalty score")


class FeasibilityReport(BaseModel):
    """Independent verification report of an allocation plan."""

    is_feasible: bool = Field(..., description="True if all mathematical and operational constraints are satisfied")
    violations_count: int = Field(..., description="Count of constraint violations")
    errors: List[str] = Field(default_factory=list, description="Specific constraint violation messages")
    warnings: List[str] = Field(default_factory=list, description="Non-fatal warnings")


class OptimizeRequest(BaseModel):
    """Request payload for inventory allocation optimization."""

    horizon_days: int = Field(default=7, ge=1, le=30, description="Planning horizon in days (1-30)")
    stores: Optional[List[str]] = Field(None, description="Optional store IDs subset to optimize")
    products: Optional[List[str]] = Field(None, description="Optional SKU IDs subset to optimize")
    shortage_penalty_per_unit: float = Field(default=100.0, ge=1.0, le=10000.0, description="Penalty per unit of unmet demand ($)")
    transport_cost_multiplier: float = Field(default=1.0, ge=0.01, le=100.0, description="Weight multiplier for transportation cost")
    expiry_penalty_multiplier: float = Field(default=1.0, ge=0.0, le=100.0, description="Weight multiplier for aging inventory penalty")
    solver_time_limit_seconds: float = Field(default=10.0, ge=0.5, le=60.0, description="Maximum solver execution time in seconds")


class OptimizeResponse(BaseModel):
    """Optimization response comparing CP-SAT optimal plan against greedy baseline."""

    status: str = Field(..., description="Solver status: OPTIMAL, FEASIBLE, INFEASIBLE, etc.")
    planning_horizon_days: int = Field(..., description="Planning horizon in days")
    forecast_origin: str = Field(..., description="Historical anchor date for forecasting")
    solver_runtime_seconds: float = Field(..., description="CP-SAT solver execution runtime in seconds")
    optimized_plan: PlanSummary = Field(..., description="Metrics for the CP-SAT optimized allocation plan")
    baseline_plan: PlanSummary = Field(..., description="Metrics for the deterministic demand-first baseline plan")
    delta_metrics: Dict[str, Any] = Field(..., description="Comparative deltas between optimized and baseline plans")
    allocations: List[AllocationRecord] = Field(..., description="Active non-zero allocation records")
    store_summaries: List[StoreProductDemandSummary] = Field(..., description="Reconciliation by store and product")
    feasibility: FeasibilityReport = Field(..., description="Independent feasibility check of the optimized plan")
    warnings: List[str] = Field(default_factory=list, description="Diagnostic warnings")
