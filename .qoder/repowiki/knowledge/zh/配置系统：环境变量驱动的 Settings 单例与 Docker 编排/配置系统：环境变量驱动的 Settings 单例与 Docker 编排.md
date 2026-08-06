---
kind: configuration_system
name: 配置系统：环境变量驱动的 Settings 单例与 Docker 编排
category: configuration_system
scope:
    - '**'
source_files:
    - backend/app/config.py
    - backend/.env.example
    - backend/.env
    - frontend/.env.example
    - frontend/.env.local
    - frontend/src/lib/api-base.ts
    - docker-compose.yml
    - backend/alembic.ini
    - backend/alembic/env.py
---

本项目的配置系统以「环境变量 + Python dataclass」为核心，后端通过 `app/config.py` 中的 `Settings` 数据类集中管理所有运行时参数，前端通过 Next.js 的 `NEXT_PUBLIC_*` 环境变量暴露 API 地址。配置来源按优先级加载：Docker Compose 的 `environment`/`env_file` → `.env` 文件 → 代码默认值。

**后端配置（FastAPI）**
- `backend/app/config.py` 定义 `@dataclass(frozen=True)` 的 `Settings`，包含数据库 URL、CORS 源、运行环境、演示数据开关、JWT TTL、演示账号等字段，并提供 `is_production` 属性判断生产环境。
- `get_settings()` 使用 `@lru_cache` 缓存实例，从 `os.getenv` 读取环境变量，配合 `_as_bool`、`_cors_origins`、`_positive_int` 三个解析器完成类型转换与校验（如正整数校验失败抛出带字段名的 ValueError）。
- 默认值集中在模块顶部常量（如 `DEFAULT_SQLITE_URL`、`DEFAULT_CORS_ORIGINS`），确保无 `.env` 时仍可本地开发。
- Alembic 迁移通过 `alembic/env.py` 调用 `get_settings().database_url` 覆盖 `alembic.ini` 中的 `sqlalchemy.url`，使迁移与运行时共享同一数据库连接。

**环境变量清单**
- `APP_ENV`：运行环境（development/production），控制演示数据自动注入行为。
- `DATABASE_URL`：SQLAlchemy 异步数据库 URL，默认 SQLite。
- `CORS_ORIGINS`：逗号分隔的允许源列表。
- `BOOTSTRAP_DEMO_STORY` / `BOOTSTRAP_DEMO_USERS`：布尔开关，非 production 默认开启。
- `AUTH_TOKEN_TTL_HOURS`：JWT 有效期（小时），必须为正整数。
- `DEMO_ADMIN_USERNAME/PASSWORD`、`DEMO_GUEST_USERNAME/PASSWORD`：演示账号。
- `SILICONFLOW_API_KEY`、`SILICONFLOW_BASE_URL`、`LLM_MODEL`、`EMBEDDING_MODEL`：AI 服务配置。
- `ADMIN_TOKEN`：管理员令牌。

**前端配置（Next.js）**
- `frontend/.env.example` 和 `.env.local` 仅暴露 `NEXT_PUBLIC_API_URL`，指向后端 `/api/v1` 基址。
- `src/lib/api-base.ts` 通过 `process.env.NEXT_PUBLIC_API_URL` 读取并作为默认值 fallback。

**容器化配置**
- `docker-compose.yml` 通过 `env_file` 引入 `./backend/.env`（可选），并在 `environment` 中覆盖 `DATABASE_URL`（持久化到 volume）和 `APP_ENV`。
- `backend/.env` 为本地开发提供占位值，`backend/.env.example` 为完整模板。
- `backend/alembic.ini` 硬编码 SQLite 路径，但被 `env.py` 动态覆盖。

**约定与约束**
- 所有后端配置必须通过 `get_settings()` 获取，禁止直接 `os.getenv` 散落各处。
- 布尔型环境变量支持 `1/true/yes/on` 四种写法；整数字段强制正数校验。
- 生产环境（`APP_ENV=production`）默认关闭演示数据注入。
- 前端仅暴露 `NEXT_PUBLIC_*` 变量，敏感信息不得放入前端构建产物。