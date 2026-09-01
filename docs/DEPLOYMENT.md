# 🚀 Dream Car Bazaar — Production Deployment Guide

This guide details how to deploy **Dream Car Bazaar** to a production server (VPS, AWS EC2, DigitalOcean Droplet, or cloud container platform) using Docker Compose, PostgreSQL, Redis, and S3 Object Storage.

---

## 🛠️ Production Architecture Checklist

- [x] **HTTPS / Reverse Proxy:** NGINX or Caddy handling SSL certificates (Let's Encrypt).
- [x] **PostgreSQL 17 Database:** Managed PostgreSQL or Dockerized PostgreSQL container with persistent volumes.
- [x] **AWS S3 / Cloudflare R2 Storage:** S3 bucket for persistent car photo storage across server restarts.
- [x] **Single Production Admin:** Admin account provisioned via `PRODUCTION_ADMIN_EMAIL` and `PRODUCTION_ADMIN_PASSWORD`.
- [x] **Secret Management:** 64-character `APP_SECRET_KEY` set via environment variables outside Git.

---

## 📋 Step-by-Step Production Deployment

### Step 1: Clone Repository & Create `.env`
```bash
git clone https://github.com/your-org/used-cars.git /opt/dreamcarbazaar
cd /opt/dreamcarbazaar

cp .env.example .env
```

### Step 2: Configure Production Environment Variables
Edit `.env` on your production server:

```env
APP_ENV=production
APP_SECRET_KEY=generate-a-64-character-random-key-here
FRONTEND_ORIGIN=https://dreamcarbazaar.com
NEXT_PUBLIC_API_BASE_URL=https://api.dreamcarbazaar.com/api/v1

# Production PostgreSQL Database
POSTGRES_DB=dream_car_bazaar
POSTGRES_USER=dreamcar_prod
POSTGRES_PASSWORD=UseAStrongSecureDatabasePassword123!
DATABASE_URL=postgresql+psycopg://dreamcar_prod:UseAStrongSecureDatabasePassword123!@postgres:5432/dream_car_bazaar

# Single Production Admin (The Friend / Business Owner)
PRODUCTION_ADMIN_EMAIL=dreamcarsbazzaar@gmail.com
PRODUCTION_ADMIN_PASSWORD=OwnerSecurePassword2026!


# S3 Photo Storage Configuration
S3_BUCKET_NAME=dream-car-bazaar-photos
S3_ENDPOINT_URL=https://s3.us-east-1.amazonaws.com
S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
S3_REGION_NAME=us-east-1
S3_PUBLIC_CUSTOM_DOMAIN=https://cdn.dreamcarbazaar.com
```

### Step 3: Launch Containers with Docker Compose
```bash
docker compose up --build -d
```

### Step 4: Seed Production Admin User
```bash
docker compose exec backend python scripts/seed.py
```
*Note: In `APP_ENV=production`, `seed.py` creates ONLY the specified `PRODUCTION_ADMIN_EMAIL` user and skips demo dummy listings.*

### Step 5: Configure NGINX Reverse Proxy & SSL (Let's Encrypt)

Sample NGINX virtual host configuration:

```nginx
server {
    server_name dreamcarbazaar.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name api.dreamcarbazaar.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtain SSL certificate using Certbot:
```bash
sudo certbot --nginx -d dreamcarbazaar.com -d api.dreamcarbazaar.com
```
