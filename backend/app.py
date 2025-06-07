from fastapi import FastAPI, Request, HTTPException
from fastapi.params import Query
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import httpx
from src.infrastructure.sp_adapter import SpAdapter
from src.infrastructure.mongo_adapter import AsyncMongoAdapter
from src.config import settings
from urllib.parse import urlencode

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.state.cache = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/login")
def login():
    params = {
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "scope": settings.SPOTIFY_SCOPE,
    }
    url = f"{settings.SPOTIFY_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)


@app.get("/callback")
async def callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "client_secret": settings.SPOTIFY_CLIENT_SECRET,
    }
    logger.info(f"Requesting token with data: {data}")
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(settings.SPOTIFY_TOKEN_URL, data=data, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        token_data = resp.json()

    allowed = ["access_token", "refresh_token", "expires_in", "token_type", "scope"]
    safe_token_data = {k: v for k, v in token_data.items() if k in allowed}
    params = urlencode(safe_token_data)
    return RedirectResponse(f"http://localhost:5173/spotify-callback?{params}")


@app.post("/refresh_token")
async def refresh_token(request: Request):
    body = await request.json()
    refresh_token = body.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh_token provided")
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "client_secret": settings.SPOTIFY_CLIENT_SECRET,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(settings.SPOTIFY_TOKEN_URL, data=data, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        token_data = resp.json()
    return JSONResponse(token_data)


@app.get("/clouder_weeks")
async def get_clouder_weeks():
    async with AsyncMongoAdapter(settings) as mongo:
        data = await mongo.get_data("clouder_weeks")
    return JSONResponse(data)


@app.get("/clouder_weeks/{clouder_week}/sp_playlists")
async def get_clouder_week_playlists(clouder_week: str, cache: bool = True):
    cache_key = f"sp_playlists_{clouder_week}"
    if cache and cache_key in app.state.cache:
        return JSONResponse(app.state.cache[cache_key])
        
    async with AsyncMongoAdapter(settings) as mongo:
        data = await mongo.get_data("sp_playlists", {"clouder_week": clouder_week})
        if cache:
            app.state.cache[cache_key] = data
    return JSONResponse(data)


@app.get("/clouder_playlists/{sp_playlist_id}/clouder_week") 
async def get_clouder_playlist(sp_playlist_id: str, cache: bool = True):
    cache_key = f"clouder_week_{sp_playlist_id}"
    if cache and cache_key in app.state.cache:
        return JSONResponse(app.state.cache[cache_key])

    async with AsyncMongoAdapter(settings) as mongo:
        data = await mongo.get_data("sp_playlists", {"playlist_id": sp_playlist_id})
        if not data:
            return JSONResponse({"error": "Playlist not found"})
        playlist_data = data[0]
        clouder_week = playlist_data.get("clouder_week")
        response = {"clouder_week": clouder_week}
        if cache:
            app.state.cache[cache_key] = response
    return JSONResponse(response)


@app.post("/clouder_playlists/move_track")
async def move_track(request: Request, sp_token: str = Query(...)):
    body = await request.json()
    track_id = body.get("track_id")
    source_playlist_id = body.get("source_playlist_id")
    target_playlist_id = body.get("target_playlist_id")
    trash_playlist_id = body.get("trash_playlist_id")
    if source_playlist_id == target_playlist_id:
        return JSONResponse({"message": "Track already in target playlist"})
    sp_adapter = SpAdapter()
    await sp_adapter.add_track_to_playlist(sp_token, track_id, target_playlist_id)
    if trash_playlist_id != target_playlist_id:
        await sp_adapter.add_track_to_playlist(sp_token, track_id, trash_playlist_id)
    if source_playlist_id != trash_playlist_id:
        await sp_adapter.remove_track_from_playlist(sp_token, track_id, source_playlist_id)
    return JSONResponse({"message": "Track moved successfully"})
