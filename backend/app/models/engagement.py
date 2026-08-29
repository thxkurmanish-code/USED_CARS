from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import EnquiryStatus, ReportStatus

if TYPE_CHECKING:
    from app.models.listing import CarListing
    from app.models.user import User


class WishlistItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("user_id", "listing_id", name="wishlist_user_listing"),)

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id: Mapped[UUID] = mapped_column(
        ForeignKey("car_listings.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="wishlist_items")
    listing: Mapped[CarListing] = relationship(back_populates="wishlist_items")


class Enquiry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "enquiries"
    __table_args__ = (
        Index("ix_enquiries_seller_status_created", "seller_id", "status", "created_at"),
        Index("ix_enquiries_buyer_created", "buyer_id", "created_at"),
    )

    listing_id: Mapped[UUID] = mapped_column(
        ForeignKey("car_listings.id", ondelete="RESTRICT"), nullable=False
    )
    buyer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    seller_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[EnquiryStatus] = mapped_column(
        Enum(EnquiryStatus, name="enquiry_status"), default=EnquiryStatus.NEW, nullable=False
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    listing: Mapped[CarListing] = relationship(back_populates="enquiries")
    buyer: Mapped[User] = relationship(back_populates="enquiries_sent", foreign_keys=[buyer_id])
    seller: Mapped[User] = relationship(back_populates="enquiries_received", foreign_keys=[seller_id])


class ListingReport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "listing_reports"
    __table_args__ = (Index("ix_listing_reports_status_created", "status", "created_at"),)

    listing_id: Mapped[UUID] = mapped_column(
        ForeignKey("car_listings.id", ondelete="RESTRICT"), nullable=False
    )
    reporter_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"), default=ReportStatus.OPEN, nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    listing: Mapped[CarListing] = relationship(back_populates="reports")
    reporter: Mapped[User | None] = relationship(back_populates="reports")


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_actor_created", "actor_id", "created_at"),)

    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    target_type: Mapped[str] = mapped_column(String(80), nullable=False)
    target_id: Mapped[UUID | None] = mapped_column()
    metadata_json: Mapped[dict[str, object] | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
