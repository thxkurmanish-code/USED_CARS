# Security

Security is implemented incrementally with each feature. The baseline foundation keeps secrets in environment variables, scopes CORS to the configured frontend origin, and exposes only a non-sensitive health response.

Authentication uses Argon2 password hashes and short-lived, signed bearer tokens. Tokens include an account token-version value, allowing a future password reset or account-security workflow to invalidate previously issued tokens. Every protected endpoint must load the user and check its current active status server-side; frontend role display is never an authorization control.

Before authentication is released, the backend will add password hashing, secure token/session handling, role-based authorization, rate limits, secure headers, audit logging, and structured redaction-aware logging. Uploads will require content/type/size validation and private object-storage access. Security-sensitive changes require automated authorization tests.

Never commit `.env` files, private keys, production URLs with credentials, passwords, session tokens, or customer documents.
