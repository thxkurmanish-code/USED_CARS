# 🗄️ Dream Car Bazaar — Database Schema & Data Persistence Guide

PostgreSQL is the primary database engine for **Dream Car Bazaar**. The database schema enforces relational integrity, foreign key cascading rules, composite indexes, and value check constraints.

---

## 📊 Relational Database Model Overview

```text
users (id, email, password_hash, role, is_active)
  ├── user_profiles (user_id -> users.id)
  ├── car_listings (owner_id -> users.id)
  │     ├── car_images (listing_id -> car_listings.id [CASCADE])
  │     ├── listing_status_events (listing_id -> car_listings.id)
  │     ├── test_drives (listing_id -> car_listings.id, customer_id -> users.id)
  │     ├── chat_conversations (listing_id -> car_listings.id, customer_id -> users.id)
  │     │     └── chat_messages (conversation_id -> chat_conversations.id)
  │     ├── wishlist_items (listing_id -> car_listings.id, user_id -> users.id)
  │     └── listing_reports (listing_id -> car_listings.id, reporter_id -> users.id)
  └── password_reset_tokens (user_id -> users.id)

business_contacts (id, business_name, phone_number, whatsapp_number, email, address, hours)
```

---

## 🗃️ Key Table Specifications

| Table | Description | Primary Key | Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `users` | User accounts | UUID | `UNIQUE(email)`, Role Enum (`customer`, `admin`) |
| `user_profiles` | User profile details | UUID | `FK(user_id -> users.id)` |
| `car_listings` | Pre-owned car inventory | UUID | `FK(owner_id -> users.id)`, Index(`brand`, `model`, `price`, `city`), Status Enum (`draft`, `pending_review`, `active`, `sold`, etc.) |
| `car_images` | Vehicle photos metadata | UUID | `FK(listing_id -> car_listings.id ON DELETE CASCADE)`, Index(`listing_id`, `sort_order`) |
| `test_drive_requests` | Appointment bookings | UUID | `FK(listing_id)`, `FK(customer_id)`, Status Enum (`pending`, `approved`, `rescheduled`, `rejected`, `completed`) |
| `chat_conversations` | Buyer-Seller threads | UUID | `FK(listing_id)`, `FK(customer_id)` |
| `chat_messages` | Live chat messages | UUID | `FK(conversation_id)`, `FK(sender_id)` |
| `wishlist_items` | Saved car items | UUID | `UNIQUE(user_id, listing_id)` |
| `business_contacts` | Showroom contact details | UUID | Centralized showroom phone, WhatsApp, email, hours |

---

## ⚙️ PostgreSQL Connection Pooling Configuration

Connection pooling is configured in `backend/app/core/database.py` to prevent database exhaustion under concurrent multi-user load:

```python
engine_kwargs = {"pool_pre_ping": True}
if settings.database_url.startswith("postgresql"):
    engine_kwargs["pool_size"] = 10        # Active persistent connections
    engine_kwargs["max_overflow"] = 20     # Temporary burst connection limit
    engine_kwargs["pool_recycle"] = 1800   # Recycle connections after 30 mins
```

---

## 🔄 Seeding & Migration Commands

### Seeding Initial Data
To populate initial sample data or create the production admin:
```bash
python scripts/seed.py
```

- In **Development Mode (`APP_ENV=development`)**: Seeds sample cars, test accounts, and sample chat threads.
- In **Production Mode (`APP_ENV=production`)**: Only creates the single production admin user configured via `PRODUCTION_ADMIN_EMAIL` and `PRODUCTION_ADMIN_PASSWORD`.
