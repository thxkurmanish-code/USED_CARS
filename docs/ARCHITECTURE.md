# Architecture

Dream Car Bazaar is a **modular monolith**: one web frontend, one API service, and one primary relational database. This keeps deployment and development manageable while retaining clear boundaries for future growth.

```text
Browser
  │ HTTPS
  ▼
Next.js frontend ───────► FastAPI API ───────► PostgreSQL
                                │
                                ├────────────► Redis (rate limits / selective cache)
                                │
                                └────────────► S3-compatible storage (future car images)
```

## Frontend

`frontend/app` owns route composition. Reusable visual components live in `components`; product capabilities will live in `features`; API clients live in `services`; shared helpers live in `lib`; and shared TypeScript contracts live in `types`. Route handlers should remain thin and call feature-level code.

## Backend

`backend/app/api` exposes HTTP routes. Routes validate input and delegate to `services`, which will contain business rules. `repositories` will isolate database access; `models` define SQLAlchemy persistence; and `schemas` define Pydantic API contracts. `core` owns configuration, logging, security primitives, and future dependencies.

## Data and infrastructure

PostgreSQL is the system of record. Redis is reserved for data with a clear short-lived or coordination benefit, beginning with rate limiting. Car-image bytes will go to private S3-compatible object storage; PostgreSQL will retain metadata and object references only. Docker Compose provides the local service topology.

## Design principles

- API authorization is always enforced in the backend.
- Business logic stays outside HTTP route handlers.
- Schema changes are delivered through reviewed Alembic migrations.
- Public pages never imply vehicle verification unless verified data exists.
- Dependencies between modules flow inward: API → services → repositories/models.
