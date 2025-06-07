from typing import List, Dict, Any

from src.infrastructure.mongo_adapter import AsyncMongoAdapter
from src.infrastructure.sp_adapter import SpAdapter
from src.schemas.playlists import (
    MoveTrackRequest,
    ClouderWeek,
    SpotifyPlaylist,
    ClouderWeekResponse,
)


class PlaylistService:
    def __init__(
        self, mongo_adapter: AsyncMongoAdapter, sp_adapter: SpAdapter, cache: Dict[str, Any]
    ):
        self.mongo = mongo_adapter
        self.spotify = sp_adapter
        self.cache = cache

    async def get_clouder_weeks(self) -> List[ClouderWeek]:
        data = await self.mongo.get_data("clouder_weeks")
        return [ClouderWeek.model_validate(item) for item in data]

    async def get_playlists_by_week(
        self, clouder_week: str, use_cache: bool
    ) -> List[SpotifyPlaylist]:
        cache_key = f"sp_playlists_{clouder_week}"
        if use_cache and cache_key in self.cache:
            cached_data = self.cache[cache_key]
            return [SpotifyPlaylist.model_validate(item) for item in cached_data]

        data = await self.mongo.get_data("sp_playlists", {"clouder_week": clouder_week})
        if use_cache:
            self.cache[cache_key] = data
        return [SpotifyPlaylist.model_validate(item) for item in data]

    async def get_week_by_playlist(
        self, sp_playlist_id: str, use_cache: bool
    ) -> ClouderWeekResponse:
        cache_key = f"clouder_week_{sp_playlist_id}"
        if use_cache and cache_key in self.cache:
            return ClouderWeekResponse.model_validate(self.cache[cache_key])

        data = await self.mongo.get_data("sp_playlists", {"playlist_id": sp_playlist_id})
        if not data:
            return ClouderWeekResponse(clouder_week=None)

        playlist_data = data[0]
        response_data = {"clouder_week": playlist_data.get("clouder_week")}

        if use_cache:
            self.cache[cache_key] = response_data
        return ClouderWeekResponse.model_validate(response_data)

    async def move_track(self, sp_token: str, move_request: MoveTrackRequest):
        if move_request.source_playlist_id == move_request.target_playlist_id:
            return {"message": "Track already in target playlist"}

        await self.spotify.add_track_to_playlist(sp_token, move_request.track_id, move_request.target_playlist_id)
        if move_request.trash_playlist_id != move_request.target_playlist_id:
            await self.spotify.add_track_to_playlist(sp_token, move_request.track_id, move_request.trash_playlist_id)
        if move_request.source_playlist_id != move_request.trash_playlist_id:
            await self.spotify.remove_track_from_playlist(sp_token, move_request.track_id, move_request.source_playlist_id)

        return {"message": "Track moved successfully"} 