import httpx
from urllib.parse import urlencode
from fastapi import HTTPException

from src.config import AppSettings
from src.schemas.auth import TokenResponse


class SpotifyAuthService:
    def __init__(self, settings: AppSettings):
        self.settings = settings
        self.client = httpx.AsyncClient()

    def get_auth_url(self) -> str:
        params = {
            "client_id": self.settings.SPOTIFY_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": self.settings.SPOTIFY_REDIRECT_URI,
            "scope": self.settings.SPOTIFY_SCOPE,
        }
        return f"{self.settings.SPOTIFY_AUTH_URL}?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> TokenResponse:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.settings.SPOTIFY_REDIRECT_URI,
            "client_id": self.settings.SPOTIFY_CLIENT_ID,
            "client_secret": self.settings.SPOTIFY_CLIENT_SECRET,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        resp = await self.client.post(
            self.settings.SPOTIFY_TOKEN_URL, data=data, headers=headers
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Failed to retrieve token from Spotify: {resp.text}",
            )

        return TokenResponse.model_validate(resp.json())

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.settings.SPOTIFY_CLIENT_ID,
            "client_secret": self.settings.SPOTIFY_CLIENT_SECRET,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        resp = await self.client.post(
            self.settings.SPOTIFY_TOKEN_URL, data=data, headers=headers
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code, detail=f"Failed to refresh token: {resp.text}"
            )

        token_data = resp.json()
        if "refresh_token" not in token_data:
            token_data["refresh_token"] = refresh_token

        return TokenResponse.model_validate(token_data) 