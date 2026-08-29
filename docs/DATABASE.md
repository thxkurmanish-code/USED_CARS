# Database

PostgreSQL is the authoritative data store. The initial Alembic revision creates users, profiles, car listings, image metadata, listing-status history, wishlists, enquiries, reports, and audit events.

Database rules for all future migrations:

- Use foreign keys, constraints, and indexes in the database—not only in application code.
- Use UTC timestamps and a migration for every persistent schema change.
- Never store image binaries, passwords, tokens, or raw sensitive documents in public tables.
- Prefer archive/soft-delete fields for operational records where history matters.

Local PostgreSQL runs as the `postgres` Docker Compose service. Production connections must be supplied through `DATABASE_URL`; credentials never belong in source control.

## Initial schema

`car_listings` retains public vehicle data and workflow state. It deliberately excludes document contents and image bytes. `car_images` holds safe storage metadata and object keys; actual images will be kept in private S3-compatible storage in Milestone 5.

`listing_status_events` records every workflow transition. `audit_logs` will hold security-relevant admin actions, while `wishlist_items` prevents duplicate saved cars with a database uniqueness constraint.

The listing state enum supports: `draft`, `pending_review`, `approved`, `active`, `rejected`, `suspended`, `sold`, and `expired`. State-transition authorization belongs in the later service layer; the database preserves the history and valid set of states.

## Migrations

From `backend/`, with PostgreSQL running and `DATABASE_URL` configured:

```powershell
alembic upgrade head
alembic current
```

Create future revisions with `alembic revision --autogenerate -m "describe change"`, review the generated migration, then apply it. Never use `Base.metadata.create_all()` in production.
