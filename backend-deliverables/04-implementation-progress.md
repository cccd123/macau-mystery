# 沉浸式短剧后端最新实现进度

- 更新时间：2026-08-06
- 当前阶段：游戏与认证持久化闭环保持完成；S3 兼容媒体、固定六景点接口和双视频前端测试剧情已就绪。
- 范围：只修改后端、部署配置和交付文档；未修改前端播放器、地图或弹框页面。

## 已完成

- 新增统一 `ObjectStorageService`，通过 `boto3` 同时兼容本地 MinIO 与 Cloudflare R2，并分别配置后端内部 endpoint、浏览器预签名 endpoint 和长期公开媒体基地址。
- 新增管理员 `POST /api/v1/admin/media/uploads`，校验文件扩展名、MIME 和声明大小后生成 15 分钟预签名 PUT 地址；对象键使用 UUID，避免覆盖已有文件。
- 新增管理员 `POST /api/v1/admin/media/uploads/complete`，通过 HEAD 校验对象存在、实际大小及 Content-Type，并返回可写入剧情 JSON 的长期 `public_url`、ETag 和 `ready` 状态。
- 视频首版限定 MP4 且最大 1 GiB；海报支持 JPEG、PNG、WebP 且最大 10 MiB。上传需持久化管理员 Bearer token，播放 URL 为公开只读。
- Docker Compose 新增固定版本 MinIO 服务、9000/9001 端口和 `minio_data` 持久卷；后端启动前幂等创建 `macau-media` 桶、公开读策略和浏览器 CORS。
- 新增六景点只读简体中文目录，包含稳定 ID、顺序、名称、极简摘要、详细介绍、坐标和澳门旅游局来源。
- 新增匿名 `GET /api/v1/locations` 与 `GET /api/v1/locations/{location_id}`；保留旧 `/admin/route` 兼容接口，不返回当前位置、解锁状态或 GPS 结果。
- `/api/v1/health` 新增 `object_storage: ok|unavailable|disabled`；已启用存储不可用时返回 503 degraded。
- 新增 `two_video_frontend_test.json` 最小测试剧情：第一段视频通过单一“继续”选项进入第二段结局视频，使用本地 MinIO 公开 URL，不包含线索或条件路由。
- 游戏剧情、会话、认证、数据库结构与剧情 JSON v1 契约均未改变；本批次不需要 Alembic 迁移。

## 验证结果

- 使用隔离的 Python 3.12 验证环境安装项目锁定版本依赖并运行完整后端测试：`28 passed`。
- 新增测试覆盖景点目录完整性、匿名列表/详情/404、管理员媒体鉴权、预签名地址、非法媒体、对象缺失、元数据冲突与上传完成响应。
- 既有游戏、认证、迁移、剧情导入、剧情运行时和健康检查测试全部回归通过。
- `docker compose config`：通过，确认后端、MinIO、环境变量和两个持久卷配置可解析。
- `two_video_frontend_test.json` 已通过剧情 CLI 校验：`valid: true`，无错误、无警告。
- 2026-08-06 对两个 MP4 和两个 JPG 地址执行 HEAD 检查均返回 200，Content-Type 分别为 `video/mp4` 与 `image/jpeg`；两个视频的 `bytes=0-1023` Range 请求均返回 206 和正确的 `Content-Range`。

## 当前交付边界

- 本地使用 MinIO；评委公网演示使用公共读 Cloudflare R2。预签名 URL 仅用于上传，完成接口返回的长期公开 URL 才能写入剧情 JSON。
- 仍未制作正式六章 JSON；双视频测试 JSON 及其 MinIO 视频、海报资源已可公开访问，尚待前端实际播放验收。
- 前端仍需自行对接 v1 游戏快照、视频播放器、景点接口和弹框；本批次未修改任何 `frontend/` 文件。
