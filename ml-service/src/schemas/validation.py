"""Validation report schemas for data ingestion and integrity checking."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IssueDetail(BaseModel):
    """Details of a validation error or warning."""

    code: str = Field(..., description="Machine-readable issue code")
    message: str = Field(..., description="Human-readable issue description")
    file: Optional[str] = Field(None, description="Filename associated with the issue")
    column: Optional[str] = Field(None, description="Column name associated with the issue")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Extra debugging context")


class ValidationSummary(BaseModel):
    """High-level summary counts of validation results."""

    total_files_checked: int = Field(..., description="Number of expected files evaluated")
    files_loaded: int = Field(..., description="Number of files successfully loaded")
    total_errors: int = Field(..., description="Total error count")
    total_warnings: int = Field(..., description="Total warning count")


class ValidationReport(BaseModel):
    """Complete structured validation report."""

    status: str = Field(..., description="Overall validation status: valid, valid_with_warnings, or invalid")
    summary: ValidationSummary = Field(..., description="Summary counts")
    row_counts: Dict[str, int] = Field(..., description="Row counts per loaded file")
    errors: List[IssueDetail] = Field(default_factory=list, description="List of fatal validation errors")
    warnings: List[IssueDetail] = Field(default_factory=list, description="List of non-fatal validation warnings")
    date_coverage: Optional[Dict[str, Any]] = Field(default=None, description="Coverage details for time series data")
    dimensions: Optional[Dict[str, Any]] = Field(default=None, description="Key network and catalog dimensions")
