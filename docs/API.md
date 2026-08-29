# API

The backend serves a versioned JSON API beneath `/api/v1`. FastAPI will publish interactive OpenAPI documentation at `/docs` in development once protected endpoints are added.

Currently available endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness response for local tooling and deployment checks. |
| `POST` | `/api/v1/auth/register` | Create an individual customer account and issue an access token. |
| `POST` | `/api/v1/auth/login` | Authenticate an active account and issue an access token. |
| `GET` | `/api/v1/auth/me` | Return the current authenticated account. |

Future endpoints must include Pydantic request/response schemas, a clear summary, authentication requirements, expected error responses, and backend authorization checks.
