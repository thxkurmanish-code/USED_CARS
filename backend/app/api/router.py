from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.engagement import router as engagement_router
from app.api.routes.listings import router as listings_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(engagement_router)
api_router.include_router(listings_router)
