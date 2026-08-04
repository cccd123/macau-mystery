# 沉浸式短剧游戏后端实现进度

- 更新时间：2026-08-03
- 当前阶段：最小后端闭环与自动化测试已完成。
- 范围：成员 C 的预制视频分支短剧游戏后端；不含正式六章内容、视频制作、播放器、GPS、账号、UGC 或 AI。
- 文档同步：`AGENTS.md` 已按当前实现、验收结果和后续职责更新；前端测试性适配已撤回，不计入后端交付代码。

## 已完成

- 已建立 SQLite / PostgreSQL 兼容的持久化模型与 Alembic 初始迁移：`stories`、`story_versions`、`game_sessions`、`game_events`、`session_clues`。
- Docker Compose 的 SQLite 数据库使用命名持久卷；容器启动前自动执行迁移。
- 已实现版本化剧情 JSON 的严格契约、发布前语义校验、导入发布命令与开发环境可运行的最小演示剧情。
- 已实现 `video`、`router`、`ending` 状态机，含条件分流、线索发放与去重、分支汇合、结局、候选媒体预加载计算；`router` 不暴露给前端。
- 已升级 `POST /api/v1/game/start`、`POST /api/v1/game/choice`、`GET /api/v1/game/state/{session_id}` 到 1.0 统一快照契约，并实现会话版本固定、事务推进、旧场景防护、完成会话防护和 `request_id` 幂等重放。
- 游戏业务错误与游戏请求校验错误统一为 `{"error":{"code","message","details"}}`。

## 验证结果

- `python -m compileall backend/app backend/tests`：通过。
- 重新构建 Docker 后，`docker compose run --rm backend pytest -q`：`14 passed`。
- HTTP 冒烟：`health` 数据库状态为 `ok`；`start → choice → state` 成功推进，候选项含预加载数据。
- OpenAPI：三个目标游戏路径均已暴露；`ChoiceRequest` 必填 `session_id`、`scene_id`、`choice_id`、`request_id`。
- 持久卷恢复：停止并重启后端容器后，同一会话仍恢复到选择后的 `scene_letter` 场景。
- `npx tsc --noEmit`：通过。

## 已知验证限制

- `npm run lint` 未通过：全仓共有 42 个既有错误，集中在 admin、UGC 和旧组件。
- `npm run build` 被当前环境无法访问 Google Fonts（Geist / Geist Mono）阻断，未进入应用类型构建阶段；这不是游戏 API 改动导致的问题。
- 前端客户端适配为测试性改动，验收后已全部撤回；现有游戏页仍是旧叙事文本页面，尚不能直接按 v1 契约提交 `scene_id` 和 `request_id`。后续应由前端负责人在播放器接入时完成该适配。
