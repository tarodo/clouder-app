from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import httpx
from src.infrastructure.mongo_adapter import AsyncMongoAdapter
from src.config import settings
from urllib.parse import urlencode

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

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


@app.get("/clouder-weeks")
async def get_clouder_weeks():
    logger.info(f"Getting clouder weeks from mongo")
    logger.info(f"Mongo URL: {settings.MONGO_URL}")
    logger.info(f"Mongo DB: {settings.MONGO_DB}")
    async with AsyncMongoAdapter(settings) as mongo:
        data = await mongo.get_data("clouder_weeks")
    return JSONResponse(data)