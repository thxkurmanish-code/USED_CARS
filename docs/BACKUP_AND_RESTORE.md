# Backup and restore

## Production policy

Production PostgreSQL must use automated, encrypted backups with a retention period chosen by the business. Object storage must use versioning or equivalent recoverability. Backup access must be restricted and monitored.

## Restore drill

At least quarterly, restore a recent backup into an isolated non-production environment and verify that the application can read core data without exposing it publicly. Record the backup timestamp, restore duration, and result.

## Local development

Local Compose data is in the named `postgres_data` volume. `docker compose down` preserves it. `docker compose down --volumes` removes it, so only use that when resetting disposable local data.
