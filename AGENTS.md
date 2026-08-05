# AGENTS.md

本文档记录仓库级项目背景、真实实现状态和协作约定，供后续开发代理快速建立上下文。`README.md` 和 `TASK_BREAKDOWN.md` 中的版本号、完成状态和路线图可能过时；当前实现事实应以源代码、依赖、测试和 `backend-deliverables/` 为准。

## 项目定位

“澳秘 / Macau Mystery”是一个澳门历史城区主题的沉浸式互动剧本平台原型。仓库仍保留 NPC 对话、一句话生成互动短剧、用户投稿和管理后台等早期设想及骨架，但它们不属于当前成员 C 的交付范围。

当前仓库处于 v0.2 原型阶段。成员 C 负责的“沉浸式预制视频分支短剧游戏”后端最小闭环已经实现为可持久化的 SQLite / PostgreSQL 兼容链路；登录、注册与 Bearer 会话已获明确授权并改为持久化实现。2026-08-05 又明确授权增加 S3 兼容媒体上传和固定六景点介绍 API。AI、UGC 与管理后台等旧业务多数仍以进程内存或 mock 为主，整个产品尚非生产级部署。

## 当前冻结范围

当前成员 C 的工作严格收敛为“沉浸式预制视频分支短剧游戏”后端：匿名玩家开始游戏后播放预制视频；视频结束后选择剧本配置的选项；后端记录选择和线索并返回下一个视频节点；分支可汇合并最终到达不同结局。正式内容规划为沿澳门六个景点破解历史悬案，共六章。

本阶段边界：

- 负责版本化剧情 JSON、剧情校验与加载、通用分支状态机、匿名会话持久化、线索、结局、游戏 API、错误契约和自动化测试。
- 首版仅要求同一浏览器通过 `session_id` 恢复进度；不要求登录、跨设备恢复或生产级安全。
- 首版不依赖 GPS；章节坐标仅作未来扩展数据，不参与剧情解锁。
- 视频内旁白、对白、文字和字幕由视频制作人员处理；后端仅保存媒体 URL、海报和元数据。
- 前端负责视频末帧保持、选项覆盖层、候选视频预加载和播放器切换；成员 C 不修改页面视觉或播放器组件。
- 已提供管理员预签名上传与上传完成校验，但不处理六章正式剧本创作、视频制作、视频转码、国际化、社区、密码重置/邮箱验证等扩展账号能力、UGC、真实 LLM/RAG/TTS 或其他成员任务。
- 固定六景点只读简体中文介绍与匿名 API 已实现；前端地图点击、弹框、当前位置和解锁状态仍由前端负责人处理。
- “一句话短剧”延后到沉浸式游戏完成后再评估，可降级为只生成剧本或取消。

当前阶段的权威交付文档位于 `backend-deliverables/`：

- `00-requirements-baseline.md` 1.1：已确认的需求基线。
- `01-database-design.md` 1.0：已确认的数据库设计。
- `02-story-data-contract.md` 1.0：已确认的剧情 JSON 数据契约。
- `03-接口文档.md` 2.1：当前已注册项目接口的统一文档；游戏 v1、景点、媒体上传、认证、AI、UGC 和管理接口均以此为准。
- `04-implementation-progress.md`：仅记录最新进度，完成每个执行批次后必须覆盖更新。
- `05-minimal-backend-implementation-plan.md`：最小后端闭环实施计划与历史范围依据。

## 实际技术栈

- 前端：Next.js 16.2.12、React 19.2.4、TypeScript 5、Tailwind CSS 4、shadcn/Base UI、Leaflet 1.9.4。
- 后端：Python 3.11、FastAPI 0.115、Pydantic 2.9、Uvicorn、SQLAlchemy 2 async、Alembic、boto3。
- 数据库：本地默认 SQLite + `aiosqlite`；已预留 `asyncpg` PostgreSQL 驱动。
- 预留服务：OpenAI Python SDK 对接 SiliconFlow/DeepSeek、ChromaDB、edge-tts。
- 对象存储：本地 MinIO；公网演示使用 Cloudflare R2；后端通过 S3 兼容接口生成预签名 PUT 并校验对象，不代理视频流。
- 容器：根目录 `docker-compose.yml` 启动后端与固定版本 MinIO，并分别挂载 SQLite 与媒体持久卷；`backend/Dockerfile` 使用 Python 3.11 slim。

注意：根 README 仍写着 Next.js 14，这是过时信息。修改前端必须先阅读 `frontend/AGENTS.md`；当前 Next.js 版本可能含训练数据之外的破坏性变化，应再阅读安装包中 `node_modules/next/dist/docs/` 的相关文档。

