# Deployment

This application is provider-portable. A production deployment will require a managed PostgreSQL service, managed Redis when rate limiting/caching needs it, private S3-compatible object storage, a container runtime, HTTPS termination, and centralized logs/error monitoring.

Before production deployment:

1. Provision production secrets outside Git.
2. Run Alembic migrations as a controlled deployment step.
3. Configure `FRONTEND_ORIGIN` to the real HTTPS domain.
4. Configure object-storage access with least-privilege credentials.
5. Enable automated PostgreSQL backups and test a restore.
6. Run frontend checks, backend tests, and the production image build.
7. Add health checks, error tracking, and alerting.

The Dockerfiles deliberately separate development from production stages so deployment can use a leaner image later without changing application code.
