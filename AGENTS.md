# AGENTS.md

本文档记录仓库级项目背景、真实实现状态和协作约定，供后续开发代理快速建立上下文。除非代码已同步更新，否则不要把 `README.md` 或 `TASK_BREAKDOWN.md` 中的版本号、完成状态和迭代计划当作当前实现事实；应以依赖清单和源代码为准。

## 项目定位

“澳秘 / Macau Mystery”是一个澳门历史城区主题的沉浸式互动剧本平台原型。仓库中仍保留 NPC 对话、一句话生成互动短剧、用户投稿和管理后台等早期设想及骨架，但它们不是当前成员 C 的交付范围。

当前仓库处于 v0.2 原型阶段。页面和 API 骨架较完整，但多数业务数据存放在进程内存中，游戏推进与 AI 能力仍以 mock 为主，尚不是可持久化或可生产部署的完整产品。

## 当前冻结范围

当前成员 C 的工作已严格收敛为“沉浸式预制视频分支短剧游戏”后端：匿名玩家开始游戏后播放预制视频，视频结束时选择剧本配置的选项，后端记录选择和线索并返回下一个视频节点，允许分支汇合并最终到达不同结局。正式内容规划为沿澳门六个景点破解历史悬案，共六章。

本阶段边界：

- 负责版本化剧情 JSON、剧情校验与加载、通用分支状态机、匿名会话持久化、线索、结局、游戏 API、错误契约和自动化测试。
- 首版只要求同一浏览器通过 `session_id` 恢复进度，不要求登录、跨设备恢复或生产级安全。
- 首版不依赖 GPS；章节坐标只作为未来扩展数据，不参与剧情解锁。
- 视频内旁白、对白、文字和字幕由视频制作人员处理；后端只保存媒体 URL、海报和元数据。
- 前端负责视频末帧保持、选项覆盖层、候选视频预加载和播放器切换；成员 C 不修改页面视觉或播放器组件。
- 不处理六章正式剧本创作、视频制作、视频上传转码、国际化、社区、账号、UGC、真实 LLM/RAG/TTS 或其他成员任务。
- “一句话短剧”延后到沉浸式游戏完成后再评估，可以降级为只生成剧本或取消。

当前阶段的权威交付文档位于 `backend-deliverables/`：

- `00-requirements-baseline.md` 1.0：已确认并冻结的需求基线。
- `01-database-design.md` 1.0：已确认的数据库设计。
- `02-story-data-contract.md` 1.0：已确认的剧情 JSON 数据契约。
- `03-game-api-contract.md` 1.0：已确认的游戏 API 契约。

这些文档描述目标实现；在业务代码同步完成前，判断“当前已经能运行什么”仍应以源代码和测试为准。

## 实际技术栈

- 前端：Next.js 16.2.12、React 19.2.4、TypeScript 5、Tailwind CSS 4、shadcn/Base UI、Leaflet 1.9.4。
- 后端：Python 3.11、FastAPI 0.115、Pydantic 2.9、Uvicorn。
- 预留服务：OpenAI Python SDK 对接 SiliconFlow/DeepSeek、ChromaDB、edge-tts、SQLite/SQLAlchemy。
- 容器：根目录 `docker-compose.yml` 目前只启动后端；`backend/Dockerfile` 使用 Python 3.11 slim。

注意：根 README 仍写着 Next.js 14，这是过时信息。修改前端时还必须遵守 `frontend/AGENTS.md`：当前 Next.js 版本可能存在训练数据之外的破坏性变化，应先阅读安装包内 `node_modules/next/dist/docs/` 的相关文档。

## 仓库结构与职责

