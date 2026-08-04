# 沉浸式短剧游戏与认证后端实现进度

- 更新时间：2026-08-04
- 当前阶段：游戏最小持久化闭环与持久化登录、注册、Bearer 会话均已实现并完成 Python 3.11 自动化验证。
- 范围：成员 C 的预制视频分支短剧游戏后端，以及已明确授权的最小登录/注册持久化；不含正式六章内容、视频制作、播放器、GPS、密码重置、邮箱验证、UGC 或 AI。

## 已完成

- 游戏部分保持完成：SQLite / PostgreSQL 兼容的剧情、会话、事件与线索持久化；版本化剧情校验、状态机、v1 游戏 API、幂等和 Docker 数据卷支持。
- 新增 `users` 与 `auth_sessions` SQLAlchemy 模型及 Alembic 增量迁移 `20260804_0002`。用户名以规范化键大小写无关唯一，密码使用 Argon2 哈希，随机 Bearer token 仅以摘要持久化。
- `POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`GET /api/v1/auth/me` 已改为异步数据库实现，维持前端既有 `{ token, user }` 响应结构；注册成功后自动登录。
- 为兼容现有登录页未声明密码长度的输入，密码校验设为 6–128 位；后端测试覆盖 6 位密码可注册、5 位密码返回 422。
- 已将 `03-game-api-contract.md` 升级为项目统一 API 文档，覆盖健康检查、游戏、认证、AI、UGC 与管理后台，并标记 mock/内存接口的实际限制。
- admin 与 UGC 的既有令牌解析已切换到持久化认证服务；它们自身的剧本、投稿等旧业务数据仍未持久化。
- 开发环境可以通过 `BOOTSTRAP_DEMO_USERS` 幂等创建缺失的 `admin/admin123` 与 `guest/guest123`，生产默认关闭，且绝不覆盖既有用户。
- 新增认证集成测试，覆盖迁移、注册、重复用户名、登录、`/me`、密码哈希、会话持久化、过期令牌、角色鉴权和 demo seed 幂等性。

## 验证结果

- `python -m compileall backend/app backend/tests`：通过。
- 在项目内隔离的 Python 3.11 `backend/.venv` 运行完整后端测试：`18 passed`。
- 在临时 SQLite 文件执行 `alembic upgrade head`：通过，确认从空库可按 `20260803_0001 → 20260804_0002` 升级。
- 认证自动化测试已验证注册自动登录、大小写无关重复用户名、错误密码、`/auth/me`、Argon2 非明文存储、令牌过期、同一数据库上的新应用实例恢复令牌，以及 admin/UGC 角色鉴权。
- 前端 `/login` 未改动；其现有 URL、字段和 `{ token, user }` 响应与已测试 API 保持兼容。实际浏览器页面冒烟可在本地同时启动前后端后执行。
