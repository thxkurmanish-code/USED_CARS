# 🚗 Dream Car Bazaar — Production Pre-Owned Car Marketplace

**Dream Car Bazaar** is a production-ready, full-stack used car marketplace platform engineered for real-world dealership and individual seller operations.

It provides a segregated architecture featuring an **Admin Console** for the business owner, a **Customer Seller Dashboard**, a **Public Buyer Marketplace**, live real-time chat, test drive appointment scheduling, and multi-photo vehicle galleries.

---

## ⚡ Core Features

- **Public Marketplace:** Filter by brand, price, year, mileage, fuel type, transmission, body type, and location.
- **Single-Cover + Multi-Gallery Photos:** High-resolution PIL optimization with AWS S3-compatible cloud storage support & local storage fallback.
- **Strict Role Separation:** Customers register strictly as `CUSTOMER`. Admin access (`ADMIN`) is strictly backend-enforced.
- **Admin Console:** Manage Showroom Inventory, moderate customer listings (Approve/Reject), handle test drives (Approve/Reschedule/Reject), chat with buyers, view reports, and update business contact details centrally.
- **Customer Dashboard:** Manage personal listings, upload photos, track test drives, chat with showroom representatives, and manage wishlist items.
- **Production Persistence:** PostgreSQL database compatibility with connection pooling, transaction isolation, and foreign key integrity.

---

## 🚀 Quick Start (Development Setup)

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python scripts/seed.py
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- -p 3000
```

- **Marketplace Web App:** [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Docker Deployment

To launch the complete production stack (PostgreSQL, Redis, FastAPI Backend, Next.js Frontend):

```bash
cp .env.example .env
docker compose up --build -d
```

---

## 📚 Complete Documentation Suite

| Guide | Target Audience | Description |
| :--- | :--- | :--- |
| **[Admin & Owner Guide](docs/ADMIN_GUIDE.md)** | Business Owner / Friend | Day-to-day operating instructions for managing listings, photos, test drives, chat, and contact info. |
| **[Setup Guide](docs/SETUP.md)** | Developers / Ops | Complete local and production installation guide. |
| **[Architecture Overview](docs/ARCHITECTURE.md)** | Developers | System topology, database relations, security controls, and design patterns. |
| **[Database Guide](docs/DATABASE.md)** | Database Engineers | PostgreSQL schemas, indexes, connection pooling, and migrations. |
| **[Deployment Guide](docs/DEPLOYMENT.md)** | DevOps / SysAdmin | Production environment variables, Docker Compose, S3 storage, and SSL setup. |
| **[Security Audit](docs/SECURITY.md)** | Security / Auditing | RBAC permissions, JWT authentication, rate limiting, and CORS configuration. |
| **[Backup & Restore](docs/BACKUP_AND_RESTORE.md)** | SysAdmin / Operations | Automated PostgreSQL dumps, S3 photo backups, and disaster recovery procedures. |
| **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Support / Ops | Diagnostic commands, error logs, and step-by-step resolution steps. |

---

## 🔑 Development Credentials

*(For local testing only. Never use demo passwords in production environments.)*

- **Admin / Showroom Owner:** `admin@dreamcar.com` / `Admin@123456`
- **Dealer Seller:** `dealer@apexmotors.com` / `Dealer@123456`
- **Customer Seller:** `jane.seller@gmail.com` / `Seller@123456`
- **Customer Buyer:** `alex.buyer@gmail.com` / `Buyer@123456`
