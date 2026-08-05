# 澳秘 Macau Mystery

AI沉浸式剧本杀平台 - 沿澳门历史城区步行路线，通过与AI NPC对话破解跨越中葡两个家族的悬案。

## 技术栈
- **前端**: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui + Leaflet.js
- **后端**: FastAPI + SQLAlchemy async + SQLite/PostgreSQL + ChromaDB
- **媒体存储**: 本地 MinIO；公网演示使用 S3 兼容 Cloudflare R2
- **AI**: DeepSeek (via SiliconFlow) + edge-tts

## 快速开始

### 前端
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

### 后端与本地 MinIO
```bash
docker compose up --build
# API 文档：http://localhost:8000/docs
# MinIO S3 API：http://localhost:9000
# MinIO 控制台：http://localhost:9001
```

Compose 会自动执行对象存储初始化与 Alembic 迁移。默认开发账号为 `admin/admin123` 和 `guest/guest123`，MinIO 控制台默认账号为 `minioadmin/minioadmin`；可以在根目录环境变量中覆盖 MinIO 凭据。

不使用 Docker 时，安装 Python 3.11 依赖、执行 `alembic upgrade head`，并按 `backend/.env.example` 连接一个已启动的 MinIO 实例。

### 环境变量
1. 复制 `backend/.env.example` 为 `backend/.env`
2. 填入 SiliconFlow API Key (免费注册: https://siliconflow.cn)
3. 本地 MinIO 使用示例中的 S3 配置；公网部署时把 S3 endpoint、密钥和 `MEDIA_PUBLIC_BASE_URL` 换为 R2 配置

### 媒体上传流程

1. 管理员登录并携带 Bearer token 请求 `POST /api/v1/admin/media/uploads`。
2. 使用响应中的短时 `upload_url` 和 headers 直接 PUT 视频或海报到对象存储。
3. 调用 `POST /api/v1/admin/media/uploads/complete` 完成 HEAD 校验。
4. 把完成响应中的长期 `public_url` 写入剧情 JSON；不要保存会过期的 `upload_url`。

### 景点接口

- `GET /api/v1/locations`：六景点路线摘要和坐标。
- `GET /api/v1/locations/{location_id}`：单个景点的详细简体中文介绍。

## 项目结构
```
macau-mystery/
├── frontend/          # Next.js 前端
│   ├── src/app/       # 页面路由
│   ├── src/components/ # 组件
│   └── src/lib/       # API封装
├── backend/           # FastAPI 后端
│   ├── app/api/       # API路由
│   ├── app/ai/        # AI服务 (LLM/RAG/TTS)
│   ├── app/story/     # 故事引擎
│   ├── app/ugc/       # 一句话短剧
│   ├── app/knowledge/ # RAG知识库
│   └── app/admin/     # 管理后台
└── docker-compose.yml
```

## 团队分工
| 角色 | 负责 | 核心文件 |
|------|------|----------|
| A-前端 | UI页面+组件 | frontend/src/ |
| B-AI引擎 | LLM/RAG/TTS | backend/app/ai/ |
| C-故事引擎 | 剧本+游戏逻辑 | backend/app/story/ |
| D-UGC+管理 | 短剧生成+后台 | backend/app/ugc/ + admin/ |
