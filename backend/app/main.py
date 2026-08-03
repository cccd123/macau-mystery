"""FastAPI backend - Macau Mystery Platform."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.db import check_database


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(_application: FastAPI):
        if settings.bootstrap_demo_story:
            from app.story.importer import bootstrap_demo_story

            try:
                await bootstrap_demo_story()
            except SQLAlchemyError as exc:
                raise RuntimeError("数据库尚未迁移；请先执行 alembic upgrade head") from exc
        yield

    application = FastAPI(title="Macau Mystery API", version="0.2.0", lifespan=lifespan)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
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

    application.include_router(game_router, prefix="/api/v1/game", tags=["game"])
    application.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
    application.include_router(ugc_router, prefix="/api/v1/create", tags=["create"])
    application.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
    application.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    application.include_router(ugc_user_router, prefix="/api/v1/ugc", tags=["ugc"])

    @application.get("/api/v1/health")
    async def health():
        if await check_database():
            return {"status": "ok", "database": "ok", "version": application.version}
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "unavailable", "version": application.version},
        )

    return application


app = create_app()
