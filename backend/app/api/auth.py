"""Authentication API - simple token-based auth"""
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str = ""

class UserResponse(BaseModel):
    id: str
    username: str
    nickname: str
    role: str

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

# --- In-memory user store ---
def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

users_db: dict[str, dict] = {
    "admin": {
        "id": "u001",
        "username": "admin",
        "password": _hash("admin123"),
        "nickname": "Admin",
        "role": "admin",
        "created_at": "2026-07-28",
    },
    "guest": {
        "id": "u002",
        "username": "guest",
        "password": _hash("guest123"),
        "nickname": "Guest Player",
        "role": "user",
        "created_at": "2026-08-01",
    },
}

# Token -> user_id mapping
tokens_db: dict[str, str] = {}

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and validate user from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    user_id = tokens_db.get(token)
    if not user_id or user_id not in users_db:
        raise HTTPException(status_code=401, detail="Invalid token")
    return users_db[user_id]

def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Require admin role."""
    user = get_current_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --- Endpoints ---
@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = users_db.get(req.username)
    if not user or user["password"] != _hash(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = str(uuid.uuid4())
    tokens_db[token] = user["username"]
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            nickname=user["nickname"],
            role=user["role"],
        ),
    )

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    if req.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    user_id = f"u{len(users_db) + 1:03d}"
    users_db[req.username] = {
        "id": user_id,
        "username": req.username,
        "password": _hash(req.password),
        "nickname": req.nickname or req.username,
        "role": "user",
        "created_at": datetime.now().strftime("%Y-%m-%d"),
    }
    token = str(uuid.uuid4())
    tokens_db[token] = req.username
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            username=req.username,
            nickname=req.nickname or req.username,
            role="user",
        ),
    )

@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    return UserResponse(
        id=user["id"],
        username=user["username"],
        nickname=user["nickname"],
        role=user["role"],
    )
