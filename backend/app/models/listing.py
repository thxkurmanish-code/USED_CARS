from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import BodyType, FuelType, ListingStatus, SellerType, TransmissionType

if TYPE_CHECKING:
    from app.models.engagement import Enquiry, ListingReport, WishlistItem
    from app.models.user import User


class CarListing(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "car_listings"
    __table_args__ = (
        CheckConstraint("manufacturing_year BETWEEN 1886 AND 2100", name="valid_manufacturing_year"),
        CheckConstraint(
            "registration_year IS NULL OR registration_year BETWEEN 1886 AND 2100",
            name="valid_registration_year",
        ),
        CheckConstraint("price > 0", name="positive_price"),
        CheckConstraint("kilometers_driven >= 0", name="non_negative_kilometers"),
        CheckConstraint("owner_count BETWEEN 0 AND 20", name="valid_owner_count"),
        CheckConstraint("dream_score IS NULL OR dream_score BETWEEN 0 AND 100", name="valid_dream_score"),
        Index("ix_car_listings_discovery", "status", "is_archived", "created_at"),
        Index("ix_car_listings_filters", "brand", "model", "manufacturing_year", "price"),
        Index("ix_car_listings_location", "city", "state"),
    )

    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    brand: Mapped[str] = mapped_column(String(80), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    variant: Mapped[str | None] = mapped_column(String(120))
    manufacturing_year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    registration_year: Mapped[int | None] = mapped_column(SmallInteger)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    kilometers_driven: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(Enum(FuelType, name="fuel_type"), nullable=False)
    transmission: Mapped[TransmissionType] = mapped_column(
        Enum(TransmissionType, name="transmission_type"), nullable=False
    )
    body_type: Mapped[BodyType] = mapped_column(Enum(BodyType, name="body_type"), nullable=False)
    color: Mapped[str | None] = mapped_column(String(60))
    owner_count: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    features: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    seller_type: Mapped[SellerType] = mapped_column(
        Enum(SellerType, name="seller_type"), nullable=False
    )
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status"), default=ListingStatus.DRAFT, nullable=False
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(1_000))
    dream_score: Mapped[int | None] = mapped_column(SmallInteger)
    dream_score_explanation: Mapped[dict[str, object] | None] = mapped_column(JSONB)

    owner: Mapped[User] = relationship(back_populates="listings")
    images: Mapped[list[CarImage]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", order_by="CarImage.sort_order"
    )
    status_events: Mapped[list[ListingStatusEvent]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[list[WishlistItem]] = relationship(back_populates="listing")
    enquiries: Mapped[list[Enquiry]] = relationship(back_populates="listing")
    reports: Mapped[list[ListingReport]] = relationship(back_populates="listing")


class CarImage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "car_images"
    __table_args__ = (
        CheckConstraint("sort_order >= 0", name="non_negative_sort_order"),
        CheckConstraint("byte_size > 0", name="positive_byte_size"),
        CheckConstraint("width IS NULL OR width > 0", name="positive_width"),
        CheckConstraint("height IS NULL OR height > 0", name="positive_height"),
        Index("ix_car_images_listing_sort", "listing_id", "sort_order"),
        Index(
            "uq_car_images_primary_per_listing",
            "listing_id",
            unique=True,
            postgresql_where=text("is_primary"),
        ),
    )

    listing_id: Mapped[UUID] = mapped_column(
        ForeignKey("car_listings.id", ondelete="CASCADE"), nullable=False
    )
    storage_key: Mapped[str] = mapped_column(String(1_024), unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    listing: Mapped[CarListing] = relationship(back_populates="images")


class ListingStatusEvent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "listing_status_events"
    __table_args__ = (Index("ix_listing_status_events_listing_id", "listing_id"),)

    listing_id: Mapped[UUID] = mapped_column(
        ForeignKey("car_listings.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    previous_status: Mapped[ListingStatus | None] = mapped_column(
        Enum(ListingStatus, name="listing_status"), nullable=True
    )
    new_status: Mapped[ListingStatus] = mapped_column(Enum(ListingStatus, name="listing_status"), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(1_000))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )

    listing: Mapped[CarListing] = relationship(back_populates="status_events")
    actor: Mapped[User | None] = relationship(back_populates="listing_status_events")
