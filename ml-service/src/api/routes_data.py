"""Data validation API route for SupplyShield AI ML Service."""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from src.config import settings
from src.data.validator import DataValidator
from src.schemas.validation import ValidationReport

router = APIRouter(prefix="/data", tags=["Data Validation"])


@router.get(
    "/validate",
    response_model=ValidationReport,
    summary="Validate Demo Dataset",
    description="Loads the demo dataset bundle and performs 12-point integrity and schema validation.",
)
def validate_dataset() -> JSONResponse:
    """Run full validation checks against the demo dataset directory.

    Returns:
        JSONResponse containing ValidationReport. Returns HTTP 200 if valid or valid_with_warnings.
        Returns HTTP 422 if dataset is missing required files or has fatal schema/integrity errors.
    """
    validator = DataValidator(settings.dataset_dir)
    report = validator.validate()

    # If dataset has fatal errors, return HTTP 422 Unprocessable Entity
    # while preserving the full structured diagnostic report
    if report.status == "invalid":
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=report.model_dump(),
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=report.model_dump(),
    )
