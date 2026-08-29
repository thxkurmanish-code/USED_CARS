"""Add token invalidation version to users.

Revision ID: 20260829_0002
Revises: 20260829_0001
Create Date: 2026-08-29 23:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_0002"
down_revision: str | None = "20260829_0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("auth_version", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("users", "auth_version", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "auth_version")
