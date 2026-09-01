# 🛠️ Dream Car Bazaar — System Setup & Installation Guide

This document provides complete instructions for setting up **Dream Car Bazaar** both for local development and for production deployment.

---

## 📋 System Prerequisites

| Component | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Python** | `3.11+` | Required for backend FastAPI service |
| **Node.js** | `18+` | Required for frontend Next.js application |
| **Docker & Compose** | `20.10+` | Recommended for full containerized stack |
| **PostgreSQL** | `14+` | Production relational database engine |
| **Redis** | `7+` | Cache & session storage |

---

## ⚡ Option 1: Quick Start with Docker Compose (Recommended)

Docker Compose starts PostgreSQL, Redis, FastAPI Backend, and Next.js Frontend in isolated containers.

### 1. Copy Environment Configuration
```bash
cp .env.example .env
```

### 2. Configure Secrets in `.env`
Edit `.env` to set your secrets:
```env
APP_ENV=development
APP_SECRET_KEY=generate-a-64-character-random-key-here
POSTGRES_PASSWORD=your-secure-postgres-password
DATABASE_URL=postgresql+psycopg://dreamcar:your-secure-postgres-password@postgres:5432/dream_car_bazaar
```

### 3. Launch Container Stack
```bash
docker compose up --build -d
```

### 4. Seed Database
```bash
docker compose exec backend python scripts/seed.py
```

### 5. Access Services
- **Frontend Marketplace:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 💻 Option 2: Local Development Setup (Without Docker)

### 1. Backend Setup (FastAPI & Python)
```bash
cd backend

# Create Virtual Environment
python -m venv .venv

# Activate Virtual Environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Seed Database
python scripts/seed.py

# Start Backend Dev Server
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (Next.js & TypeScript)
```bash
cd frontend

# Install Node Packages
npm install

# Start Next.js Dev Server
npm run dev -- -p 3000
```

---

## 🧪 Running Code Quality & Test Suites

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Typechecking & Linting
```bash
cd frontend
npm run typecheck
npm run lint
```
