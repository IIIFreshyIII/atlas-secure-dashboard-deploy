from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class HealthResponse(BaseModel):
    status: str
    app: str
    database: str


class AtlasStatusResponse(BaseModel):
    message: str
    atlas_status: str
    database: str
    protected_route: str
    authenticated_as: str


class AtlasChatRequest(BaseModel):
    message: str


class AtlasChatResponse(BaseModel):
    reply: str
    authenticated_as: str
    protected_route: str
