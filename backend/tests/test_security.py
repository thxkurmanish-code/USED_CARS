import os
from uuid import uuid4

os.environ.setdefault("APP_SECRET_KEY", "test-secret-not-for-production-with-adequate-length")

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole


def test_password_hash_is_not_the_original_password() -> None:
    password = "AsecurePassword123"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_round_trip_contains_subject_and_role() -> None:
    user_id = uuid4()
    token = create_access_token(user_id, UserRole.ADMIN, auth_version=2)

    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "admin"
    assert payload["ver"] == 2
