from fastapi import APIRouter, status

from app.schemas.health import HealthResponse

router = APIRouter(tags=["system"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Check API liveness",
)
async def health_check() -> HealthResponse:
    """Return a non-sensitive response suitable for health monitoring."""
    return HealthResponse()
