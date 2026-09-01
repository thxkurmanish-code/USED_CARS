from enum import StrEnum

from sqlalchemy import Enum


def database_enum(enum_class: type[StrEnum], name: str) -> Enum:
    """Map Python enum values—not member names—to PostgreSQL enum values."""
    return Enum(
        enum_class,
        name=name,
        values_callable=lambda enum_type: [member.value for member in enum_type],
    )


class UserRole(StrEnum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class SellerType(StrEnum):
    DEALER = "dealer"
    INDIVIDUAL = "individual"


class ListingStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    ACTIVE = "active"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    SOLD = "sold"
    EXPIRED = "expired"


class FuelType(StrEnum):
    PETROL = "petrol"
    DIESEL = "diesel"
    CNG = "cng"
    ELECTRIC = "electric"
    HYBRID = "hybrid"
    LPG = "lpg"
    OTHER = "other"


class TransmissionType(StrEnum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    AMT = "amt"
    CVT = "cvt"
    DCT = "dct"
    OTHER = "other"


class BodyType(StrEnum):
    HATCHBACK = "hatchback"
    SEDAN = "sedan"
    SUV = "suv"
    MUV = "muv"
    COUPE = "coupe"
    CONVERTIBLE = "convertible"
    PICKUP = "pickup"
    WAGON = "wagon"
    OTHER = "other"


class EnquiryStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    SPAM = "spam"


class ReportStatus(StrEnum):
    OPEN = "open"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class TestDriveStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

