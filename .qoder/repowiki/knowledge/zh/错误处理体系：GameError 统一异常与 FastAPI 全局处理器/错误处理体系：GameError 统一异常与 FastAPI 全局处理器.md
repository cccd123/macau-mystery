---
kind: error_handling
name: 错误处理体系：GameError 统一异常与 FastAPI 全局处理器
category: error_handling
scope:
    - '**'
source_files:
    - backend/app/game_errors.py
    - backend/app/main.py
    - backend/app/game_service.py
    - backend/app/auth_service.py
    - frontend/src/lib/api.ts
---

## 1. 系统/方法概述
后端采用「自定义业务异常 + FastAPI 全局异常处理器」的统一错误模型。所有业务层抛出的 `GameError` 会被 `main.py` 中的 `@application.exception_handler(GameError)` 捕获，并统一序列化为 `{ error: { code, message, details } }` 的 JSON 响应；FastAPI 内置的 `RequestValidationError` 在 `/api/v1/game` 路径下也被重写到相同结构，保证前后端错误契约一致。

前端通过 `fetch` 发起请求，当 `res.ok` 为假时直接抛出普通 `Error`，由调用方组件自行处理（未定义全局拦截器）。

## 2. 关键文件与包
- `backend/app/game_errors.py` — 定义 `GameError(Exception)` 基类，携带 `status_code`、`code`、`message`、`details` 四个字段
- `backend/app/main.py` — 注册 `GameError` 和 `RequestValidationError` 的全局异常处理器，配置 CORS 中间件
- `backend/app/game_service.py` — 游戏核心服务，集中使用 `GameError` 表达会话不存在、状态冲突、幂等冲突、故事数据损坏等业务错误
- `backend/app/auth_service.py` — 认证服务，使用 FastAPI `HTTPException` 表达 401/403 鉴权失败
- `frontend/src/lib/api.ts` — 前端统一请求封装，仅做 `res.ok` 检查并抛出通用 `Error`

## 3. 架构与约定
- **异常分层**：业务逻辑层（`game_service.py`）抛出 `GameError`；认证/权限校验使用 FastAPI 原生 `HTTPException`；数据库迁移失败等基础设施问题抛出 `RuntimeError`。
- **错误码规范**：`GameError.code` 使用大写下划线字符串（如 `SESSION_NOT_FOUND`、`STORY_NOT_PUBLISHED`、`CHOICE_NOT_AVAILABLE`、`IDEMPOTENCY_CONFLICT`、`STORY_DATA_CORRUPTED`），配合 HTTP 状态码区分客户端错误（4xx）与服务端错误（5xx）。
- **结构化详情**：`details` 字段可携带额外上下文（如 `submitted_scene_id`、`current_scene_id`、`story_version_id`），便于前端或日志定位。
- **验证错误统一化**：`/api/v1/game` 下的 Pydantic 校验失败被重写为与 `GameError` 同构的 `{ error: { code: "VALIDATION_ERROR", message, details: { errors: [...] } } }`。
- **事务内错误传播**：`make_choice` 对 SQLite 使用显式 `BEGIN IMMEDIATE` + 手动 `commit/rollback`，对其他数据库使用 `session.begin()` 上下文管理器，确保异常时回滚。
- **幂等性错误**：通过 `request_id` 重复检测返回 `IDEMPOTENCY_CONFLICT`，记录损坏时返回 `IDEMPOTENCY_RECORD_CORRUPTED`。

## 4. 约定与约束
- 业务层必须通过 `raise GameError(status_code, code, message, details)` 抛出可被全局处理器捕获的错误，禁止直接返回原始异常。
- 认证失败统一使用 `HTTPException(401, detail=...)` 或 `HTTPException(403, detail=...)`，由 FastAPI 默认处理器输出标准格式。
- 前端不解析后端 `error.details` 结构，仅在 `res.ok` 失败时抛出通用 `Error`，具体错误展示由各页面组件自行决定。
- 健康检查 `/api/v1/health` 在数据库不可用时返回 503 并附带 `status: "degraded"`，作为服务降级信号。
- 故事数据校验失败统一归约为 `STORY_DATA_CORRUPTED`（500），并通过 `details.story_version_id` 指向具体版本。
