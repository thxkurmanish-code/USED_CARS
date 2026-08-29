from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.engagement import Enquiry, ListingReport, WishlistItem
    from app.models.listing import CarListing, ListingStatusEvent


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("email = lower(email)", name="normalized_email"),)

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), default=UserRole.CUSTOMER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    auth_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    profile: Mapped[UserProfile | None] = relationship(back_populates="user", uselist=False)
    listings: Mapped[list[CarListing]] = relationship(back_populates="owner")
    wishlist_items: Mapped[list[WishlistItem]] = relationship(back_populates="user")
    enquiries_sent: Mapped[list[Enquiry]] = relationship(
        back_populates="buyer", foreign_keys="Enquiry.buyer_id"
    )
    enquiries_received: Mapped[list[Enquiry]] = relationship(
        back_populates="seller", foreign_keys="Enquiry.seller_id"
    )
    reports: Mapped[list[ListingReport]] = relationship(back_populates="reporter")
    listing_status_events: Mapped[list[ListingStatusEvent]] = relationship(
        back_populates="actor", foreign_keys="ListingStatusEvent.actor_id"
    )


class UserProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(32))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(String(1_000))

    user: Mapped[User] = relationship(back_populates="profile")
