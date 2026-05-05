import os

from sqlalchemy.orm import Session

from .models import AtlasMessage, User
from .security import hash_password


DEFAULT_MESSAGE = "Successful authenticated GET request from Atlas backend."


def seed_database(db: Session) -> None:
    demo_email = os.getenv("DEMO_EMAIL", "demo@student.local")
    demo_password = os.getenv("DEMO_PASSWORD", "AtlasSecureDemo-2026-74!")

    existing_user = db.query(User).filter(User.email == demo_email).first()
    if existing_user is None:
        db.add(User(email=demo_email, password_hash=hash_password(demo_password)))
    else:
        existing_user.password_hash = hash_password(demo_password)

    existing_message = db.query(AtlasMessage).first()
    if existing_message is None:
        db.add(AtlasMessage(message=DEFAULT_MESSAGE))

    db.commit()
