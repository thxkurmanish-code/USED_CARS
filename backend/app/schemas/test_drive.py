from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TestDriveStatus
from app.schemas.listing import ListingSummary


class TestDriveCreateRequest(BaseModel):
    listing_id: UUID
    preferred_date: str = Field(min_length=8, max_length=20)
    preferred_time: str = Field(min_length=3, max_length=20)
    contact_phone: str = Field(min_length=10, max_length=32)
    message: str | None = Field(default=None, max_length=1000)


class TestDriveStatusUpdateRequest(BaseModel):
    status: TestDriveStatus
    admin_notes: str | None = Field(default=None, max_length=1000)
    rescheduled_date: str | None = Field(default=None, max_length=20)
    rescheduled_time: str | None = Field(default=None, max_length=20)


class TestDriveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    customer_id: UUID
    preferred_date: str
    preferred_time: str
    contact_phone: str
    message: str | None
    status: TestDriveStatus
    admin_notes: str | None
    rescheduled_date: str | None
    rescheduled_time: str | None
    created_at: datetime
    listing: ListingSummary | None = None