```text
macau-mystery/
├── frontend/                       # Next.js App Router 客户端
│   ├── src/app/                    # 页面与路由
│   │   ├── page.tsx                # 首页、后端路线预览
│   │   ├── login/                  # 登录/注册（Tabs 切换）
│   │   ├── game/                   # game/[sessionId] 游戏推进、map 地图、clues 线索
│   │   ├── create/                 # UGC 生成与结果页
│   │   └── admin/                  # 管理后台：剧本列表、scripts/[id] 编辑、new、ai-create
│   ├── src/components/             # 业务组件（navbar、dialogue-box、choice-panel、map-viewer 等）与 src/components/ui
│   └── src/lib/                    # API 客户端、i18n、工具函数
├── backend/
│   ├── app/main.py                 # FastAPI 入口、CORS、路由注册
│   ├── app/models.py               # 主要 Pydantic 请求/响应模型
│   ├── app/api/                    # 对外 HTTP API
│   ├── app/story/                  # 剧本加载、会话状态、线索和结局逻辑
│   ├── app/ai/                     # LLM、NPC prompt、RAG mock、TTS 实现
│   ├── app/ugc/                    # 真正的 LLM 生成器和提示词模板（未接到公开 API）
│   ├── app/knowledge/              # 澳门资料、ChromaDB 客户端和导入脚本
│   └── app/admin/                  # 旧的管理 token helper，目前路由未使用
├── backend-deliverables/            # 当前成员 C 已确认的需求、数据库、剧情和 API 契约
├── README.md                       # 快速启动说明，部分版本信息已过时
├── TASK_BREAKDOWN.md               # 团队分工与路线图，不等于当前完成度
└── docker-compose.yml              # 仅后端开发服务
```

## 主要运行链路

### 前端

- `frontend/src/app/layout.tsx` 挂载全局导航和 `LanguageProvider`；导航栏含语言切换和登录状态（localStorage.user），admin 菜单仅对 admin 角色显示。
- `frontend/src/lib/api-base.ts` 默认将 API 指向 `http://localhost:8000/api/v1`；可用 `NEXT_PUBLIC_API_URL` 覆盖。
- `frontend/src/lib/api.ts` 统一封装请求，从 `localStorage.token` 添加 Bearer token，并适配部分后端 snake_case 字段；按功能拆为 `gameApi` / `aiApi` / `ugcApi` / `adminApi` / `authApi` 五个模块。
- `frontend/next.config.ts` 还配置了 `/api/v1/*` 到 8000 端口的 rewrite，但当前 API 客户端的默认绝对地址不会使用该 rewrite。
- 登录信息保存在浏览器 `localStorage`（`token`、`user`）；生成结果暂存在 `sessionStorage.generatedScript`。
- i18n 实现位于 `src/lib/i18n/context.tsx` + `translations.ts`：支持 `en`、`zh-CN`、`zh-TW` 三种 locale，用 Context + localStorage 持久化，无第三方 i18n 库；但只有部分页面（首页、导航等）已完整使用翻译键，create/login/admin 等页面仍存在硬编码中英文。
- Leaflet 地图在浏览器端动态加载，底图来自 OpenStreetMap，默认 marker 图片来自 cdnjs；离线环境下相关资源不可用。

### 后端

- `backend/app/main.py` 注册 `/api/v1/game`、`/ai`、`/create`、`/admin`、`/auth`、`/ugc` 六组路由，并提供 `/api/v1/health`。
- 游戏入口 `app/api/game.py` 自己维护全局 `sessions` 字典，目前没有调用 `app/story/engine.py` 的 `StoryEngine`。
- 示例剧本为 `app/story/scripts/macau_mystery_01.json`，目前只有妈阁庙序幕一章；JSON 中虽包含 `next_scene`、照片触发器和 endings，公开游戏 API 尚未按这些字段通用推进。
- `app/api/auth.py` 使用内存用户表、SHA-256 密码摘要和内存 token 表，`/auth/login|register|me` 的密码校验链路已完整可用（内置 admin/admin123、guest/guest123）；重启即丢失注册用户和 token，不具备生产安全性。
- 管理剧本、用户剧本和投稿也分别保存在模块级字典中，重启即丢失。
- 管理 API 的读取类端点有部分无需认证；写入、投稿审核等端点要求内存 token 中的 admin 角色。

## 当前实现 API 速查

基础地址默认是 `http://localhost:8000/api/v1`。

