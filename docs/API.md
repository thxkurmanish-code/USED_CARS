# API

The backend serves a versioned JSON API beneath `/api/v1`. FastAPI will publish interactive OpenAPI documentation at `/docs` in development once protected endpoints are added.

Currently available endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness response for local tooling and deployment checks. |

Future endpoints must include Pydantic request/response schemas, a clear summary, authentication requirements, expected error responses, and backend authorization checks.
