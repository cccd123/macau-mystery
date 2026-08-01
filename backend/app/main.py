from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from app.api.game import router as game_router
from app.api.ai import router as ai_router
from app.api.ugc import router as ugc_router
from app.api.admin import router as admin_router

app = FastAPI(
    title="澳秘 Macau Mystery API",
    description="AI沉浸式剧本杀后端服务",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_router, prefix="/api/v1/game", tags=["game"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(ugc_router, prefix="/api/v1/create", tags=["ugc"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "macau-mystery-api"}
