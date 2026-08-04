# 沉浸式短剧游戏最小后端闭环实施计划

- 制定日期：2026-08-03
- 依据：`00` 至 `03` 四份 1.0 交付文档
- 交付目标：可持久化的 `start → choice → state → ending` 闭环与自动化测试

> 说明：本文件记录游戏闭环的历史实施计划。2026-08-04 已明确授权并完成独立的持久化登录/注册扩展，见 `06-authentication-api-and-persistence.md`；该扩展不改变本计划的游戏范围。

## 第一批：数据库与迁移

- 添加异步 SQLAlchemy 数据库层和 `stories`、`story_versions`、`game_sessions`、`game_events`、`session_clues` 五张表。
- 添加 Alembic 初始迁移；应用本身不在启动时建表或修改表。
- Docker 启动前执行 `alembic upgrade head`，SQLite 使用命名持久卷；本地开发显式执行迁移。
- 从环境变量读取数据库 URL、CORS 来源、运行环境和 demo bootstrap 开关。
- 补迁移和数据库约束测试，并覆盖更新 `04-implementation-progress.md`。

## 第二批：剧情运行时

- 实现剧情 v1 Pydantic 模型、结构化校验结果、JSON 导入发布命令和不可变版本管理。
- 实现 `video`、`router`、`ending` 解析，包含线索条件、优先级、循环保护、线索发放后路由和预加载目标计算。
- 新增独立的 `macau_mystery_demo` 一章技术演示剧情，覆盖分支、汇合、线索和多结局；开发环境启动时幂等导入，生产默认关闭。
- 保留不合格的 `macau_mystery_01.json` 作为迁移参考，不补写六章正式内容。
- 补校验器和状态机单元测试，并覆盖更新进度文档。

## 第三批：游戏接口与一致性

- 用数据库服务替换 `app/api/game.py` 的全局 sessions 和硬编码推进，保留三个既有 URL。
- 返回 1.0 契约规定的统一快照、媒体、预加载、线索、进度和结局；router 永不暴露。
- 在一次事务内完成会话锁定、旧页面校验、选择事件、线索去重、router 解析、结局和状态更新。
- 将首次成功选择响应保存到 `choice_made.payload_json`；同一 request ID 的合法重试优先返回该快照，不同内容返回 `409 IDEMPOTENCY_CONFLICT`。
- 统一业务错误与 Pydantic 422 格式，健康检查加入数据库状态；补 API 集成和并发/幂等测试，并覆盖更新进度文档。

## 第四批：适配、部署与验收

- 仅更新 `frontend/src/lib/api.ts` 的目标契约类型和兼容适配：保留旧页面外壳，同时提供完整快照、scene ID 和可重试 request ID 管理；不改游戏页面、视觉或播放器。
- 完善 Docker、环境变量示例和运行说明；正式视频仍由对象存储或 CDN 直接提供。
- 在 Python 3.11 容器执行迁移、pytest、语法检查和 HTTP 冒烟；验证重启后会话仍可恢复；执行前端 lint 和 build。
- 最终覆盖更新进度文档为完成状态或真实阻塞状态。

## 验收重点

- 剧情校验覆盖引用、router 条件、可达性、死路、循环和媒体状态。
- API 覆盖分支、汇合、线索、router、多结局、恢复、版本固定、非法请求、重复请求和已完成会话。
- 同一选择请求不会重复推进或重复发线索；重放始终返回第一次响应快照。
- 不实现六章正式内容、播放器、GPS、密码重置/邮箱验证等扩展账号能力、AI、UGC、国际化或其他成员任务。
