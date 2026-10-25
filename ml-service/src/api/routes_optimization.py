"""API router for inventory allocation and optimization."""

from fastapi import APIRouter, HTTPException, status
from src.config import settings
from src.optimization.service import OptimizationService
from src.schemas.optimization import OptimizeRequest, OptimizeResponse

router = APIRouter(tags=["Optimization"])


@router.post(
    "/optimize",
    response_model=OptimizeResponse,
    summary="Solve Inventory Allocation Optimization",
    description="Deterministic warehouse-to-store inventory dispatch optimizer using Google OR-Tools CP-SAT with baseline comparison.",
)
def run_optimize(request: OptimizeRequest) -> OptimizeResponse:
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
