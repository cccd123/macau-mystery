# Macau Mystery Platform - Task Breakdown & Team Assignment

> 分支基线：`master` 为主分支，`feat/d` 为 D 当前开发分支。
> 状态更新时间：2026-08-02

---

## v0.2-v0.4 当前状态（已合并到 master / feat/d）

### Frontend (Next.js 14 + TypeScript + shadcn/ui)
| Page/Component | File | Status | 说明 |
|---|---|---|---|
| Homepage (i18n + dynamic route) | `frontend/src/app/page.tsx` | Done | 三语言切换、动态路线加载 |
| Login/Register | `frontend/src/app/login/page.tsx` | Done | 登录/注册 UI |
| Game (video/router 新协议) | `frontend/src/app/game/[sessionId]/page.tsx` | Done | 已适配 C 后端 snapshot 格式：视频、选项、结局 |
| Map (Leaflet) | `frontend/src/app/game/map/page.tsx` | Done | 基础地图展示 |
| Clue Inventory | `frontend/src/app/game/clues/page.tsx` | Done | 线索列表 |
| Create Drama (API connected) | `frontend/src/app/create/page.tsx` | Done | AI 生成剧本输入页 |
| Create Result (publish/submit) | `frontend/src/app/create/result/page.tsx` | Done | 发布/投递官方 |
| Admin Dashboard (API connected) | `frontend/src/app/admin/page.tsx` | Done | 管理后台首页 |
| Admin Manual Create | `frontend/src/app/admin/scripts/new/page.tsx` | Done | 手动创建剧本 |
| Admin AI Create (dual mode) | `frontend/src/app/admin/scripts/ai-create/page.tsx` | Done | AI 双模式创建 |
| Admin Script Editor | `frontend/src/app/admin/scripts/[id]/page.tsx` | Done | 剧本编辑 |
| Navbar (i18n + auth state) | `frontend/src/components/navbar.tsx` | Done | 导航栏 |
| Language Switcher | `frontend/src/components/language-switcher.tsx` | Done | 语言切换 |
| Dialogue Box | `frontend/src/components/dialogue-box.tsx` | Done | NPC 对话框 |
| Choice Panel | `frontend/src/components/choice-panel.tsx` | Done | 选项面板 |
| Clue Card | `frontend/src/components/clue-card.tsx` | Done | 线索卡片 |
| Map Viewer | `frontend/src/components/map-viewer.tsx` | Done | Leaflet 地图组件 |
| Style Selector | `frontend/src/components/style-selector.tsx` | Done | 风格选择器 |
| Script Editor | `frontend/src/components/script-editor.tsx` | Done | 剧本编辑器 |
| API Client | `frontend/src/lib/api.ts` | Done | 已适配游戏 API v1 snapshot 协议 |
| Video Player | `frontend/src/components/video-player.tsx` | Done | 视频播放、poster、错误回退、播放控制 |
| i18n Translations | `frontend/src/lib/i18n/translations.ts` | Done | 三语言字典，已补 game/nav/myScripts/community 键 |
| i18n Context | `frontend/src/lib/i18n/context.tsx` | Done | 语言上下文 |
| My Scripts | `frontend/src/app/my-scripts/page.tsx` | Done | 未登录提示、列表、公开/私有切换 |
| Community | `frontend/src/app/community/page.tsx` | Done | 公开 UGC 剧本列表 |

### Backend (FastAPI + SQLAlchemy + SQLite / async)
| Module | File | Status | 说明 |
|---|---|---|---|
| FastAPI 入口 + 路由注册 | `backend/app/main.py` | Done | 含 lifespan、错误处理、CORS |
| 数据库配置 & 迁移 | `backend/app/config.py`, `backend/app/db.py`, `alembic/` | Done | SQLite + aiosqlite |
| Auth（登录/注册/密码加密） | `backend/app/api/auth.py` | Done | 密码已加密 |
| Game API v1（video/router/ending） | `backend/app/api/game.py` | Done | 新协议：返回 snapshot、media、preload |
| Game Service & State Machine | `backend/app/game_service.py` | Done | 会话恢复、线索去重、幂等控制 |
| Story Contract & Validation | `backend/app/models.py`, `backend/app/story/` | Done | 严格 Pydantic 剧情契约 |
| Story Importer / CLI | `backend/app/story/importer.py`, `backend/app/story/cli.py` | Done | 导入剧本、校验剧情 |
| Demo Story Bootstrap | `backend/app/story/scripts/` | Done | 启动时自动导入 demo 剧情 |
| AI Chat (NPC) | `backend/app/api/ai.py` | Done | NPC 对话接口 |
| UGC Generate | `backend/app/api/ugc.py` | Done | 一句话生成剧本 |
| UGC User（publish/submit） | `backend/app/api/ugc_user.py` | Done | 发布/投递官方 |
| Admin（CRUD/stats/submissions） | `backend/app/api/admin.py` | Done | 管理接口 |
| LLM Client (SiliconFlow) | `backend/app/ai/llm_client.py` | Done | DeepSeek 接入 |
| TTS Service (edge-tts) | `backend/app/ai/tts_service.py` | Done | 语音合成 |
| Health Check | `/api/v1/health` | Done | 数据库健康检查 |

