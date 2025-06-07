from pydantic import BaseModel, ConfigDict


class MoveTrackRequest(BaseModel):
    track_id: str
    source_playlist_id: str
    target_playlist_id: str
    trash_playlist_id: str


class ClouderWeek(BaseModel):
    clouder_week: str
    start_date: str
    end_date: str


class SpotifyPlaylist(BaseModel):
    playlist_id: str
    playlist_name: str
    clouder_week: str
    clouder_pl_name: str
    clouder_pl_type: str
    model_config = ConfigDict(extra="allow")


class ClouderWeekResponse(BaseModel):
    clouder_week: str | None 