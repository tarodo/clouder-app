from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

from src.services.auth import SpotifyAuthService
from src.schemas.auth import TokenRefreshRequest, TokenResponse
from src.api.dependencies import get_spotify_auth_service, get_app_settings
from src.config import AppSettings


router = APIRouter(tags=["Authentication"])


@router.get("/login")
async def login(auth_service: SpotifyAuthService = Depends(get_spotify_auth_service)):
    auth_url = auth_service.get_auth_url()
    return RedirectResponse(auth_url)


@router.get("/callback")
async def callback(
    request: Request,
    auth_service: SpotifyAuthService = Depends(get_spotify_auth_service),
    settings: AppSettings = Depends(get_app_settings),
):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")

    token_data = await auth_service.exchange_code_for_token(code)

    params = urlencode(token_data.model_dump(exclude_none=True))
    return RedirectResponse(f"{settings.FRONTEND_URL}/spotify-callback?{params}")


@router.post("/refresh_token", response_model=TokenResponse)
async def refresh_token(
    body: TokenRefreshRequest,
    auth_service: SpotifyAuthService = Depends(get_spotify_auth_service),
):
    token_data = await auth_service.refresh_token(body.refresh_token)
    return token_data 