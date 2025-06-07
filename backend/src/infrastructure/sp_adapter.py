from src.config import settings

import httpx

class SpAdapter:
    def __init__(self):
        self.client = httpx.AsyncClient()

    def get_headers(self, sp_token: str):
        return {
            "Authorization": f"Bearer {sp_token}"
        }

    async def add_track_to_playlist(self, sp_token: str, track_id: str, playlist_id: str):
        headers = self.get_headers(sp_token)
        response = await self.client.post(f"{settings.SPOTIFY_BASE_URL}/playlists/{playlist_id}/tracks", json={"uris": [f"spotify:track:{track_id}"]}, headers=headers)
        return response.json()
    
    async def remove_track_from_playlist(self, sp_token: str, track_id: str, playlist_id: str):
        headers = self.get_headers(sp_token)
        response = await self.client.request('DELETE', f"{settings.SPOTIFY_BASE_URL}/playlists/{playlist_id}/tracks", json={"tracks": [{"uri": f"spotify:track:{track_id}"}]}, headers=headers)
        return response.json()