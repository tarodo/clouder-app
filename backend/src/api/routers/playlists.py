from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException

from src.services.playlists import PlaylistService
from src.schemas.playlists import (
    MoveTrackRequest,
    ClouderWeek,
    SpotifyPlaylist,
    ClouderWeekResponse,
)
from src.api.dependencies import get_playlist_service

router = APIRouter(tags=["Playlists"])


@router.get("/clouder_weeks", response_model=List[ClouderWeek])
async def get_clouder_weeks(
    playlist_service: PlaylistService = Depends(get_playlist_service),
):
    return await playlist_service.get_clouder_weeks()


@router.get(
    "/clouder_weeks/{clouder_week}/sp_playlists", response_model=List[SpotifyPlaylist]
)
async def get_clouder_week_playlists(
    clouder_week: str,
    cache: bool = True,
    playlist_service: PlaylistService = Depends(get_playlist_service),
):
    return await playlist_service.get_playlists_by_week(clouder_week, cache)


@router.get(
    "/clouder_playlists/{sp_playlist_id}/clouder_week",
    response_model=ClouderWeekResponse,
)
async def get_clouder_playlist_week(
    sp_playlist_id: str,
    cache: bool = True,
    playlist_service: PlaylistService = Depends(get_playlist_service),
):
    return await playlist_service.get_week_by_playlist(sp_playlist_id, cache)


@router.post("/clouder_playlists/move_track")
async def move_track(
    request: MoveTrackRequest,
    sp_token: str = Query(...),
    playlist_service: PlaylistService = Depends(get_playlist_service),
):
    return await playlist_service.move_track(sp_token, request) 