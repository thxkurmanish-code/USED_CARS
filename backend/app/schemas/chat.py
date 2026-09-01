from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.listing import ListingSummary


class ChatMessageCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    sender_id: UUID
    body: str
    is_read: bool
    status: str = "delivered"
    created_at: datetime



class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    customer_id: UUID
    created_at: datetime
    updated_at: datetime
    listing: ListingSummary | None = None
    last_message: ChatMessageResponse | None = None
    unread_count: int = 0
