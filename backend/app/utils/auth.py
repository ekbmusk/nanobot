import hashlib
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.admin_user import AdminUser


ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 12
security = HTTPBearer(auto_error=False)


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY", "")
    if not secret:
        raise HTTPException(status_code=500, detail="JWT_SECRET_KEY орнатылмаған")
    return secret


def hash_password(raw_password: str) -> str:
    pepper = os.getenv("JWT_SECRET_KEY", "physics-bot-default-pepper")
    return hashlib.sha256(f"{raw_password}:{pepper}".encode("utf-8")).hexdigest()


def verify_password(raw_password: str, password_hash: str) -> bool:
    return hash_password(raw_password) == password_hash


def create_access_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _jwt_secret(), algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен мерзімі аяқталған")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Жарамсыз токен")


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="Авторизация қажет")

    payload = decode_token(credentials.credentials)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Токенде қолданушы жоқ")

    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=403, detail="Әкімші қолжетімсіз")

    return admin
