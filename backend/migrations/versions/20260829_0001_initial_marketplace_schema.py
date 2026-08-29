"""Create initial marketplace schema.

Revision ID: 20260829_0001
Revises:
Create Date: 2026-08-29 22:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260829_0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

user_role = postgresql.ENUM("customer", "admin", name="user_role", create_type=False)
seller_type = postgresql.ENUM("dealer", "individual", name="seller_type", create_type=False)
listing_status = postgresql.ENUM(
    "draft", "pending_review", "approved", "active", "rejected", "suspended", "sold", "expired",
    name="listing_status", create_type=False,
)
fuel_type = postgresql.ENUM(
    "petrol", "diesel", "cng", "electric", "hybrid", "lpg", "other", name="fuel_type", create_type=False,
)
transmission_type = postgresql.ENUM(
    "manual", "automatic", "amt", "cvt", "dct", "other", name="transmission_type", create_type=False,
)
body_type = postgresql.ENUM(
    "hatchback", "sedan", "suv", "muv", "coupe", "convertible", "pickup", "wagon", "other",
    name="body_type", create_type=False,
)
enquiry_status = postgresql.ENUM("new", "in_progress", "closed", "spam", name="enquiry_status", create_type=False)
report_status = postgresql.ENUM("open", "reviewing", "resolved", "dismissed", name="report_status", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in (user_role, seller_type, listing_status, fuel_type, transmission_type, body_type, enquiry_status, report_status):
        enum.create(bind, checkfirst=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="customer"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_phone_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("email = lower(email)", name="normalized_email"),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("phone_number", sa.String(length=32)),
        sa.Column("city", sa.String(length=100)),
        sa.Column("state", sa.String(length=100)),
        sa.Column("bio", sa.String(length=1000)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_user_profiles_user_id_users", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_user_profiles"),
        sa.UniqueConstraint("user_id", name="uq_user_profiles_user_id"),
    )
    op.create_table(
        "car_listings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("brand", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("variant", sa.String(length=120)),
        sa.Column("manufacturing_year", sa.SmallInteger(), nullable=False),
        sa.Column("registration_year", sa.SmallInteger()),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("kilometers_driven", sa.Integer(), nullable=False),
        sa.Column("fuel_type", fuel_type, nullable=False),
        sa.Column("transmission", transmission_type, nullable=False),
        sa.Column("body_type", body_type, nullable=False),
        sa.Column("color", sa.String(length=60)),
        sa.Column("owner_count", sa.SmallInteger(), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("features", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("seller_type", seller_type, nullable=False),
        sa.Column("status", listing_status, nullable=False, server_default="draft"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("rejection_reason", sa.String(length=1000)),
        sa.Column("dream_score", sa.SmallInteger()),
        sa.Column("dream_score_explanation", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("manufacturing_year BETWEEN 1886 AND 2100", name="ck_car_listings_valid_manufacturing_year"),
        sa.CheckConstraint("registration_year IS NULL OR registration_year BETWEEN 1886 AND 2100", name="ck_car_listings_valid_registration_year"),
        sa.CheckConstraint("price > 0", name="ck_car_listings_positive_price"),
        sa.CheckConstraint("kilometers_driven >= 0", name="ck_car_listings_non_negative_kilometers"),
        sa.CheckConstraint("owner_count BETWEEN 0 AND 20", name="ck_car_listings_valid_owner_count"),
        sa.CheckConstraint("dream_score IS NULL OR dream_score BETWEEN 0 AND 100", name="ck_car_listings_valid_dream_score"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], name="fk_car_listings_owner_id_users", ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name="pk_car_listings"),
    )
    op.create_index("ix_car_listings_discovery", "car_listings", ["status", "is_archived", "created_at"])
    op.create_index("ix_car_listings_filters", "car_listings", ["brand", "model", "manufacturing_year", "price"])
    op.create_index("ix_car_listings_location", "car_listings", ["city", "state"])
    op.create_table(
        "car_images",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer()),
        sa.Column("height", sa.Integer()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("sort_order >= 0", name="ck_car_images_non_negative_sort_order"),
        sa.CheckConstraint("byte_size > 0", name="ck_car_images_positive_byte_size"),
        sa.CheckConstraint("width IS NULL OR width > 0", name="ck_car_images_positive_width"),
        sa.CheckConstraint("height IS NULL OR height > 0", name="ck_car_images_positive_height"),
        sa.ForeignKeyConstraint(["listing_id"], ["car_listings.id"], name="fk_car_images_listing_id_car_listings", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_car_images"),
        sa.UniqueConstraint("storage_key", name="uq_car_images_storage_key"),
    )
    op.create_index("ix_car_images_listing_sort", "car_images", ["listing_id", "sort_order"])
    op.create_index("uq_car_images_primary_per_listing", "car_images", ["listing_id"], unique=True, postgresql_where=sa.text("is_primary"))

    op.create_table(
        "listing_status_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid()),
        sa.Column("previous_status", listing_status),
        sa.Column("new_status", listing_status, nullable=False),
        sa.Column("reason", sa.String(length=1000)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], name="fk_listing_status_events_actor_id_users", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["listing_id"], ["car_listings.id"], name="fk_listing_status_events_listing_id_car_listings", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_listing_status_events"),
    )
    op.create_index("ix_listing_status_events_listing_id", "listing_status_events", ["listing_id"])

    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["listing_id"], ["car_listings.id"], name="fk_wishlist_items_listing_id_car_listings", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_wishlist_items_user_id_users", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_wishlist_items"),
        sa.UniqueConstraint("user_id", "listing_id", name="wishlist_user_listing"),
    )

    op.create_table(
        "enquiries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("buyer_id", sa.Uuid(), nullable=False),
        sa.Column("seller_id", sa.Uuid(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", enquiry_status, nullable=False, server_default="new"),
        sa.Column("responded_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], name="fk_enquiries_buyer_id_users", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["listing_id"], ["car_listings.id"], name="fk_enquiries_listing_id_car_listings", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], name="fk_enquiries_seller_id_users", ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name="pk_enquiries"),
    )
    op.create_index("ix_enquiries_seller_status_created", "enquiries", ["seller_id", "status", "created_at"])
    op.create_index("ix_enquiries_buyer_created", "enquiries", ["buyer_id", "created_at"])

    op.create_table(
        "listing_reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("reporter_id", sa.Uuid()),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("details", sa.Text()),
        sa.Column("status", report_status, nullable=False, server_default="open"),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["listing_id"], ["car_listings.id"], name="fk_listing_reports_listing_id_car_listings", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], name="fk_listing_reports_reporter_id_users", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_listing_reports"),
    )
    op.create_index("ix_listing_reports_status_created", "listing_reports", ["status", "created_at"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid()),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=False),
        sa.Column("target_id", sa.Uuid()),
        sa.Column("metadata", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], name="fk_audit_logs_actor_id_users", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_audit_logs"),
    )
    op.create_index("ix_audit_logs_actor_created", "audit_logs", ["actor_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_actor_created", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_listing_reports_status_created", table_name="listing_reports")
    op.drop_table("listing_reports")
    op.drop_index("ix_enquiries_buyer_created", table_name="enquiries")
    op.drop_index("ix_enquiries_seller_status_created", table_name="enquiries")
    op.drop_table("enquiries")
    op.drop_table("wishlist_items")
    op.drop_index("ix_listing_status_events_listing_id", table_name="listing_status_events")
    op.drop_table("listing_status_events")
    op.drop_index("uq_car_images_primary_per_listing", table_name="car_images")
    op.drop_index("ix_car_images_listing_sort", table_name="car_images")
    op.drop_table("car_images")
    op.drop_index("ix_car_listings_location", table_name="car_listings")
    op.drop_index("ix_car_listings_filters", table_name="car_listings")
    op.drop_index("ix_car_listings_discovery", table_name="car_listings")
    op.drop_table("car_listings")
    op.drop_table("user_profiles")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    for enum in (report_status, enquiry_status, body_type, transmission_type, fuel_type, listing_status, seller_type, user_role):
        enum.drop(bind, checkfirst=False)
