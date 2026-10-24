"""API router for Disruption Scenario Simulation and Resilience Analysis."""

from fastapi import APIRouter, HTTPException, status
from src.config import settings
from src.scenario.service import ScenarioService
from src.schemas.scenario import ScenarioSimulateRequest, ScenarioSimulateResponse

router = APIRouter(prefix="/scenario", tags=["Scenario Simulation"])


@router.post(
    "/simulate",
    response_model=ScenarioSimulateResponse,
    summary="Simulate Disruption Scenario",
    description="Injects network, supply, or demand disruptions, re-runs CP-SAT optimizer, and evaluates resilience deltas.",
)
def simulate_scenario(request: ScenarioSimulateRequest) -> ScenarioSimulateResponse:
    service = ScenarioService(settings.dataset_dir)
    try:
        response = service.simulate_scenario(request)
        if response.disrupted_plan.total_allocated_units == 0 and response.disrupted_plan.total_gross_requirement > 0 and response.resilience_insights.solver_status not in ("OPTIMAL", "FEASIBLE"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Disrupted optimization could not find a feasible solution: {response.resilience_insights.solver_status}",
            )
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
    "/disrupt",
    response_model=ScenarioSimulateResponse,
    summary="Simulate Disruption (PRD Contract Alias)",
    description="Alias endpoint conforming to PRD specification POST /api/v1/scenario/disrupt.",
    include_in_schema=True,
)
def disrupt_scenario_alias(request: ScenarioSimulateRequest) -> ScenarioSimulateResponse:
    """Compatible alias matching documented PRD contract /scenario/disrupt."""
    return simulate_scenario(request)
