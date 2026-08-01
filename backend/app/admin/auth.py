"""Admin authentication"""
import os
from fastapi import Header, HTTPException
from typing import Optional

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "admin-secret-token")

def verify_token(authorization: Optional[str] = Header(None)):
    if os.getenv("ENV", "development") == "development":
        return True
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")
    return True
