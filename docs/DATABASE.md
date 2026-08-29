# Database

PostgreSQL is the authoritative data store. Milestone 2 will introduce SQLAlchemy models and Alembic migrations for users, listings, images, wishlists, enquiries, reports, and audit events.

Database rules for all future migrations:

- Use foreign keys, constraints, and indexes in the database—not only in application code.
- Use UTC timestamps and a migration for every persistent schema change.
- Never store image binaries, passwords, tokens, or raw sensitive documents in public tables.
- Prefer archive/soft-delete fields for operational records where history matters.

Local PostgreSQL runs as the `postgres` Docker Compose service. Production connections must be supplied through `DATABASE_URL`; credentials never belong in source control.
