from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class BusinessContact(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "business_contacts"

    business_name: Mapped[str] = mapped_column(String(120), default="Dream Car Bazaar", nullable=False)
    phone_number: Mapped[str] = mapped_column(String(32), default="+91 98765 43210", nullable=False)
    whatsapp_number: Mapped[str] = mapped_column(String(32), default="+91 98765 43210", nullable=False)
    email: Mapped[str] = mapped_column(String(320), default="contact@dreamcarbazaar.com", nullable=False)
    address: Mapped[str] = mapped_column(Text, default="100 Prime Auto Plaza, Western Express Highway", nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Mumbai", nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Maharashtra", nullable=False)
    business_hours: Mapped[str] = mapped_column(String(120), default="Mon - Sat: 9:30 AM - 7:30 PM", nullable=False)
    google_maps_link: Mapped[str | None] = mapped_column(Text)