| 功能        | 方法与路径                                    | 当前返回重点                                                                        |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| 健康检查      | `GET /health`                            | `{ status, version }`                                                         |
| 开始游戏      | `POST /game/start`                       | `{ session_id, chapter, location, narration, dialogue, choices }`             |
| 选择分支      | `POST /game/choice`                      | `{ scene_id, chapter, location, narration, dialogue, choices, clue_reward? }` |
| 游戏状态      | `GET /game/state/{session_id}`           | 当前章节、场景、线索和选择                                                                 |
| NPC 对话    | `POST /ai/chat`                          | `{ response, audio_url? }`，当前为固定 mock                                         |
| TTS       | `GET /ai/tts`                            | `{ audio_url, text }`，当前 `audio_url` 为空                                       |
| UGC 生成    | `POST /create/generate`                  | `{ script_id, title, chapters, style, era }`，当前为固定模板                          |
| 登录/注册     | `POST /auth/login`、`POST /auth/register` | `{ token, user }`                                                             |
| 当前用户      | `GET /auth/me`                           | Bearer token 认证                                                               |
| 管理剧本      | `/admin/scripts`                         | 列表公开，增删改和发布需 admin token                                                      |
| 管理统计/路线   | `GET /admin/stats`、`GET /admin/route`    | 内存 mock 数据                                                                    |
| UGC 发布/投稿 | `/ugc/*`                                 | 需要登录，但当前生成结果没有写入用户剧本库                                                         |

新增或修改接口时保持 JSON 字段为 snake_case，并同步更新 `frontend/src/lib/api.ts` 的类型和适配逻辑。

### 已确认的目标游戏 API

路径继续保留，但实现需要升级到 `backend-deliverables/03-game-api-contract.md` 1.0：

- `POST /game/start`
- `POST /game/choice`
- `GET /game/state/{session_id}`

目标响应统一包含 `story`、`scene`、`media`、`choices`、`clues` 和 `progress`。后端只向前端返回 `video` 或 `ending`；内部 `router` 永不暴露。每个选项包含后端按“模拟发放线索后解析 router”计算的 `preload` 媒体信息。

提交选择必须携带 `session_id`、`scene_id`、`choice_id` 和 `request_id`。幂等重放检查优先于会话完成、旧场景和选项可用性判断；合法重试必须返回第一次保存的响应快照。业务错误统一使用 `{ "error": { "code", "message", "details" } }`，请求校验错误也适配为这一外层结构。

## 当前实现边界与已知断点

- `app/api/game.py` 的 `/choice` 无论 JSON 中的 `next_scene` 是什么，基本都返回同一个硬编码后续场景；只有选择 `c2` 会发放固定线索。
- `app/story/state.py` 只是按数组顺序推进，也未使用 choice 的 `next_scene`；章节切换、照片触发和结局计算尚未串联。
- `app/ai/llm_client.py`、`app/ugc/drama_generator.py` 和 `app/ai/tts_service.py` 有真实调用实现，但 `/ai` 和 `/create` 路由仍使用 mock，RAG 也未接入聊天链路。
- ChromaDB 导入脚本可独立运行，但集合尚未用于 `rag_engine.py` 的查询。
- `/create/generate` 不会把结果写入 `ugc_user.user_scripts_db`，所以“生成 → 发布 → 投稿”并未端到端打通。
- `/create/regenerate/{script_id}` 只返回状态对象，而结果页会把它当完整剧本使用，重新生成后页面数据形状可能失效。
- 剧本编辑器和部分发布/投稿按钮主要是 UI 状态演示，未持久化保存。
- 登录页直接请求 `http://localhost:8000`，未复用 `API_BASE`（[api-base.ts](frontend/src/lib/api-base.ts) 中已有可用的 `authApi`）；部署时需统一处理。
- 登录/注册失败时只显示笼统的 `e.message`，未解析后端返回的 `detail`，用户分不清"用户不存在"还是"密码错误"；`api.ts` 也没有对 401 做统一处理（token 失效不会自动清 localStorage 或跳回登录页）。
- 导航栏与首页的"开始游戏"链接指向 `/game/demo`，但该路由不存在（实际页面是 `/game/[sessionId]`），点击会 404。
- 首页路线预览请求失败时回退到硬编码列表，成功后直接显示后端返回的英文地名，其 locale 判断逻辑依赖 `t("home.title")` 返回值，写法较绕。
- 当前没有测试文件和 CI 配置。应把 `npm run lint`、`npm run build`、Python 编译检查和关键 API 冒烟测试作为最基本验证。

与当前冻结方案直接相关的额外断点：

