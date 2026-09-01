from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.core.logging import configure_logging
import app.models  # Ensure all models are registered


uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    try:
        from scripts.seed import seed_database
        seed_database()
    except Exception as e:
        print(f"[LIFESPAN] Seed status: {e}")
    yield



settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for the Dream Car Bazaar marketplace.",
    docs_url="/docs" if settings.is_development else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

allowed_origins = list({
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://dreamcarbazzaar.vercel.app",
    "https://dreamcarbazzaar.com",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(api_router)
app.include_router(health_router)