## 仓库结构与职责

```text
macau-mystery/
├── frontend/                       # Next.js App Router 客户端
│   ├── src/app/                    # 页面与路由
│   ├── src/components/             # 业务组件与 src/components/ui
│   └── src/lib/                    # API 客户端、i18n、工具函数
├── backend/
│   ├── alembic/                    # 游戏持久化初始迁移
│   ├── app/
│   │   ├── api/game.py             # 持久化游戏 API
│   │   ├── game_service.py         # 会话、事务、幂等和快照服务
│   │   ├── db.py / db_models.py    # async 数据库、游戏与认证表
│   │   ├── object_storage.py        # MinIO/R2、预签名上传与对象校验
│   │   ├── location_service.py      # 固定六景点只读目录
│   │   ├── story/                  # 契约、校验、运行时、导入与演示剧情
│   │   ├── ai/、ugc/、knowledge/    # 旧路线保留，非当前范围
│   │   └── main.py                 # FastAPI、CORS、生命周期和错误处理
│   └── tests/                      # 游戏、迁移、剧情运行时和健康检查测试
├── backend-deliverables/            # 当前成员 C 的权威交付文档
├── README.md                        # 快速启动说明，部分信息过时
├── TASK_BREAKDOWN.md                # 团队分工与路线图，不等于当前完成度
└── docker-compose.yml               # 后端、MinIO 与两类持久卷
```

## 主要运行链路

### 前端

- `frontend/src/app/layout.tsx` 挂载全局导航和 `LanguageProvider`；导航栏含语言切换和 `localStorage.user` 登录状态。
- `frontend/src/lib/api-base.ts` 默认指向 `http://localhost:8000/api/v1`，可用 `NEXT_PUBLIC_API_URL` 覆盖。
- `frontend/src/lib/api.ts` 统一封装请求、附加 `localStorage.token` 的 Bearer token，并按 `gameApi` / `aiApi` / `ugcApi` / `adminApi` / `authApi` 分组。
- 当前 `gameApi` 仍是旧扁平响应适配，尚未发送 v1 游戏 API 必需的 `scene_id` 与 `request_id`。此前的前端适配仅用于后端验收，已按范围撤回；应由前端播放器负责人在接入时实现。
- `frontend/next.config.ts` 配置了 `/api/v1/*` 到 8000 端口的 rewrite，但默认 API 客户端使用绝对地址。
- Leaflet 资源依赖 OpenStreetMap 和 cdnjs，离线环境不可用。

### 后端

- `backend/app/main.py` 注册 `/api/v1/game`、`/locations`、`/admin/media`、`/ai`、`/create`、`/admin`、`/auth`、`/ugc` 路由；`/api/v1/health` 返回应用版本、数据库与对象存储状态。
- 游戏 API 使用 `GameService` 和 async SQLAlchemy，不再使用全局 `sessions` 字典。启动游戏时会绑定已发布的不可变剧情版本；后续发布不影响已有会话。
- 已有 `stories`、`story_versions`、`game_sessions`、`game_events`、`session_clues` 五类持久化模型及 Alembic 初始迁移 `20260803_0001`。
- 剧情运行时支持 `video`、`router`、`ending` 三类节点，结构化线索条件、连续 router 解析、线索去重、分支汇合、结局和候选媒体预加载。
- `backend/app/story/scripts/macau_mystery_demo.json` 是可运行的技术演示剧情，含分支、汇合、线索、router 和双结局；它使用占位媒体 URL。旧的 `macau_mystery_01.json` 仅可作迁移参考，不能作为正式运行内容。
- 开发环境启动时可由 `BOOTSTRAP_DEMO_STORY=true` 自动导入/发布演示剧情；生产环境默认关闭。
- 认证使用 `users` 与 `auth_sessions` 持久化用户、Argon2 密码哈希和带有效期的随机 Bearer token；开发环境可幂等创建 demo 管理员和访客。AI、UGC 与管理后台业务数据仍多为内存数据，重启会丢失，不能视为生产安全能力。
- `/api/v1/admin/media/uploads` 生成管理员专用预签名 PUT，`/uploads/complete` 通过 HEAD 校验对象并返回长期公开 URL；预签名 URL 不能写入剧情 JSON。
- `/api/v1/locations` 和 `/api/v1/locations/{location_id}` 匿名返回固定六景点摘要与详情；旧 `/admin/route` 保留兼容。

## 当前实现 API 速查

基础地址默认是 `http://localhost:8000/api/v1`。

