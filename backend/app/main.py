import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import SessionLocal, database_is_connected, initialize_database
from .routes.atlas_routes import router as atlas_router
from .routes.auth_routes import router as auth_router
from .schemas import HealthResponse
from .seed import seed_database

load_dotenv()

app = FastAPI(
    title="Atlas Secure Dashboard API",
    description="A school-safe Atlas demo API with JWT authentication and a protected GET route.",
    version="1.0.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    initialize_database()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app="Atlas Secure Dashboard",
        database="connected" if database_is_connected() else "unavailable",
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "app": "Atlas Secure Dashboard API",
        "health": "/api/health",
        "protected_route": "/api/atlas/status",
    }


app.include_router(auth_router)
app.include_router(atlas_router)
