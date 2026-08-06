# 后端最新实现进度

- 更新时间：2026-08-06
- 当前阶段：游戏闭环保持完成；一句话中文澳门历史文字剧本生成与 ChromaDB RAG 已实现。
- 范围：只修改后端、部署配置和交付文档；未修改任何前端文件。

## 已完成

- 将匿名 `POST /api/v1/create/generate` 从固定模板替换为真实 SiliconFlow 兼容 LLM 调用，支持悬疑、爱情、喜剧、悲剧风格，清代、民国、现代、架空背景以及 3/5/7 幕。
- 生成结果强制为中文澳门历史题材，包含人物表、剧情简介、分幕、场景、动作叙述和人物对白；与游戏 StoryDocument、视频、线索状态机和游戏会话完全隔离。
- 模型先返回严格 JSON，后端通过 Pydantic 校验幕数和结构；首次输出不合法时执行一次低温修复，仍失败则返回结构化 502，绝不把错误字符串或 mock 当作成功剧本。
- 响应保留 `script_id/title/chapters/style/era/demo_mode`，增加完整 `content` 和 `rag` 元数据；现有创建结果页无需改动仍可读取章节首场 `narration`。
- 使用 SiliconFlow embeddings 与持久化 ChromaDB 检索六景点内置资料，索引按 embedding model 隔离，内容 ID 稳定，支持幂等补录和清理陈旧 chunk；首次请求发现空索引时自动构建，也可运行 `python -m app.knowledge.ingest` 预建。
- RAG 配置、嵌入、Chroma 或检索失败时自动降级为纯 LLM，并明确返回 `rag.used=false`、`rag.degraded=true`；LLM 未配置返回 503，供应商失败返回 502。
- 匿名生成结果按确认要求只进入容量可配的 LRU 进程缓存；`POST /create/regenerate/{script_id}` 使用原始输入重新生成并保留 UUID，重启、淘汰或多实例切换后返回结构化 404。
- Docker Compose 将 Chroma 数据放入 `/app/data/chroma`，复用现有后端持久卷；本批次不新增数据库表或 Alembic 迁移，也未安装新依赖。

## 验证结果

- 新增剧本生成专项测试覆盖 RAG 提示词、完整文本渲染、非法模型输出修复、六景点知识完整性、Chroma 持久化与幂等入库、RAG 关闭降级、匿名生成/重新生成、缓存缺失、模型未配置和请求校验。
- 专项测试：`13 passed`；完整后端回归：`41 passed`。
- `python -m compileall -q app tests` 与 `docker compose config --quiet` 均通过。

## 当前边界

- 必须配置有效 `SILICONFLOW_API_KEY` 才能生成；RAG 可降级不等于 LLM 可离线运行。
- 生成缓存不持久化、不跨进程共享且没有匿名用户所有权；这是本次明确选择的原型行为，不应被当作生产级存储。
- 内置 RAG 只覆盖固定六景点简体中文资料；暂未提供在线知识管理、爬取、用户上传、重排序或 NPC 聊天 RAG。
- UGC 发布/投稿仍未与本生成接口打通；管理后台 AI 生成仍是另一条旧内存接口。
