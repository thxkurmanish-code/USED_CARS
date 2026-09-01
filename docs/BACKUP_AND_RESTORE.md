# 💾 Dream Car Bazaar — Production Backup & Restore Procedures

This document provides step-by-step procedures for automated PostgreSQL backups, S3 image backups, manual database dumps, and disaster recovery restoration.

---

## 📅 1. Production Backup Strategy

| Component | Target Storage | Backup Method | Recommended Frequency |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Secure Off-Site Server / S3 | Compressed `pg_dump` | Daily at 02:00 UTC |
| **Car Photos & Uploads** | AWS S3 / Cloudflare R2 | S3 Object Versioning | Continuous / Real-time |
| **Environment Configuration** | Encrypted Password Manager | Secure Offline Storage | On every configuration update |

---

## 📦 2. Performing a Manual PostgreSQL Backup

To generate a compressed, timestamped dump of the production database:

```bash
# Set timestamp variable
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Execute pg_dump inside Docker container
docker compose exec -T postgres pg_dump -U dreamcar_prod -F c dream_car_bazaar > ./backups/db_backup_${TIMESTAMP}.dump
```

---

## 🔄 3. Restoring a PostgreSQL Database Dump

To restore a database dump into PostgreSQL:

```bash
# 1. Stop backend service during restore to prevent conflicting writes
docker compose stop backend

# 2. Restore database from dump file
docker compose exec -T postgres pg_restore -U dreamcar_prod -d dream_car_bazaar --clean ./backups/db_backup_20260831_020000.dump

# 3. Restart backend service
docker compose start backend
```

---

## 🤖 4. Setting Up Automated Daily Cron Backup

Add the following cron job to `/etc/cron.d/dreamcar_backup`:

```cron
0 2 * * * root /usr/bin/docker compose -f /opt/dreamcarbazaar/docker-compose.yml exec -T postgres pg_dump -U dreamcar_prod -F c dream_car_bazaar > /var/backups/dreamcar/db_$(date +\%Y\%m\%d).dump 2>&1
```

---

## 🛡️ 5. Backup Verification & Recovery Drills

1. **Monthly Restore Drill:** Restore the latest `.dump` file into a local test database instance.
2. **Data Integrity Check:** Verify that user accounts, car listings, test drive appointments, and chat conversations exist.
3. **Log Audit:** Record restore duration and confirm 0 errors.
