from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str
    SPOTIFY_REDIRECT_URI: str = "http://127.0.0.1:80/api/callback"
    SPOTIFY_BASE_URL: str = "https://api.spotify.com/v1"
    SPOTIFY_AUTH_URL: str = "https://accounts.spotify.com/authorize"
    SPOTIFY_TOKEN_URL: str = "https://accounts.spotify.com/api/token"
    SPOTIFY_SCOPE: str = "user-read-private user-read-email user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private"
    FRONTEND_URL: str = "http://localhost:80"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost"

    MONGO_URL: str
    MONGO_DB: str

    class Config:
        env_file = ".env"

settings = AppSettings()