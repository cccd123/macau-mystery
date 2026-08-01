# 澳秘 Macau Mystery

AI沉浸式剧本杀平台 - 沿澳门历史城区步行路线，通过与AI NPC对话破解跨越中葡两个家族的悬案。

## 技术栈
- **前端**: Next.js 14 + Tailwind CSS + shadcn/ui + Leaflet.js
- **后端**: FastAPI + SQLite + ChromaDB
- **AI**: DeepSeek (via SiliconFlow) + edge-tts

## 快速开始

### 前端
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

### 后端
```bash
cd backend
conda create -n macau-mystery python=3.11
conda activate macau-mystery
pip install -r requirements.txt
uvicorn app.main:app --reload
# 访问 http://localhost:8000/docs 查看 API 文档
```

### 环境变量
1. 复制 `backend/.env.example` 为 `backend/.env`
2. 填入 SiliconFlow API Key (免费注册: https://siliconflow.cn)
3. 前端已配置API proxy，无需额外配置

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
