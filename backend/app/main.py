"""FastAPI backend - Macau Mystery Platform."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.db import check_database
from app.game_errors import GameError
from app.generation_errors import ScriptGenerationError
from app.object_storage import object_storage_health


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(_application: FastAPI):
        if settings.bootstrap_demo_story or settings.bootstrap_demo_users:
            try:
                if settings.bootstrap_demo_story:
                    from app.story.importer import bootstrap_demo_story

                    await bootstrap_demo_story()
                if settings.bootstrap_demo_users:
                    from app.auth_service import bootstrap_demo_users

                    await bootstrap_demo_users()
            except SQLAlchemyError as exc:
                raise RuntimeError("数据库尚未迁移；请先执行 alembic upgrade head") from exc
        yield

    application = FastAPI(title="Macau Mystery API", version="0.2.0", lifespan=lifespan)

    @application.exception_handler(GameError)
    async def game_error_handler(_request: Request, exc: GameError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": jsonable_encoder(exc.details),
                }
            },
        )

    @application.exception_handler(RequestValidationError)
    async def request_validation_handler(request: Request, exc: RequestValidationError):
        if not request.url.path.startswith("/api/v1/game"):
            return await request_validation_exception_handler(request, exc)
        details = {
            "errors": [
                {
                    "path": ".".join(str(part) for part in error["loc"]),
                    "message": error["msg"],
                    "type": error["type"],
                }
                for error in exc.errors()
            ]
        }
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "请求字段、类型或格式不合法",
                    "details": details,
                }
            },
        )

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
    from app.api.locations import router as locations_router
    from app.api.media import router as media_router
    from app.api.ugc_user import router as ugc_user_router

    application.include_router(game_router, prefix="/api/v1/game", tags=["game"])
    application.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
    application.include_router(ugc_router, prefix="/api/v1/create", tags=["create"])
    application.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
    application.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    application.include_router(ugc_user_router, prefix="/api/v1/ugc", tags=["ugc"])
    application.include_router(locations_router, prefix="/api/v1/locations", tags=["locations"])
    application.include_router(media_router, prefix="/api/v1/admin/media", tags=["admin-media"])

    @application.get("/api/v1/health")
    async def health():
        database_status = "ok" if await check_database() else "unavailable"
        storage_status = await object_storage_health()
        payload = {
            "status": "ok",
            "database": database_status,
            "object_storage": storage_status,
            "version": application.version,
        }
        if database_status == "ok" and storage_status in {"ok", "disabled"}:
            return payload
        payload["status"] = "degraded"
        return JSONResponse(
            status_code=503,
            content=payload,
        )

    @application.exception_handler(ScriptGenerationError)
    async def script_generation_error_handler(
        _request: Request, exc: ScriptGenerationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": jsonable_encoder(exc.details),
                }
            },
        )

    return application


app = create_app()
