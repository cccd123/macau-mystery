# 项目最新实现进度

- 更新时间：2026-08-07
- 当前阶段：前端体验修复、地图/RAG/短剧生成/管理后台翻译与后端测试验收完成。

## 已完成

### 游戏与地图体验

- 修复首页“开始探案”与“开始游戏”跳转失败：统一进入 `/game/select` 选择已发布剧本，再进入 `/game/[sessionId]` 读取真实会话状态。
- 右上角剧本切换器改为按“地点数”展示（移除章数），默认选中 4 地点剧本《澳门秘录：中葡悬案》。
- 修复 Leaflet 地图 `Cannot read properties of undefined (reading '_leaflet_pos')` 报错：改用 CartoDB Voyager 瓦片、增加 ResizeObserver 自动 `invalidateSize`、强化 Strict Mode 下实例清理。
- 修复地图加载慢/不完全及图层遮挡问题：降低地图容器 z-index、marker 点击自动切换到列表页并高亮对应景点卡片。
- 景点介绍加长：更新 `backend/app/locations.zh-CN.json` 与六份 `knowledge/macau_docs/*.txt`，为 RAG 提供充足上下文。

### RAG 可问答能力

- 接入 `GET /api/v1/locations` 与 RAG 服务：景点弹窗展示静态历史，并支持展开输入问题。
- 优化 RAG 系统提示词：要求严格依据参考资料、1-3 句话简洁准确回答，禁止编造；将景点 curated description 作为基础上下文，top_k 提升到 4。

### 一句话短剧生成

- 生成页支持地点模糊搜索（非强制），未选择时随机挑选地点。
- `_build_story` 重构：引入贯穿所有地点的 MacGuffin 主线，地点之间用故事串联，分支线索与双结局逻辑可演示。
- 生成的剧情深度融合 RAG 收集的澳门历史知识，demo 可体现知识穿插效果。
- 创作结果页增加“公开发布”“保存草稿”“微调”三个动作；草稿与公开剧本可在“我的剧本”与社区列表中查看。

### 管理后台与社区翻译

- 管理后台中文版全页翻译（Script List、AI Script Creator、Media Object Storage）。
- Script List 增加删除确认弹窗、剧本效果预览、公开/草稿状态切换。
- 社区空状态翻译，移除会导致错误的 Play 按钮。
- Media Object Storage 页说明用途：用于上传剧本视频/音频/海报等媒体资源，管理端可获取 S3 兼容预签名上传链接。
- AI Script Creator 页面翻译，并说明其定位：用于管理员通过 AI 辅助快速生成剧本骨架，与面向普通用户的“一句话短剧”形成创作链路，二者暂不合并。

## 验证结果

- 前端 `npx tsc --noEmit`：通过。
- 前端 `npm run build`：通过（Next.js 16.2.12，16 个页面）。
- 后端 `python -m compileall app tests`：通过。
- 后端 `pytest -q`：28 passed（已安装 boto3 依赖，并补充 `from __future__ import annotations` 以兼容本地 Python 3.9 运行环境）。

## 当前边界

- 演示剧情仍为单章技术验证剧情，未制作正式六章内容与真实视频资源。
- 对象存储上传需要真实 S3/MinIO 配置与管理员 Bearer token；当前页面为管理端能力演示。
- 前端 `npm run lint` 仍有既有历史错误，本次未全面重构。
- 本地运行环境为 Python 3.9；项目目标运行时为 Python 3.11，已通过 future annotations 做兼容性处理。