---

## Iteration Plan（更新后）

### v0.3 - 前端适配 C 的新游戏协议（Priority: HIGH，D 负责）✅ 已完成
- [x] 更新 `frontend/src/lib/api.ts` 中 `gameApi` 以适配新 snapshot 格式
- [x] 重构 `frontend/src/app/game/[sessionId]/page.tsx`
  - 播放 `scene.media.video_url` 视频
  - 视频停在末帧显示选项
  - 预加载候选视频 (`choice.preload.media`)
  - 选择后切换到下一视频场景
  - 显示已获得的线索
  - 处理 `ending` 结局场景
- [x] 新增 `VideoPlayer` 组件：`frontend/src/components/video-player.tsx`

### v0.4 - 补齐 i18n & 用户页面（Priority: HIGH，D 负责）✅ 已完成
- [x] 检查所有前端页面，将剩余硬编码中文替换为 `t("key")`
- [x] 新增翻译键到 `translations.ts` 的三语言版本
- [x] 新增「我的剧本」页面：`frontend/src/app/my-scripts/page.tsx`
- [x] 新增「剧本广场/社区」页面：`frontend/src/app/community/page.tsx`

### v0.5 - A/B 内容合入 & 管理后台增强（Priority: MEDIUM）
- [ ] A：将 `feat/a-ui-theme` 的 UI 主题合入（PR 到 master）
- [ ] B：将 `feat/b-story-json` 的完整剧情 JSON 合入（PR 到 master）
- [ ] D：review 并合并 A/B 的 PR
- [ ] D：管理后台数据图表（recharts 展示真实 stats）

### v0.6 - 地图 GPS & 语音（Priority: MEDIUM）
- [ ] 浏览器 Geolocation API 实时定位
- [ ] edge-tts 多语言语音播放
- [ ] 地图标记点详情弹窗

### v0.7 - Admin + Deploy（Priority: MEDIUM）
- [ ] Docker 部署配置
- [ ] 前端部署到 Vercel
- [ ] 后端部署到 Railway / 服务器

### v0.8 - Demo Ready（Priority: LOW）
- [ ] 完整端到端 demo 流程
- [ ] 演示 PPT

---

## 团队分工（更新后）

### 曹丹（队长）- Person D: 前端功能 + DevOps + GitHub 管理
**学校**：华南理工大学  
**Role**：全栈开发，负责前端与 C 后端协议对接、Vercel 部署、GitHub 管理、PR Review

| 优先级 | 任务 | 文件 | 说明 |
|---|---|---|---|
| P0 | 前端适配新游戏 API | `frontend/src/lib/api.ts`, `frontend/src/app/game/[sessionId]/page.tsx` | 视频播放、选项、预加载、结局 |
| P0 | 补齐 i18n | 所有 `frontend/src/app/**/page.tsx` | 替换硬编码文字 |
| P1 | 我的剧本页 | `frontend/src/app/my-scripts/page.tsx` | 用户查看自己生成/发布的剧本 |
| P1 | 剧本广场 | `frontend/src/app/community/page.tsx` | 浏览公开 UGC 剧本 |
| P2 | 地图 GPS | `frontend/src/components/map-viewer.tsx` | 浏览器实时定位 |
| P2 | 管理图表 | `frontend/src/app/admin/page.tsx` | recharts 展示 stats |
| P3 | Vercel 部署 | Vercel Dashboard | 前端自动部署 |
| Ongoing | PR Review | GitHub | review A/B/C 的 PR 并合并 |

**Interface Rules for D：**
- 新页面统一使用 `<div className="container mx-auto px-4 py-6">` 包裹
- 所有用户可见文字必须走 `useTranslation()` 的 `t("key")`
- 新增翻译键必须同时补充英语、简体中文、繁体中文
- 游戏 API 新协议返回 snapshot，前端 adapter 需要转换为组件可用的 scene 结构
- 提交前必须 `npm run build` 通过、无 console 报错

---

### 邹依霖 - Person A: UI 设计 + AI 短剧质控
**学校**：武汉大学  
**Role**：视觉设计 + AI 生成内容质量把控

