# 沉浸式短剧游戏后端实现进度

- 更新时间：2026-08-03
- 当前阶段：第三批“游戏接口与一致性”已完成，准备进入适配、部署与总验收
- 范围：成员 C 的预制视频分支短剧游戏后端

## 本批已完成

- `POST /api/v1/game/start`、`POST /api/v1/game/choice`、`GET /api/v1/game/state/{session_id}` 已从内存 mock 升级为数据库游戏服务，保留既有 URL。
- 三个接口均返回 1.0 契约的统一快照：`story`、`scene`、`media`、`choices.preload`、`clues`、`progress`，结局额外返回 `ending`；router 永不暴露。
- 开局会话绑定 active story version；状态恢复始终读取会话绑定版本，不受后续发布影响。
- 选择事务实现了 SQLite `BEGIN IMMEDIATE` / PostgreSQL 行锁路径、事件顺序、线索去重、发线索后 router 解析、结局完成和可播放节点保存。
- 已实现 `scene_id` 旧页面防护、`request_id` 首次响应快照重放、不同请求内容冲突检测，以及完成会话保护。
- 游戏业务错误和游戏接口的 422 校验错误均采用 `{"error":{"code","message","details"}}`；健康检查继续报告数据库状态。
- 旧 `app/api/game.py` 的全局 sessions 和硬编码推进已移除；未修改 AI、UGC、账号、前端页面或播放器。

## 最近验证

- `python -m compileall backend/app backend/tests`：通过。
- `docker compose run --rm backend pytest -q`：`14 passed`。
- API 集成测试覆盖开局、候选媒体预加载、分支、汇合、线索、多结局、恢复、版本固定、旧场景、完成会话、统一错误和幂等重放。
- SQLite 并发测试确认两个不同 request ID 同时选择同一场景时仅一方推进，另一方返回 `STALE_SCENE`。

## 当前限制

- `frontend/src/lib/api.ts` 仍是旧扁平响应适配，尚未发送 `scene_id` 与 `request_id`，不能直接联调新游戏接口。
- Docker 镜像在第三批代码写入前构建；最终验收前需要重新 build 后运行 Docker 冒烟。
- 尚未制作正式六章内容、视频、播放器或页面恢复逻辑，均不属于成员 C 当前范围。

## 下一批工作

1. 仅更新 `frontend/src/lib/api.ts`：补目标契约类型、错误解析、scene/request ID 的浏览器端兼容管理和 legacy 外壳。
2. 重新构建 Docker 镜像，启动服务并执行 HTTP 冒烟、OpenAPI 与持久卷重启恢复验证。
3. 执行前端 lint/build，完善环境变量和运行说明。
4. 覆盖更新进度文档为最终完成状态或真实阻塞状态。
