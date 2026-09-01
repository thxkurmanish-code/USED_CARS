# 🛡️ Dream Car Bazaar — Security Audit & Controls Guide

This document outlines the security architecture, role-based access control (RBAC), token handling, upload security, and threat mitigations implemented in **Dream Car Bazaar**.

---

## 🔒 1. Authentication & Password Security

- **Password Hashing:** Uses `Argon2id` password hashing via `pwdlib` (`app/core/security.py`). Plaintext passwords are never stored or logged.
- **Session Tokens:** Auth tokens are signed JWTs containing user ID (`sub`), user role (`role`), and token version (`ver`).
- **HTTP-Only Cookies:** Auth tokens are stored in `HttpOnly`, `SameSite=Lax` cookies, preventing XSS-based token theft.
- **Token Invalidation:** Modifying `auth_version` invalidates all previously issued JWT tokens instantly across all devices.

---

## ⛔ 2. Strict Role Isolation & Admin Security

- **Registration Guard:** Public user registration (`POST /api/v1/auth/register`) strictly sets `user.role = UserRole.CUSTOMER`. Users cannot select or pass an `ADMIN` role.
- **Backend-Enforced Authorization:** Every administrative endpoint (`/api/v1/admin/*`, `/api/v1/admin/contact`, moderation APIs) enforces `Depends(require_role(UserRole.ADMIN))` at the backend level.
- **Single Production Admin:** Production admin creation is restricted to the initial seeding script (`python scripts/seed.py`) using environment variables `PRODUCTION_ADMIN_EMAIL` and `PRODUCTION_ADMIN_PASSWORD`.

---

## 🖼️ 3. Image Upload & File Security

- **File Compression & Rescaling:** Image files are parsed and resized using PIL (LANCZOS max 2048px). Non-image files or malicious payloads are rejected.
- **Isolated Storage Keys:** Uploaded files are assigned UUID storage keys (`/uploads/{listing_id}/{uuid}.jpg` or `s3://...`). Original filenames are sanitized and stored separately.
- **Ownership Verification:** Image deletion (`DELETE /listings/{id}/images/{image_id}`) requires the user to be the listing owner or an Admin.

---

## 🌐 4. CORS & Network Security

- **Strict CORS Origin:** `CORSMiddleware` restricts cross-origin requests exclusively to `settings.frontend_origin` (e.g. `http://localhost:3000` or `https://dreamcarbazaar.com`).
- **Credentials Allowed:** `allow_credentials=True` permits session cookies between frontend and backend origins while blocking untrusted origins.
