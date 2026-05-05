from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import database_is_connected, get_db
from ..models import AtlasMessage, User
from ..schemas import AtlasChatRequest, AtlasChatResponse, AtlasStatusResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/atlas", tags=["atlas"])


@router.get("/status", response_model=AtlasStatusResponse)
def atlas_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AtlasStatusResponse:
    atlas_message = db.query(AtlasMessage).order_by(AtlasMessage.id.asc()).first()
    message = atlas_message.message if atlas_message else "Protected Atlas route reached."

    return AtlasStatusResponse(
        message=message,
        atlas_status="online",
        database="connected" if database_is_connected() else "unavailable",
        protected_route="verified",
        authenticated_as=current_user.email,
    )


@router.post("/chat", response_model=AtlasChatResponse)
def atlas_chat(
    payload: AtlasChatRequest,
    current_user: User = Depends(get_current_user),
) -> AtlasChatResponse:
    user_message = payload.message.strip()
    normalized_message = user_message.lower()

    if not user_message:
        reply = "Atlas is online. Send a message to test the protected chat route."
    elif "protected" in normalized_message or "route" in normalized_message or "status" in normalized_message:
        reply = "Protected route verified. Your JWT reached FastAPI, PostgreSQL is connected, and Atlas is online."
    elif "summarize" in normalized_message or "demo" in normalized_message or "proves" in normalized_message:
        reply = "This demo proves login, JWT auth, PostgreSQL, and a protected FastAPI request from the React dashboard."
    elif "hello" in normalized_message or "hi" in normalized_message:
        reply = "Atlas is online. Ask me to check the protected route or summarize what this demo proves."
    else:
        reply = "Received. This school-safe demo chat is authenticated and ready."

    return AtlasChatResponse(
        reply=reply,
        authenticated_as=current_user.email,
        protected_route="verified",
    )
