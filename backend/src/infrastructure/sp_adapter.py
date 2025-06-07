from src.config import AppSettings

import httpx
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class SpAdapter:
    def __init__(self, settings: AppSettings):
        self.client = httpx.AsyncClient(base_url=settings.SPOTIFY_BASE_URL)

    def _get_headers(self, sp_token: str):
        return {"Authorization": f"Bearer {sp_token}"}

    async def _request(self, method: str, url: str, sp_token: str, **kwargs):
        headers = self._get_headers(sp_token)
        try:
            response = await self.client.request(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            if response.status_code == 204:
                return None
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(
                f"Spotify API request failed: {e.response.status_code} - {e.response.text}"
            )
            detail = (
                e.response.json()
                if "application/json" in e.response.headers.get("content-type", "")
                else e.response.text
            )
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except Exception as e:
            logger.error(f"An unexpected error occurred with Spotify API: {e}")
            raise HTTPException(
                status_code=500, detail="Internal server error with Spotify API"
            )

    async def add_track_to_playlist(self, sp_token: str, track_id: str, playlist_id: str):
        url = f"/playlists/{playlist_id}/tracks"
        json_data = {"uris": [f"spotify:track:{track_id}"]}
        return await self._request("POST", url, sp_token, json=json_data)

    async def remove_track_from_playlist(self, sp_token: str, track_id: str, playlist_id: str):
        url = f"/playlists/{playlist_id}/tracks"
        json_data = {"tracks": [{"uri": f"spotify:track:{track_id}"}]}
        return await self._request("DELETE", url, sp_token, json=json_data)