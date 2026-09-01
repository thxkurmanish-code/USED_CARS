from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import TestDriveStatus, database_enum

if TYPE_CHECKING:
    from app.models.listing import CarListing
    from app.models.user import User


class TestDrive(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "test_drives"
    __table_args__ = (
        Index("ix_test_drives_customer", "customer_id", "created_at"),
        Index("ix_test_drives_listing", "listing_id", "created_at"),
        Index("ix_test_drives_status", "status", "created_at"),
    )

    listing_id: Mapped[UUID] = mapped_column(ForeignKey("car_listings.id", ondelete="CASCADE"), nullable=False)
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    preferred_date: Mapped[str] = mapped_column(String(20), nullable=False)
    preferred_time: Mapped[str] = mapped_column(String(20), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TestDriveStatus] = mapped_column(
        database_enum(TestDriveStatus, "test_drive_status"),
        default=TestDriveStatus.PENDING,
        nullable=False,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text)
    rescheduled_date: Mapped[str | None] = mapped_column(String(20))
    rescheduled_time: Mapped[str | None] = mapped_column(String(20))

    listing: Mapped[CarListing] = relationship(backref="test_drives")
    customer: Mapped[User] = relationship(backref="test_drive_requests")
