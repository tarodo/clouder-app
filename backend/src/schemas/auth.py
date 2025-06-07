from pydantic import BaseModel


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    scope: str
    expires_in: int
    refresh_token: str | None = None 