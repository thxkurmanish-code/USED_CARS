# 🏛️ Dream Car Bazaar — High-Level Architecture & System Design

**Dream Car Bazaar** is designed as a clean, highly reliable **Modular Monolith**. It consists of a Next.js App Router frontend, a FastAPI Python backend, a PostgreSQL relational database, Redis cache/rate limiter, and S3-compatible cloud object storage.

---

## 🏗️ System Topology Diagram

```text
               ┌──────────────────────────────────────────────┐
               │              Client Web Browsers             │
               └──────────────────────┬───────────────────────┘
                                      │ HTTPS
                                      ▼
               ┌──────────────────────────────────────────────┐
               │           Next.js 15 Web Frontend            │
               │              (Port 3000 / React)             │
               └──────────────────────┬───────────────────────┘
                                      │ REST API / JSON (HTTP-Only Cookies)
                                      ▼
               ┌──────────────────────────────────────────────┐
               │             FastAPI Python Backend           │
               │               (Port 8000 / Uvicorn)          │
               └───────┬──────────────┬───────────────┬───────┘
                       │              │               │
        SQL Queries    │              │ Cache/Limits  │ Image I/O
        (SQLAlchemy)   │              │ (Redis)       │ (Boto3 / Disk)
                       ▼              ▼               ▼
           ┌──────────────┐   ┌──────────────┐   ┌─────────────────────────┐
           │  PostgreSQL  │   │  Redis 7.0   │   │  AWS S3 / R2 / Local    │
           │  (Port 5432) │   │  (Port 6379) │   │  Object Photo Storage   │
           └──────────────┘   └──────────────┘   └─────────────────────────┘
```

---

## 🧩 Architectural Layers & Component Responsibilities

### 1. Frontend Layer (`/frontend`)
- **Next.js App Router (`/app`):** Handles client-side page rendering (`/cars`, `/cars/[id]`, `/sell`, `/admin`, `/dashboard`, `/contact`, `/login`).
- **Feature Components (`/components`):** Reusable UI widgets (`SiteHeader`, `ImageUploader`, `TestDriveModal`, `ChatDrawer`, `TrustBadge`).
- **API Client (`/services/api-client.ts`):** Handles HTTP fetch requests, credentials inclusion (`credentials: "include"`), and structured error message extraction.
- **Role Isolation:** Header and navigation conditionally render Admin vs Customer views based on authenticated user state.

### 2. Backend Layer (`/backend`)
- **API Controllers (`/app/api/routes`):** Expose HTTP endpoints for auth, listings, test drives, chat, wishlist, admin actions, and contact info.
- **Service Layer (`/app/services`):** Encapsulates core business logic (e.g. `ListingService`, `StorageService`, `AuthService`).
- **Data Models (`/app/models`):** Declarative SQLAlchemy 2.0 ORM entities with explicit constraints and index mappings.
- **Schemas (`/app/schemas`):** Pydantic v2 schemas for strict request validation and response serialisation.
- **Dependencies (`/app/api/dependencies.py`):** JWT token validation, cookie parsing, and role guards (`require_role(UserRole.ADMIN)`).

### 3. Data & Storage Layer
- **PostgreSQL Database:** Primary relational datastore handling user accounts, car listings, car images metadata, test drive bookings, chat conversations, and wishlist items.
- **S3 / Local File Storage Abstraction:** `StorageService` auto-detects S3 environment variables (`S3_BUCKET_NAME`). If present, images stream to AWS S3 / Cloudflare R2; otherwise, images are optimized via PIL and saved to local disk in `/uploads/`.

---

## 🔒 Security & Authorization Flow

1. **Authentication:** Uses secure JWT access tokens issued upon login and stored in `HttpOnly`, `SameSite=Lax` session cookies.
2. **Role Enforcements:** Users are strictly partitioned into `CUSTOMER` or `ADMIN`. Regular user registration cannot elevate roles.
3. **Backend Guards:** All administrative routes (`/api/v1/admin/*`, `/api/v1/admin/contact`, moderation endpoints) enforce `Depends(require_role(UserRole.ADMIN))`. Frontend routes are secondary UX protection.
