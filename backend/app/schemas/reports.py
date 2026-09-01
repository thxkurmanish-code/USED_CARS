from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ReportStatus
from app.schemas.listing import ListingSummary


class ListingReportCreateRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
    details: str | None = Field(default=None, max_length=2000)


class ListingReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    reporter_id: UUID | None
    reason: str
    details: str | None
    status: ReportStatus
    created_at: datetime
    resolved_at: datetime | None
    listing: ListingSummary | None = None