| 功能        | 方法与路径                                    | 当前返回重点                                  |
| --------- | ---------------------------------------- | --------------------------------------- |
| 健康检查      | `GET /health`                            | `{ status, database, object_storage, version }` |
| 开始游戏      | `POST /game/start`                       | 201；v1 `GameSnapshot`                   |
| 选择分支      | `POST /game/choice`                      | v1 `GameSnapshot`；请求必须含四个标识字段           |
| 游戏状态      | `GET /game/state/{session_id}`           | 会话绑定版本的 v1 `GameSnapshot`               |
| 景点路线/详情   | `GET /locations`、`GET /locations/{id}`   | 固定六景点摘要、坐标和简中介绍                     |
| 媒体上传      | `POST /admin/media/uploads*`              | 管理员预签名 PUT 与完成校验                       |
| NPC 对话    | `POST /ai/chat`                          | `{ response, audio_url? }`，当前为 mock     |
| TTS       | `GET /ai/tts`                            | `{ audio_url, text }`，当前 `audio_url` 为空 |
| UGC 生成    | `POST /create/generate`                  | 固定模板响应                                  |
| 登录/注册     | `POST /auth/login`、`POST /auth/register` | `{ token, user }`                       |
| 当前用户      | `GET /auth/me`                           | Bearer token 认证                         |
| 管理剧本      | `/admin/scripts`                         | 旧内存实现；写入与发布需要 admin token               |
| UGC 发布/投稿 | `/ugc/*`                                 | 旧链路，尚未端到端打通                             |

### 已实现的游戏 API v1

路径保持不变：

- `POST /game/start`：以 `script_id` 开局，返回 201 和统一快照。
- `POST /game/choice`：请求体必须包含 `session_id`、`scene_id`、`choice_id`、`request_id`。
- `GET /game/state/{session_id}`：按会话绑定的剧情版本恢复当前快照。

统一快照包含 `story`、`scene`、`media`、`choices`、`clues`、`progress`；结局额外包含 `ending`。后端只返回 `video` 或 `ending`，绝不暴露内部 `router`。每个选项含按“模拟发放线索后解析 router”计算的 `preload` 媒体信息。

`request_id` 的幂等重放检查优先于会话完成、旧场景和选项可用性判断；合法重试返回首次保存的响应快照。游戏业务错误和游戏请求校验错误统一为：

```json
{"error":{"code":"...","message":"...","details":{}}}
```

## 当前实现边界与已知断点

与成员 C 游戏闭环相关：

- 后端闭环、对象存储接口和景点接口已完成并有自动化测试；但目前只有技术演示剧情，未制作正式六章内容、真实视频或将占位 URL 替换为 R2 URL。
- 本地 MinIO 已配置在 Compose 中；评委公网演示仍需创建 R2 公共桶、配置 CORS/环境变量并上传真实媒体。SQLite 部署必须绑定持久化卷。
- 当前前端游戏页仍是旧叙事文本页面，`frontend/src/lib/api.ts` 未适配 v1 的 `scene_id`、`request_id`、媒体和预加载字段。播放器接入应由前端负责人负责，不得将页面视觉工作扩展到成员 C 范围。
- 现有导航和首页“开始游戏”仍指向 `/game/demo`，而实际页面是 `/game/[sessionId]`，因此可导致 404。

其他旧路线已知问题（不属于当前成员 C 范围）：

- `/ai`、`/create` 路由仍使用 mock；RAG 未接入聊天链路。
- UGC 的“生成 → 发布 → 投稿”未端到端打通；剧本编辑器和部分管理按钮只是 UI 演示，未持久化。
- 登录页未复用 `API_BASE`；登录/注册错误未细分展示，401 未统一处理。
- 首页路线预览、部分 i18n 和地图资源仍有原型级限制。
- 已有后端自动化测试，但尚未配置 CI。前端全仓 `npm run lint` 当前有既有错误；`npm run build` 在本机无 Google Fonts 网络访问时会因 Geist 字体下载失败。

## 本地开发

### 后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Swagger：`http://localhost:8000/docs`。

关键环境变量位于 `backend/.env.example`：

- `DATABASE_URL`：默认 `sqlite+aiosqlite:///./macau_mystery.db`；部署 SQLite 时必须指向持久化卷。
- `CORS_ORIGINS`：逗号分隔的前端来源。
- `APP_ENV`：`development` 或 `production`。
- `BOOTSTRAP_DEMO_STORY`：开发环境默认开启，生产环境默认关闭。
- `BOOTSTRAP_DEMO_USERS`：开发环境默认开启，生产环境默认关闭；只创建缺失的 demo 用户，不覆盖已有用户。
- `AUTH_TOKEN_TTL_HOURS`：随机 Bearer token 的有效期，默认 168 小时；`DEMO_*` 变量用于开发演示账号名和密码。
- `OBJECT_STORAGE_ENABLED`、`S3_*`、`MEDIA_PUBLIC_BASE_URL`、`MEDIA_*`：MinIO/R2 endpoint、凭据、公开 URL、上传有效期/大小限制与媒体 CORS。
- `SILICONFLOW_API_KEY`、`SILICONFLOW_BASE_URL`、`LLM_MODEL`、`EMBEDDING_MODEL`、`ADMIN_TOKEN`：旧预留能力的配置。

