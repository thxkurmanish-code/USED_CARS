# Setup

## Prerequisites

- Docker Desktop with Docker Compose
- Node.js 22 or later for running the frontend without containers
- Python 3.12 or later for running the backend without containers

## Docker development (recommended)

Copy the environment template:

```powershell
Copy-Item .env.example .env
```

Change `POSTGRES_PASSWORD` and `APP_SECRET_KEY` in `.env`, then start all local services:

```powershell
docker compose up --build
```

The frontend is at `http://localhost:3000`. The API health endpoint is at `http://localhost:8000/health`. Stop the environment with `docker compose down`; add `--volumes` only when you deliberately want to remove local database data.

## Running without Docker

Start PostgreSQL and Redis separately, create `backend/.env` with a local `DATABASE_URL` and `REDIS_URL`, then run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

## Checks

```powershell
cd frontend
npm run lint
npm run typecheck

cd ../backend
pytest
ruff check .
```

Database migrations will be added in Milestone 2. At that point this guide will include the exact Alembic commands.
