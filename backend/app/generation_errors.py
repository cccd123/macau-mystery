"""Typed failures for the anonymous script-generation API."""
from __future__ import annotations

from typing import Any


class ScriptGenerationError(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class AIServiceNotConfigured(ScriptGenerationError):
    def __init__(self) -> None:
        super().__init__(
            code="AI_SERVICE_NOT_CONFIGURED",
            message="剧本生成服务尚未配置",
            status_code=503,
        )


class AIProviderError(ScriptGenerationError):
    def __init__(self, message: str = "剧本生成服务暂时不可用") -> None:
        super().__init__(code="AI_PROVIDER_ERROR", message=message, status_code=502)


class InvalidAIOutput(ScriptGenerationError):
    def __init__(self, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            code="INVALID_AI_OUTPUT",
            message="模型未返回合法的剧本结构",
            status_code=502,
            details=details,
        )


class GeneratedScriptNotFound(ScriptGenerationError):
    def __init__(self, script_id: str) -> None:
        super().__init__(
            code="GENERATED_SCRIPT_NOT_FOUND",
            message="生成记录不存在或已因服务重启、缓存淘汰而失效",
            status_code=404,
            details={"script_id": script_id},
        )
