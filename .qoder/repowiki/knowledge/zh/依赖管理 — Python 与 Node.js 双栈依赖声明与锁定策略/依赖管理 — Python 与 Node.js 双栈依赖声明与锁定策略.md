---
kind: dependency_management
name: 依赖管理 — Python 与 Node.js 双栈依赖声明与锁定策略
category: dependency_management
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - backend/Dockerfile
    - frontend/package.json
    - frontend/package-lock.json
    - docker-compose.yml
---

本仓库采用前后端分离的双栈架构，依赖管理分别由 Python 的 `pip`/`requirements.txt` 和 Node.js 的 `npm`/`package.json` + `package-lock.json` 承担，并通过 Docker 构建过程固化依赖版本。

**1. 后端（Python/FastAPI）依赖管理**
- 依赖声明：`backend/requirements.txt` 使用精确版本号（如 `fastapi==0.115.0`、`uvicorn[standard]==0.30.6`、`sqlalchemy==2.0.35`、`openai==1.51.0`、`chromadb==0.5.11`、`pydantic==2.9.2` 等），未使用 `~=` 或 `>=` 等范围约束，确保可重现构建。
- 构建固化：`backend/Dockerfile` 通过 `COPY requirements.txt . && RUN pip install --no-cache-dir -r requirements.txt` 在镜像中安装依赖，避免宿主机环境差异。
- 数据库迁移：使用 `alembic==1.13.3` 管理 SQLAlchemy 模型变更，迁移文件位于 `backend/alembic/versions/`。
- 测试依赖：`pytest==8.3.3`、`pytest-asyncio==0.24.0` 作为开发期依赖一同声明。
- 无虚拟环境锁定文件：未发现 `requirements.lock` 或 `Pipfile.lock`，版本锁定完全依赖 `requirements.txt` 中的精确版本。

**2. 前端（Next.js）依赖管理**
- 依赖声明：`frontend/package.json` 使用语义化版本约束（如 `next: "16.2.12"`、`react: "19.2.4"`、`tailwindcss: "^4"`），区分 `dependencies` 与 `devDependencies`。
- 锁定文件：`frontend/package-lock.json`（lockfileVersion 3）完整记录依赖树及每个包的精确版本、SHA 校验和，确保团队与 CI 构建一致。
- 包管理器：使用 npm（基于 lock 文件存在判断），未使用 yarn 或 pnpm。
- 构建脚本：`scripts` 字段定义 `dev`、`build`、`start`、`lint` 命令，依赖通过 `next build` 阶段解析。

**3. 容器化与编排**
- `docker-compose.yml` 编排后端服务，通过 `env_file` 注入 `.env`，`volumes` 挂载源码与 SQLite 数据目录，`command` 自动执行 `alembic upgrade head` 后再启动 uvicorn。
- 前端未单独容器化，通过 Next.js 本地开发或 `next build` 产物部署。

**4. 约定与约束**
- 后端所有第三方库必须通过 `requirements.txt` 声明，禁止在代码中动态 `import` 未声明的包。
- 前端依赖更新需同步提交 `package-lock.json`，保证锁文件与声明文件一致。
- 生产构建依赖 Docker 镜像内的 `requirements.txt` 安装结果，不依赖宿主 Python 环境。
- 未发现私有 PyPI/NPM 源配置，所有包从官方源（pypi.org、registry.npmjs.org）拉取。