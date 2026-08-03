# 沉浸式短剧游戏后端实现进度

- 更新时间：2026-08-03
- 当前阶段：第一批“数据库与迁移”已完成，准备进入剧情运行时
- 范围：成员 C 的预制视频分支短剧游戏后端

## 本批已完成

- 新增异步 SQLAlchemy 数据库层、配置层和五张目标数据表：`stories`、`story_versions`、`game_sessions`、`game_events`、`session_clues`。
- 新增 Alembic 初始迁移 `20260803_0001`，包含状态、唯一、外键和会话事件序号约束；SQLite 连接启用外键和写入等待时间。
- Docker Compose 已改为启动前执行 `alembic upgrade head`，并使用 `backend_sqlite_data` 命名持久卷保存 SQLite 数据库。
- CORS、运行环境、数据库 URL 和 demo bootstrap 开关已进入环境变量配置；健康检查已报告数据库连接状态。
- 已新增 pytest 基础配置、迁移测试和健康检查测试。

## 最近验证

- `python -m compileall backend/app backend/alembic backend/tests`：通过。
- `docker compose build backend`：通过，Python 3.11 镜像已包含新增依赖。
- `docker compose run --rm backend pytest -q`：`2 passed`。
- `docker compose run --rm backend alembic current`：`20260803_0001 (head)`；迁移已实际应用到 Docker SQLite 持久卷。

## 当前限制

- 游戏接口仍是内存 mock；剧情 JSON 仍未进入运行时校验、导入或版本发布流程。
- 现有 `macau_mystery_01.json` 仍不合格，不能发布或作为运行时剧情。
- 尚未实现 demo 剧情、router、线索状态机、幂等或新的游戏 API 响应。

## 下一批工作

1. 实现剧情 v1 Pydantic 模型、结构化校验、图索引和导入发布服务。
2. 新增独立一章 `macau_mystery_demo` 技术演示剧情，并在开发环境幂等 bootstrap。
3. 实现 `video`、`router`、`ending` 运行时、线索条件和预加载目标计算。
4. 添加剧情校验器和状态机单元测试。
