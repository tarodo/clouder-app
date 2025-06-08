from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from logging.config import dictConfig

from src.config import settings
from src.api.routers import auth, playlists
from src.infrastructure.mongo_adapter import AsyncMongoAdapter
from src.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # on startup
    logger.info("Connecting to MongoDB...")
    mongo_adapter = AsyncMongoAdapter(settings)
    await mongo_adapter.connect()
    app.state.mongo_adapter = mongo_adapter
    app.state.cache = {}
    yield
    # on shutdown
    logger.info("Closing MongoDB connection...")
    await app.state.mongo_adapter.close_connection()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(playlists.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Clouder App API"} 