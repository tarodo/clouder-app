from fastapi import Request, Depends
from functools import lru_cache
import logging

from src.config import AppSettings, settings
from src.infrastructure.mongo_adapter import AsyncMongoAdapter
from src.infrastructure.sp_adapter import SpAdapter
from src.services.auth import SpotifyAuthService
from src.services.playlists import PlaylistService

logger = logging.getLogger(__name__)


@lru_cache
def get_app_settings() -> AppSettings:
    return settings


@lru_cache
def get_spotify_auth_service() -> SpotifyAuthService:
    return SpotifyAuthService(settings=get_app_settings())


@lru_cache
def get_sp_adapter() -> SpAdapter:
    return SpAdapter(settings=get_app_settings())


def get_mongo_adapter(request: Request) -> AsyncMongoAdapter:
    return request.app.state.mongo_adapter


def get_playlist_service(
    request: Request,
    mongo_adapter: AsyncMongoAdapter = Depends(get_mongo_adapter),
    sp_adapter: SpAdapter = Depends(get_sp_adapter),
) -> PlaylistService:
    return PlaylistService(
        mongo_adapter=mongo_adapter, sp_adapter=sp_adapter, cache=request.app.state.cache
    ) 