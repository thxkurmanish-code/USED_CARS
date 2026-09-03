from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


from app.models.enums import BodyType, FuelType, ListingStatus, SellerType, TransmissionType


class ListingCreateRequest(BaseModel):
    brand: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=100)
    variant: str | None = Field(default=None, max_length=120)
    manufacturing_year: int = Field(ge=1886, le=2100)
    registration_year: int | None = Field(default=None, ge=1886, le=2100)
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    kilometers_driven: int = Field(ge=0)
    fuel_type: FuelType
    transmission: TransmissionType
    body_type: BodyType
    color: str | None = Field(default=None, max_length=60)
    owner_count: int = Field(ge=0, le=20)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=10_000)
    features: list[str] = Field(default_factory=list, max_length=40)

    seller_type: SellerType = SellerType.INDIVIDUAL



class ListingUpdateRequest(ListingCreateRequest):
    pass


class CarImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    storage_key: str
    original_filename: str
    content_type: str
    byte_size: int
    sort_order: int
    is_primary: bool



class ListingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    brand: str

    model: str
    variant: str | None
    manufacturing_year: int
    price: Decimal
    kilometers_driven: int
    fuel_type: FuelType
    transmission: TransmissionType
    body_type: BodyType
    city: str
    state: str
    seller_type: SellerType
    status: ListingStatus
    is_featured: bool
    is_verified: bool = False
    created_at: datetime
    images: list[CarImageResponse] = Field(default_factory=list)



class ListingDetail(ListingSummary):
    registration_year: int | None
    color: str | None
    owner_count: int
    description: str
    features: list[str]
    rejection_reason: str | None = None
    updated_at: datetime


class ListingPage(BaseModel):
    items: list[ListingSummary]
    total: int
    page: int
    page_size: int

