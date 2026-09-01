import os

os.environ.setdefault("APP_SECRET_KEY", "test-secret-not-for-production-with-adequate-length")

from app.models import Base


def test_initial_metadata_contains_marketplace_tables() -> None:
    assert set(Base.metadata.tables) == {
        "audit_logs",
        "business_contacts",
        "car_images",
        "car_listings",
        "chat_messages",
        "conversations",
        "enquiries",
        "listing_reports",
        "listing_status_events",
        "password_reset_tokens",
        "test_drives",
        "user_profiles",
        "users",
        "wishlist_items",
    }



def test_wishlist_has_duplicate_prevention_constraint() -> None:
    wishlist = Base.metadata.tables["wishlist_items"]
    constraint_columns = [
        tuple(constraint.columns.keys()) for constraint in wishlist.constraints if constraint.name
    ]

    assert ("user_id", "listing_id") in constraint_columns
