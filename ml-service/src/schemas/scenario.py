"""Pydantic schemas for disruption scenario simulation and resilience analysis."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from src.schemas.optimization import AllocationRecord, FeasibilityReport, PlanSummary


class DisruptionItem(BaseModel):
    """Specification of a single disruption element."""

    disruption_type: Literal[
        "warehouse_outage",
        "route_closure",
        "lane_capacity_reduction",
        "warehouse_stock_reduction",
        "demand_spike",
    ] = Field(..., description="Type of disruption to inject")
    target_id: str = Field(
        ...,
        description="Target identifier: warehouse_id, store_id, product_id, or lane_id (e.g. WH-NORTH__STORE-01)",
    )
    change_value: Optional[float] = Field(
        default=None,
        description="Multiplier or reduction factor (e.g., 0.70 for 30% reduction, 1.35 for +35% demand spike, 0.50 for -50% lane capacity)",
    )


class ScenarioSimulateRequest(BaseModel):
    """Request payload for scenario simulation."""

    scenario_name: str = Field(default="Custom Disruption Scenario", description="Human-readable scenario name")
    preset_scenario_id: Optional[str] = Field(
        default=None,
        description="Optional ID from scenarios.csv (e.g. SCN-001, SCN-002, SCN-003)",
    )
    disruptions: List[DisruptionItem] = Field(
        default_factory=list,
        description="List of disruption actions to apply in combination",
    )
    horizon_days: int = Field(default=7, ge=1, le=30, description="Planning horizon in days (1-30)")
    stores: Optional[List[str]] = Field(None, description="Optional store subset filter")
    products: Optional[List[str]] = Field(None, description="Optional product subset filter")
    shortage_penalty_per_unit: float = Field(default=100.0, ge=1.0, le=10000.0, description="Penalty per unmet unit ($)")
    transport_cost_multiplier: float = Field(default=1.0, ge=0.01, le=100.0, description="Multiplier for transportation cost")
    solver_time_limit_seconds: float = Field(default=10.0, ge=0.5, le=60.0, description="Solver execution limit in seconds")


class ResilienceInsights(BaseModel):
    """Data-driven interpretation of the disruption impact and resilience response."""

    primary_bottleneck: str = Field(..., description="Root cause bottleneck constraint driving impact")
    net_additional_unmet_units: int = Field(..., description="Additional shortage units compared to baseline plan")
    freight_cost_delta_dollars: float = Field(..., description="Change in total freight transport cost ($)")
    top_shortage_stores: List[str] = Field(default_factory=list, description="Stores experiencing the greatest shortage increase")
    top_shortage_products: List[str] = Field(default_factory=list, description="Products experiencing the greatest shortage increase")
    is_disrupted_plan_feasible: bool = Field(..., description="True if disrupted plan satisfies all operational constraints")
    solver_status: str = Field(..., description="Solver status for the disrupted plan (e.g. OPTIMAL, FEASIBLE)")
    executive_summary: str = Field(..., description="Concise, grounded narrative summarizing disruption impact")


class ScenarioSimulateResponse(BaseModel):
    """Comparative response detailing baseline vs. disrupted optimization plans."""

    run_id: Optional[str] = Field(None, description="Unique execution run identifier")
    scenario_name: str = Field(..., description="Scenario identifier or name")
    applied_disruptions: List[DisruptionItem] = Field(..., description="Disruptions applied to baseline")
    affected_entities: Dict[str, List[str]] = Field(
        ...,
        description="Lists of affected warehouses, stores, products, and lanes",
    )
    baseline_plan: PlanSummary = Field(..., description="Optimal allocation metrics before disruption")
    disrupted_plan: PlanSummary = Field(..., description="Rescued allocation metrics after disruption")
    delta_metrics: Dict[str, Any] = Field(..., description="Quantified deltas (Disrupted - Baseline)")
    baseline_feasibility: FeasibilityReport = Field(..., description="Feasibility audit of baseline plan")
    disrupted_feasibility: FeasibilityReport = Field(..., description="Feasibility audit of disrupted plan")
    baseline_runtime_seconds: float = Field(..., description="Baseline solver runtime")
    disrupted_runtime_seconds: float = Field(..., description="Disrupted solver runtime")
    disrupted_allocations: List[AllocationRecord] = Field(..., description="Active dispatches under disrupted plan")
    resilience_insights: ResilienceInsights = Field(..., description="Resilience analysis and bottleneck insights")
    warnings: List[str] = Field(default_factory=list, description="Operational warnings and limitations")
