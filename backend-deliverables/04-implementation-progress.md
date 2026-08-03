# 沉浸式短剧游戏后端实现进度

- 更新时间：2026-08-03
- 当前阶段：第二批“剧情运行时”已完成，准备进入游戏接口与一致性
- 范围：成员 C 的预制视频分支短剧游戏后端

## 本批已完成

- 新增剧情 JSON v1 严格契约模型，覆盖 `video`、`router`、`ending`、媒体、选项、线索和三种结构化条件；运行时字段拒绝未知键。
- 新增结构化校验器，覆盖标识符、跳转/线索引用、默认路由、优先级、可达性、可达 video 空选项、结局可达、router 循环和 placeholder 媒体环境限制。
- 新增纯剧情图运行时：按优先级 router 解析、最多 32 次内部跳转、线索发放后分流和选项预加载目标计算。
- 新增剧情 CLI：`python -m app.story.cli validate <json>` 与 `python -m app.story.cli import <json> --publish`。
- 新增版本化 JSON 导入发布服务：内容 SHA-256 去重、同故事版本递增、已发布内容不原地修改、active version 更新。
- 新增独立的一章 `macau_mystery_demo` 技术剧情，覆盖分支、汇合、线索和好/坏结局；开发环境应用生命周期会幂等导入发布该 demo。
- 保留现有不合格的 `macau_mystery_01.json`，未补写正式六章内容。

## 最近验证

- `python -m compileall backend/app backend/tests`：通过。
- `docker compose run --rm backend python -m app.story.cli validate app/story/scripts/macau_mystery_demo.json`：有效，无错误和警告。
- `docker compose run --rm backend pytest -q`：`9 passed`。
- Docker 健康检查：`200 {status: ok, database: ok}`。
- Docker 持久数据库重复导入 demo：返回 `created: false`、版本号 `1`，确认内容去重生效。

## 当前限制

- `POST /game/start`、`/choice`、`/state/{session_id}` 仍为旧内存 mock，尚未调用新数据库、剧情图或版本数据。
- 尚未实现选择事务、会话恢复、统一业务错误、预加载 API 响应和 request ID 幂等重放。
- 尚未更新 `frontend/src/lib/api.ts`；未修改游戏页面、播放器或视觉。

## 下一批工作

1. 用数据库游戏服务替换旧全局 sessions 和硬编码推进，升级三个既有游戏 URL 到 1.0 快照契约。
2. 实现会话锁定、事件序号、线索去重、router 推进、结局完成和绑定版本恢复。
3. 实现统一错误、请求校验包装、旧场景防护、`request_id` 冲突与首次响应快照重放。
4. 添加 API 集成、已完成会话、恢复、版本固定、重复请求和并发测试。
