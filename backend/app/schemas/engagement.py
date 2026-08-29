from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EnquiryStatus


class EnquiryCreateRequest(BaseModel):
    message: str = Field(min_length=10, max_length=2_000)


class EnquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    buyer_id: UUID
    seller_id: UUID
    message: str
    status: EnquiryStatus
    created_at: datetime
