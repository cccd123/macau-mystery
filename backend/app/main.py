"""FastAPI backend - Macau Mystery Platform"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Macau Mystery API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.game import router as game_router
from app.api.ai import router as ai_router
from app.api.ugc import router as ugc_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.ugc_user import router as ugc_user_router

app.include_router(game_router, prefix="/api/v1/game", tags=["game"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(ugc_router, prefix="/api/v1/create", tags=["create"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(ugc_user_router, prefix="/api/v1/ugc", tags=["ugc"])

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}
