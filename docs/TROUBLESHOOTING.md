# 🛠️ Dream Car Bazaar — Production Troubleshooting Guide

This guide details common operational issues, log inspection commands, and step-by-step solutions for maintaining **Dream Car Bazaar**.

---

## 🔍 1. Log Inspection Commands

### Viewing Backend Container Logs
```bash
docker compose logs -f backend
```

### Viewing Frontend Container Logs
```bash
docker compose logs -f frontend
```

### Viewing PostgreSQL Database Logs
```bash
docker compose logs -f postgres
```

---

## 🛑 2. Common Issues & Solutions

### Issue A: "Connection Refused / Unable to connect to server"
- **Symptom:** Frontend displays network error banner or `Unable to connect to server`.
- **Cause:** Backend service is stopped or PostgreSQL container is initializing.
- **Solution:** Run `docker compose ps` to ensure all containers report `healthy`. Restart backend with `docker compose restart backend`.

### Issue B: "401 Unauthorized" or "403 Forbidden"
- **Symptom:** Admin actions (moderation, contact update, test drive approval) fail with 403 error.
- **Cause:** User session is expired or logged in with a `CUSTOMER` account instead of `ADMIN`.
- **Solution:** Log out, visit `/login`, and log in with your Admin credentials.

### Issue C: "Image upload fails"
- **Symptom:** Photo upload displays `Unable to upload photo`.
- **Cause:** S3 bucket permissions are invalid or local `/uploads` directory is read-only.
- **Solution:** Verify `S3_BUCKET_NAME` and credentials in `.env`. If using local storage, ensure directory permissions: `chmod -R 775 uploads`.

### Issue D: Database Port Conflict (`EADDRINUSE: 5432`)
- **Symptom:** Docker Compose fails to start `postgres` because port 5432 is in use by a local PostgreSQL service.
- **Solution:** Update `POSTGRES_PORT=5433` in `.env` or stop local PostgreSQL service (`sudo service postgresql stop`).

---

## 🆘 3. Support & Emergency Recovery

- **System Reset (Development Only):** `docker compose down -v && docker compose up --build -d`
- **Re-Seed Database:** `docker compose exec backend python scripts/seed.py`
