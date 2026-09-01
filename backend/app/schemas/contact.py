from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class BusinessContactUpdateRequest(BaseModel):
    business_name: str = Field(min_length=1, max_length=120)
    phone_number: str = Field(min_length=5, max_length=32)
    whatsapp_number: str = Field(min_length=5, max_length=32)
    email: str = Field(min_length=5, max_length=320)
    address: str = Field(min_length=5, max_length=1000)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    business_hours: str = Field(min_length=1, max_length=120)
    google_maps_link: str | None = Field(default=None, max_length=2000)


class BusinessContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_name: str
    phone_number: str
    whatsapp_number: str
    email: str
    address: str
    city: str
    state: str
    business_hours: str
    google_maps_link: str | None
