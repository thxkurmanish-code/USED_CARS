# Dream Car Bazaar

Dream Car Bazaar is a modular-monolith used-car marketplace for dealer inventory and individual sellers. This repository starts with the production-minded foundation: a Next.js frontend, FastAPI backend, PostgreSQL database, Redis, Docker-based local development, and baseline quality tooling.

> **Current milestone:** 1 — architecture and repository setup. Business features such as accounts, listings, image uploads, and moderation are intentionally not implemented yet.

## Quick start

1. Copy `.env.example` to `.env` and set a safe local password and app secret.
2. Install Docker Desktop and start it.
3. Run `docker compose up --build`.
4. Open `http://localhost:3000` for the frontend and `http://localhost:8000/health` for the backend health check.

For the complete setup and troubleshooting guide, see [docs/SETUP.md](docs/SETUP.md). Architecture decisions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository layout

```text
.
├── backend/          # FastAPI API, future domain services, tests, migrations
├── frontend/         # Next.js App Router application and UI feature modules
├── docs/             # Developer and operational documentation
├── docker-compose.yml
└── .env.example
```

## Available quality commands

```powershell
# frontend
cd frontend
npm install
npm run lint
npm run typecheck
npm run test:e2e

# backend
cd ../backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
pytest
ruff check .
```

## Documentation

- [Setup](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
- [Backup and restore](docs/BACKUP_AND_RESTORE.md)
- [Admin guide](docs/ADMIN_GUIDE.md)
- [Contributing](docs/CONTRIBUTING.md)