剧情工具：

```powershell
cd backend
python -m app.story.cli validate app/story/scripts/macau_mystery_demo.json
python -m app.story.cli import app/story/scripts/macau_mystery_demo.json --publish
```

不要提交真实 `.env`、API key、数据库文件、Chroma 数据或生成的音频。

### 前端

```powershell
cd frontend
node -v   # 需要 >= 20.9，建议 22 LTS
npm ci
npm run dev
```

访问 `http://localhost:3000`。后端须同时运行在 8000 端口，除非通过 `NEXT_PUBLIC_API_URL` 指向其他环境。

### Docker

```powershell
docker compose up --build
```

Docker Compose 会启动 MinIO，幂等初始化公开读媒体桶，再执行 `alembic upgrade head` 和 Uvicorn。SQLite 与媒体分别挂载到 `backend_sqlite_data`、`minio_data`。前端仍需单独运行。不要在需要保留数据时执行 `docker compose down -v`。

## 验证建议

按改动范围执行相关检查：

```powershell
# 后端语法与自动化测试
python -m compileall backend/app backend/tests
docker compose run --rm backend pytest -q

# 前端类型、静态检查与生产构建
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

游戏后端变更还应验证：

1. `/api/v1/health` 的 `database` 为 `ok`。
2. `start → choice → state` 使用真实 `scene_id`、`choice_id`、`request_id` 成功推进。
3. `/openapi.json` 中 `ChoiceRequest` 必填四个请求标识字段。
4. 容器停止并重启后，已有 `session_id` 仍能恢复进度。

当前最新隔离环境后端测试为 `28 passed`；Compose 配置解析通过。本机 Docker daemon 未运行，真实 MinIO PUT、公开 GET 和 Range 206 仍需在启动 Docker 后冒烟。

## 开发约定

- 先查实际代码和锁定依赖，再参考规划文档；修改实现后同步维护相关文档。
- 完成一个执行批次后，覆盖更新 `backend-deliverables/04-implementation-progress.md`，只保留最新状态。
- 保持前后端契约一致：后端 JSON 使用 snake_case，前端仅在 API 层做适配，不把适配散落到页面。
- 新持久化逻辑必须使用既有数据库模型与事务，不要为游戏状态增加新的全局内存数据源。
- 剧情 JSON 以 `chapters -> scenes -> choices` 为核心；choice 跳转使用 `next_scene`，线索通过 `grant_clues` 数组发放。`clue_reward` 是旧字段，不得继续扩展。契约以 `backend-deliverables/02-story-data-contract.md` 1.0 为准。
- 用户可见文案应通过 `useTranslation()` 获取；新增翻译键须同时补齐三种 locale。
- 前端优先复用 `src/components/ui` 和现有布局习惯；含浏览器 API、Leaflet、local/session storage 的组件必须是 Client Component。
- 不要在客户端暴露服务端密钥；`NEXT_PUBLIC_*` 只能存放允许公开的配置。
- 保留用户已有改动，避免顺手重构无关文件；仓库可能有未提交工作。
- 提交信息沿用 `feat:`、`fix:`、`docs:`、`refactor:`、`test:` 等前缀。

## 后续工作顺序

成员 C 的最小后端闭环已完成。后续仅在明确授权下按以下顺序推进：

1. 由前端负责人把播放器、末帧保持、选项覆盖层、候选媒体预加载与 v1 API 适配接入页面；该工作不属于成员 C 的页面/视觉职责。
2. 由剧本和视频成员通过管理员上传接口把视频/海报上传到 MinIO 或 R2，再把完成响应中的长期公开 URL 写入正式六章 JSON。
3. 部署时创建 R2 公共桶并配置媒体 CORS、后端 S3 环境变量、持久化数据库卷（或 PostgreSQL）和正式前端 CORS，并关闭演示剧情自动导入。
4. 在需要持续交付时补 CI，至少运行后端测试与前端可用检查；前端既有 lint/字体构建问题由相应负责人解决。

不得在该闭环中顺手实现六章内容、播放器、GPS、密码重置/邮箱验证等扩展账号能力、UGC、AI、国际化或其他旧路线图事项。