| 任务 | 分支 | 文件 | 状态 | 说明 |
|---|---|---|---|---|
| Macau 视觉主题刷新 | `feat/a-ui-theme` | `frontend/src/app/globals.css`, 游戏页 | 待 PR | Azulejo 蓝金配色 |
| 游戏场景风格图 | `feat/a-ui-theme` | `frontend/src/app/game/[sessionId]/page.tsx` | 待 PR | 场景插图、过渡动画 |
| AI 短剧质量测试 | - | `frontend/src/app/create/result/page.tsx` | 待执行 | 生成 20+ 测试并反馈 |
| 地图标记弹窗 | - | `frontend/src/components/map-viewer.tsx` | 待执行 | 图片+描述弹窗 |

---

### 陈晓蔚 - Person B: 商业策划 + AI 短剧质控
**学校**：广东工业大学  
**Role**：商业计划 + 剧本内容 + NPC 设定

| 任务 | 分支 | 文件 | 状态 | 说明 |
|---|---|---|---|---|
| 完整剧情 JSON | `feat/b-story-json` | `backend/app/story/scripts/` | 待 PR | 六章剧情、多结局 |
| NPC 角色设定 | - | `backend/app/ai/prompt_templates.py` | 待执行 | 五名 NPC 性格小传 |
| 商业计划书 | - | `docs/BUSINESS_PLAN.md` | 待执行 | 市场分析、商业模式 |
| 竞品分析 | - | `docs/COMPETITIVE_ANALYSIS.md` | 待执行 | 与现有产品对比 |

---

### 曾建文 - Person C: 后端 AI + 集成
**学校**：武汉大学  
**Role**：后端开发、AI 集成、数据库与游戏引擎

| 任务 | 文件 | 状态 | 说明 |
|---|---|---|---|
| 游戏 API v1（已合并） | `backend/app/api/game.py`, `backend/app/game_service.py` | Done | 数据库事务、视频协议、状态机 |
| 剧情契约与校验（已合并） | `backend/app/models.py`, `backend/app/story/` | Done | 严格 Pydantic、CLI 工具 |
| 数据库迁移（已合并） | `backend/app/db.py`, `alembic/` | Done | SQLite + aiosqlite |
| SiliconFlow API 接入 | `backend/app/ai/llm_client.py` | 待测试 | 接入真实 DeepSeek |
| UGC 真实 AI 生成 | `backend/app/api/ugc.py` | 待测试 | 替换 mock |
| NPC 真实对话 | `backend/app/api/ai.py` | 待测试 | 接入 llm_client |
| ChromaDB RAG | `backend/app/knowledge/` | 待执行 | 知识库检索 |
| edge-tts 语音 | `backend/app/ai/tts_service.py` | 待测试 | 粤语/普通话语音 |

**Interface Rules for C：**
- 所有 API 返回 snake_case 字段
- 新端点必须在 `main.py` 注册并加前缀
- Python 文件中禁止中文全角标点
- 提交前用 `Invoke-RestMethod` 或 curl 测试端点

---

## API 协议更新（C 后端 v1）

```
POST /api/v1/game/start
  Body:  { "script_id": "broken_hairpin" }
  Resp:  GameSnapshot
          { session_id, status, story, scene, clues, progress, ending? }

POST /api/v1/game/choice
  Body:  { "session_id", "scene_id", "choice_id", "request_id" }
  Resp:  GameSnapshot

GET  /api/v1/game/state/{session_id}
  Resp:  GameSnapshot

GameSnapshot.scene:
  { id, type: "video" | "ending",
    chapter: { id, title, location },
    media: { video_url, poster_url, mime_type, duration_ms },
    choices: [ { id, text, preload: { scene_id, media } } ] }
```

旧版 `narration/dialogue/choices` 格式已废弃，前端必须按新 snapshot 结构渲染。

---

## 分支状态总览

| 分支 | 负责人 | 状态 | 说明 |
|---|---|---|---|
| `master` | - | 主分支 | 已合并 C 后端 PR #2，含最新后端 |
| `feat/d` | 曹丹 | 开发中 | 基于 master，D 在此完成前端适配与用户功能 |
| `feat/a-ui-theme` | 邹依霖 | 待 PR | UI 主题与游戏场景优化 |
| `feat/b-story-json` | 陈晓蔚 | 待 PR | 完整剧情 JSON |
| `feat/c` | 曾建文 | 已合并 | 后端核心功能 |

---

## Daily Workflow

```powershell
# 1. 切换到 master 并拉取最新
cd D:\macau-mystery
git checkout master
git pull origin master

# 2. 切到自己的功能分支（若已有则 rebase）
git checkout feat/d          # D
git rebase master            # 保持线性历史

# 3. 修改代码...

# 4. 提交并推送
git add -A
git commit -m "feat: 描述"
git push origin feat/d

# 5. 在 GitHub 创建 PR 到 master，请求 D review

# 6. D review 通过后在 GitHub 合并
```

## Startup Commands

```powershell
# 后端（首次需迁移）
cd D:\macau-mystery\backend
conda activate macau-mystery
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 前端
cd D:\macau-mystery\frontend
npm run dev
```
