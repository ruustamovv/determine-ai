"""Authentication helpers."""

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from datetime import datetime, timedelta
from typing import Optional

import hashlib, secrets
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

SECRET_KEY = os.environ.get("SECRET_KEY", "determine-ai-secret-key-change-me")
ALGORITHM = "HS256"
TOKEN_EXPIRE = 1440

security = HTTPBearer()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, h = stored.split(":")
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex() == h


def create_token(data: dict, expires_days: int = 7) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(days=expires_days)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    from backend.database import User
    user = await User.find_by_username(payload.get("sub", ""))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") not in ("admin", "owner"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
