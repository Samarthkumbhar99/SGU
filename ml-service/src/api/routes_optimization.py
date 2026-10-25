"""API router for inventory allocation optimization and scenario simulation runs."""

from datetime import datetime, timezone
from typing import Any, Dict, List
import uuid
from fastapi import APIRouter, HTTPException, status
from src.config import settings
from src.optimization.service import OptimizationService
from src.scenario.service import ScenarioService
from src.schemas.optimization import (
    OptimizationRunSummary,
    OptimizeRequest,
    OptimizeResponse,
)
from src.schemas.scenario import (
    ScenarioSimulateRequest,
    ScenarioSimulateResponse,
)

router = APIRouter(tags=["Optimization"])

# In-memory history of optimization & simulation runs (capped at 100)
_runs_history: List[Dict[str, Any]] = []
_runs_by_id: Dict[str, Dict[str, Any]] = {}


def _record_run(run_entry: Dict[str, Any]) -> None:
    """Safely append run record and cap in-memory capacity."""
    run_id = run_entry["run_id"]
    _runs_by_id[run_id] = run_entry
    _runs_history.insert(0, run_entry)
    if len(_runs_history) > 100:
        evicted = _runs_history.pop()
        _runs_by_id.pop(evicted["run_id"], None)


@router.post(
    "/optimize",
    response_model=OptimizeResponse,
    summary="Solve Inventory Allocation Optimization (Legacy Alias)",
    include_in_schema=False,
)
@router.post(
    "/optimization/solve",
    response_model=OptimizeResponse,
    summary="Solve Inventory Allocation Optimization",
    description="Deterministic warehouse-to-store inventory dispatch optimizer using Google OR-Tools CP-SAT with baseline comparison.",
)
def solve_optimization(request: OptimizeRequest) -> OptimizeResponse:
    service = OptimizationService(settings.dataset_dir)
    try:
        response = service.run_optimization(request)
        if response.status not in ("OPTIMAL", "FEASIBLE"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Optimization failed with solver status: {response.status}",
            )
        if not response.feasibility.is_feasible:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Generated plan failed feasibility validation: {response.feasibility.errors}",
            )

        run_id = f"opt-{uuid.uuid4().hex[:10]}"
        response.run_id = run_id

        _record_run({
            "run_id": run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_type": "solve",
            "status": response.status,
            "solver_runtime_seconds": response.solver_runtime_seconds,
            "objective_score": response.optimized_plan.objective_score,
            "total_transport_cost": response.optimized_plan.total_transport_cost,
            "total_unmet_demand_units": response.optimized_plan.total_unmet_demand_units,
            "demand_fulfillment_rate": response.optimized_plan.demand_fulfillment_rate,
            "warnings": response.warnings,
            "parameters": request.model_dump(),
            "result": response.model_dump(),
        })

        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/optimization/simulate",
    response_model=ScenarioSimulateResponse,
    summary="Simulate Disruption Scenario",
    description="Simulate network disruption shocks, re-optimize using OR-Tools CP-SAT, and evaluate resilience metrics.",
)
def simulate_optimization(request: ScenarioSimulateRequest) -> ScenarioSimulateResponse:
    service = ScenarioService(settings.dataset_dir)
    try:
        response = service.simulate_scenario(request)
        run_id = f"sim-{uuid.uuid4().hex[:10]}"
        response.run_id = run_id

        _record_run({
            "run_id": run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_type": "simulate",
            "status": response.resilience_insights.solver_status,
            "solver_runtime_seconds": response.disrupted_runtime_seconds,
            "objective_score": response.disrupted_plan.objective_score,
            "total_transport_cost": response.disrupted_plan.total_transport_cost,
            "total_unmet_demand_units": response.disrupted_plan.total_unmet_demand_units,
            "demand_fulfillment_rate": response.disrupted_plan.demand_fulfillment_rate,
            "warnings": response.warnings,
            "parameters": request.model_dump(),
            "result": response.model_dump(),
        })

        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/optimization/runs",
    response_model=List[OptimizationRunSummary],
    summary="List Optimization Runs",
    description="Retrieve historical optimization and simulation run summaries.",
)
def list_optimization_runs() -> List[OptimizationRunSummary]:
    summaries = []
    for r in _runs_history:
        summaries.append(
            OptimizationRunSummary(
                run_id=r["run_id"],
                timestamp=r["timestamp"],
                run_type=r["run_type"],
                status=r["status"],
                solver_runtime_seconds=r["solver_runtime_seconds"],
                objective_score=r["objective_score"],
                total_transport_cost=r["total_transport_cost"],
                total_unmet_demand_units=r["total_unmet_demand_units"],
                demand_fulfillment_rate=r["demand_fulfillment_rate"],
                warnings=r.get("warnings", []),
                parameters=r.get("parameters", {}),
            )
        )
    return summaries


@router.get(
    "/optimization/runs/{run_id}",
    summary="Get Optimization Run Detail",
    description="Retrieve full execution details, allocations, and metrics for a specific run ID.",
)
def get_optimization_run(run_id: str) -> Dict[str, Any]:
    run = _runs_by_id.get(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization run '{run_id}' not found.",
        )
    return run