- 当前没有 `stories`、`story_versions`、`game_sessions`、`game_events`、`session_clues` 五类持久化数据模型或迁移。
- 当前剧情 JSON 只有妈阁庙初稿和 4 个实际场景，缺少其余五章、媒体字段和可达结局；`prologue_photo`、`transition_ch1`、`chapter_01` 等目标不存在，只能作为迁移参考。
- 当前代码尚未实现 `video`、`router`、`ending` 三类节点、结构化线索条件、连续 router 解析、预加载目标计算或选择请求幂等。

## 本地开发

### 后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Swagger 文档：`http://localhost:8000/docs`。

关键环境变量位于 `backend/.env.example`：

- `SILICONFLOW_API_KEY`
- `SILICONFLOW_BASE_URL`
- `LLM_MODEL`
- `EMBEDDING_MODEL`
- `DATABASE_URL`
- `ADMIN_TOKEN`

不要提交真实 `.env`、API key、数据库文件、Chroma 数据或生成的音频。

### 前端

```powershell
cd frontend
node -v   # 需要 >= 20.9（next 16 的要求），建议 22 LTS
npm ci    # 依赖全部装在项目本地 node_modules，不污染全局
npm run dev
```

访问 `http://localhost:3000`。后端必须同时在 8000 端口运行，除非通过 `NEXT_PUBLIC_API_URL` 指向其他环境。

### Docker

```powershell
docker compose up --build
```

目前只会启动后端并把 `backend/` 挂载到 `/app`，前端仍需单独运行。

## 验证建议

根据改动范围至少执行以下相关检查：

```powershell
# 后端语法
python -m compileall backend/app

# 前端静态检查与生产构建
cd frontend
npm run lint
npm run build
```

后端行为变更还应启动服务后验证 `/api/v1/health`、对应接口以及 `http://localhost:8000/docs` 中的 schema。涉及游戏剧情时至少走通 start → choice → state；涉及认证时分别验证匿名、普通用户和管理员权限。

## 开发约定

- 先查实际代码和锁定依赖，再参考规划文档；修改实现后同步维护相关文档。
- 保持前后端契约一致：后端 snake_case，前端在 API 层转换，不要把适配散落到页面。
- 新的持久化逻辑应替换模块级字典，而不是再增加新的全局内存数据源。
- 目标剧情 JSON 以 `chapters -> scenes -> choices` 为核心；choice 跳转通过 `next_scene`，线索通过 `grant_clues` 数组发放。现有 `clue_reward` 是待迁移的旧字段，不应继续扩展。契约以 `backend-deliverables/02-story-data-contract.md` 1.0 为准。
- 用户可见文案应通过 `useTranslation()` 获取；新增翻译键必须同时补齐三种 locale。
- 前端优先复用 `src/components/ui` 和已有布局习惯；含浏览器 API、Leaflet、local/session storage 的组件必须是 Client Component。
- 不要在客户端暴露服务端密钥。`NEXT_PUBLIC_*` 只能存放允许公开的配置。
- 保留用户已有改动，避免顺手重构无关文件；仓库当前可能有未提交工作。
- 提交信息沿用 `feat:`、`fix:`、`docs:`、`refactor:`、`test:` 等前缀。

## 推荐的改造顺序

当前只按以下顺序推进成员 C 的最小后端闭环：

1. 按四份 1.0 交付文档建立最小数据模型、SQLite 持久化和迁移；部署 SQLite 时必须使用持久化卷，并保持 PostgreSQL 兼容性。
2. 实现剧情 v1 加载与发布前校验，以及 `video`、`router`、`ending` 状态机、线索发放和结局解析。
3. 升级 start → choice → state 三个接口，实现统一快照、错误格式、预加载信息、旧页面防护、事务和幂等重放。
4. 补自动化测试，至少覆盖分支、汇合、线索、router、多结局、恢复、非法请求、重复请求和已完成会话。
5. 完成后端冒烟与部署适配；正式视频使用对象存储/CDN URL，不通过 FastAPI 或 Railway 容器转发大视频流量。

不要在该闭环中顺手实现六章内容、播放器、GPS、账号、UGC、AI、国际化或其他旧路线图事项。需要联调时只同步 `frontend/src/lib/api.ts` 的类型和 API 适配，不扩展为前端视觉工作。
