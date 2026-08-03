# AGENTS.md

本文档记录仓库级项目背景、真实实现状态和协作约定，供后续开发代理快速建立上下文。除非代码已同步更新，否则不要把 `README.md` 或 `TASK_BREAKDOWN.md` 中的版本号、完成状态和迭代计划当作当前实现事实；应以依赖清单和源代码为准。

## 项目定位

“澳秘 / Macau Mystery”是一个澳门历史城区主题的 AI 沉浸式互动剧本平台原型。核心设想是让玩家沿真实文化遗产步行路线推进剧情、与 NPC 对话和收集线索，同时提供一句话生成互动短剧、用户发布投稿和管理后台能力。

当前仓库处于 v0.2 原型阶段。页面和 API 骨架较完整，但多数业务数据存放在进程内存中，游戏推进与 AI 能力仍以 mock 为主，尚不是可持久化或可生产部署的完整产品。

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

## API 契约速查

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
- 剧本 JSON 以 `chapters -> scenes -> choices` 为核心；choice 跳转通过 `next_scene`，线索通过 `clue_reward`。扩展 schema 时同时更新加载校验、引擎、API 和编辑器。
- 用户可见文案应通过 `useTranslation()` 获取；新增翻译键必须同时补齐三种 locale。
- 前端优先复用 `src/components/ui` 和已有布局习惯；含浏览器 API、Leaflet、local/session storage 的组件必须是 Client Component。
- 不要在客户端暴露服务端密钥。`NEXT_PUBLIC_*` 只能存放允许公开的配置。
- 保留用户已有改动，避免顺手重构无关文件；仓库当前可能有未提交工作。
- 提交信息沿用 `feat:`、`fix:`、`docs:`、`refactor:`、`test:` 等前缀。

## 推荐的改造顺序

1. 先统一 API 基址、错误格式和类型定义，并补最小测试。
2. 用通用 `StoryEngine` 替换硬编码游戏推进，完整支持 `next_scene`、章节、线索和结局。
3. 建立 SQLite 持久化层，统一用户、token/session、剧本、UGC 和投稿数据。
4. 将真实 LLM、RAG、TTS 通过可配置服务接到路由，同时保留明确的本地 mock 模式。
5. 最后补齐六章内容、发布闭环、完整 i18n、GPS/地图增强和生产部署配置。
