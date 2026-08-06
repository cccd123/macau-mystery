---
kind: build_system
name: 构建与部署系统：Docker + FastAPI/Next.js 双端容器化编排
category: build_system
scope:
    - '**'
source_files:
    - docker-compose.yml
    - backend/Dockerfile
    - frontend/package.json
    - backend/requirements.txt
    - backend/alembic.ini
    - backend/pytest.ini
    - frontend/next.config.ts
    - backend/.dockerignore
---

本项目采用基于 Docker Compose 的双端容器化构建与部署方案，后端使用 Python (FastAPI) + Alembic 迁移，前端使用 Next.js，通过 /api/v1 路径前缀统一 API 契约。

## 构建系统与工具链

**后端构建**：
- 语言环境：Python 3.11-slim 基础镜像
- 依赖管理：requirements.txt 固定版本（fastapi、uvicorn、sqlalchemy、alembic、openai、chromadb、edge-tts、pydantic 等）
- Web 服务器：uvicorn 作为 ASGI 服务器
- 数据库迁移：Alembic，配置文件 alembic.ini，默认 SQLite 驱动 aiosqlite
- 测试框架：pytest + pytest-asyncio，异步模式自动启用

**前端构建**：
- 框架：Next.js 16.2.12 + React 19
- 包管理：npm（package-lock.json）
- 脚本命令：dev/build/start/lint
- 样式：Tailwind CSS v4 + shadcn/ui
- ESLint 代码检查

## 容器化架构

docker-compose.yml 编排单一 backend 服务：
- 端口映射：8000:8000
- 环境变量：DATABASE_URL（SQLite）、APP_ENV=development
- 数据持久化：backend_sqlite_data 卷挂载到 /app/data
- 开发模式：源码热重载（--reload），启动时自动执行 alembic upgrade head
- 命令：uvicorn app.main:app --host 0.0.0.0 --port 8000

backend/Dockerfile：
- 基础镜像：python:3.11-slim
- 工作目录：/app
- 依赖安装：pip install -r requirements.txt（无缓存）
- 暴露端口：8000

.dockerignore 排除 .venv、__pycache__、.pytest_cache、*.db

## 开发工作流

本地开发通过 docker-compose 启动后端服务，前端通过 next dev 运行，next.config.ts 配置了 /api/v1/* 代理到 localhost:8000，实现前后端分离开发。

数据库迁移通过 alembic 管理，迁移脚本位于 backend/alembic/versions/，按时间戳命名（如 20260803_0001_game_persistence.py）。

## 测试体系

后端测试位于 backend/tests/，包含认证、游戏 API、健康检查、迁移、故事导入与运行时测试。pytest.ini 配置了异步模式和测试路径。

## 约束与约定

- 所有 API 统一以 /api/v1 为前缀
- 后端环境变量通过 .env 文件注入（.env.example 提供模板）
- 前端通过 next.config.ts 的 rewrites 将 API 请求代理到后端
- 数据库连接字符串使用 sqlite+aiosqlite 协议
- 项目未包含 CI/CD 流水线配置（无 GitHub Actions、Jenkins 等）
- 未使用 Makefile 或 shell 脚本进行构建编排