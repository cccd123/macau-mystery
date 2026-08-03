# 沉浸式短剧游戏 API 契约

- 文档状态：已确认
- 版本：1.0
- 更新日期：2026-08-03
- 对应剧情契约：`02-story-data-contract.md` 1.0
- 本阶段只定义接口，不修改现有 API 实现。

## 1. 通用约定

- 基础路径：`/api/v1`
- 数据格式：`application/json`
- JSON 字段：`snake_case`
- 时间：UTC ISO 8601，例如 `2026-08-03T08:30:00Z`
- 会话和请求标识：UUID 字符串
- 首版游戏接口匿名可用，不要求 Bearer token。
- 后端只返回 `video` 或 `ending` 节点；`router` 永不暴露给前端。
- 当前 `/game/start`、`/game/choice` 和 `/game/state/{session_id}` 路径继续保留，减少前端路由调整。

## 2. 公共响应对象

### 2.1 `story`

```json
{
  "id": "macau_mystery_01",
  "title": "跨越中葡的悬案",
  "version": 1
}
```

### 2.2 `media`

```json
{
  "video_url": "https://media.example.com/macau/prologue_01.mp4",
  "poster_url": "https://media.example.com/macau/prologue_01.jpg",
  "mime_type": "video/mp4",
  "duration_ms": 42000
}
```

媒体 `status` 不返回玩家端。未准备好的正式剧情不能开始；开发环境的占位剧情可以返回占位媒体。

### 2.3 `choice`

```json
{
  "id": "inspect_letter",
  "text": "调查那封旧信",
  "preload": {
    "scene_id": "prologue_02b",
    "media": {
      "video_url": "https://media.example.com/macau/prologue_02b.mp4",
      "poster_url": "https://media.example.com/macau/prologue_02b.jpg",
      "mime_type": "video/mp4",
      "duration_ms": 38000
    }
  }
}
```

`preload` 由后端根据当前线索和该选项可能发放的线索计算。它用于前端提前加载候选下一视频，不代表前端可以绕过 `/game/choice` 自行推进。

每个返回给前端的选项都必须包含 `preload`。后端按“模拟发放该选项的 `grant_clues`，再解析全部连续 `router`”的顺序，得到确定的下一个 `video` 或 `ending` 节点。`preload.scene_id` 是解析后的可播放节点 ID，不是中间 `router` ID。

### 2.4 `scene`

```json
{
  "id": "prologue_01",
  "type": "video",
  "chapter": {
    "id": "prologue",
    "title": "第一章：妈阁启程",
    "location": "妈阁庙"
  },
  "media": {
    "video_url": "https://media.example.com/macau/prologue_01.mp4",
    "poster_url": "https://media.example.com/macau/prologue_01.jpg",
    "mime_type": "video/mp4",
    "duration_ms": 42000
  },
  "choices": [
    {
      "id": "continue_search",
      "text": "继续追查",
      "preload": {
        "scene_id": "chapter_02_01",
        "media": {
          "video_url": "https://media.example.com/macau/chapter_02_01.mp4",
          "poster_url": "https://media.example.com/macau/chapter_02_01.jpg",
          "mime_type": "video/mp4",
          "duration_ms": 41000
        }
      }
    }
  ]
}
```

`type` 只会是 `video` 或 `ending`。结局节点的 `choices` 固定为空。

### 2.5 `clue`

```json
{
  "id": "letter_fragment",
  "title": "信件残片",
  "description": "一张与悬案有关的旧信残片。",
  "icon": "letter",
  "acquired_at": "2026-08-03T08:35:00Z"
}
```

### 2.6 快照字段约定

- `status` 对玩家端只返回 `active` 或 `completed`；首版不提供客户端主动放弃会话的接口。
- `ending` 在 `status=completed` 时必填，在 `status=active` 时不返回。
- `awarded_clues` 只出现在 `/game/choice` 成功响应中；`clues` 始终表示该响应时刻会话持有的全部线索。
- `progress.current_chapter` 是当前返回节点所属章节在 `chapters` 数组中的 1 基序号；`progress.total_chapters` 是该剧情版本的章节总数。
- `media.duration_ms` 和 `clue.icon` 延续剧情契约中的可选性；其他示例字段均为必填。可选字段没有值时省略，不返回含义不清的空字符串。
- 响应中的 `choices`、`clues` 和 `awarded_clues` 始终返回数组；没有内容时返回 `[]`，不返回 `null`。

## 3. 开始游戏

`POST /api/v1/game/start`

每次成功调用都创建一个新匿名会话。恢复旧会话应调用状态接口，不重复调用开始接口。

### 请求

```json
{
  "script_id": "macau_mystery_01"
}
```

为兼容当前前端字段，首版请求继续使用 `script_id`；数据库和剧情文件内部使用更准确的 `story_id`。

### 成功响应：`201 Created`

```json
{
  "session_id": "a410105b-9d6b-4e11-aa4d-f9673835ece7",
  "status": "active",
  "story": {
    "id": "macau_mystery_01",
    "title": "跨越中葡的悬案",
    "version": 1
  },
  "scene": {
    "id": "prologue_01",
    "type": "video",
    "chapter": {
      "id": "prologue",
      "title": "第一章：妈阁启程",
      "location": "妈阁庙"
    },
    "media": {
      "video_url": "https://media.example.com/macau/prologue_01.mp4",
      "poster_url": "https://media.example.com/macau/prologue_01.jpg",
      "mime_type": "video/mp4",
      "duration_ms": 42000
    },
    "choices": [
      {
        "id": "ask_history",
        "text": "询问妈阁庙的历史",
        "preload": {
          "scene_id": "prologue_02a",
          "media": {
            "video_url": "https://media.example.com/macau/prologue_02a.mp4",
            "poster_url": "https://media.example.com/macau/prologue_02a.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 36000
          }
        }
      },
      {
        "id": "inspect_letter",
        "text": "调查那封旧信",
        "preload": {
          "scene_id": "prologue_02b",
          "media": {
            "video_url": "https://media.example.com/macau/prologue_02b.mp4",
            "poster_url": "https://media.example.com/macau/prologue_02b.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 38000
          }
        }
      }
    ]
  },
  "clues": [],
  "progress": {
    "current_chapter": 1,
    "total_chapters": 6
  }
}
```

### 失败

- `404 STORY_NOT_FOUND`：故事不存在。
- `409 STORY_NOT_PUBLISHED`：故事存在但尚未发布。
- `503 STORY_NOT_READY`：已发布版本缺失或媒体未准备好。

## 4. 提交选择

`POST /api/v1/game/choice`

### 请求

```json
{
  "session_id": "a410105b-9d6b-4e11-aa4d-f9673835ece7",
  "scene_id": "prologue_01",
  "choice_id": "inspect_letter",
  "request_id": "78e1af97-d3b1-4813-b97b-c350762e5b66"
}
```

字段说明：

- `scene_id` 防止用户在旧页面提交已经过期的选择。
- `request_id` 由前端每次点击生成，用于网络重试和防重复推进。

### 成功响应：`200 OK`

```json
{
  "session_id": "a410105b-9d6b-4e11-aa4d-f9673835ece7",
  "status": "active",
  "story": {
    "id": "macau_mystery_01",
    "title": "跨越中葡的悬案",
    "version": 1
  },
  "scene": {
    "id": "prologue_02b",
    "type": "video",
    "chapter": {
      "id": "prologue",
      "title": "第一章：妈阁启程",
      "location": "妈阁庙"
    },
    "media": {
      "video_url": "https://media.example.com/macau/prologue_02b.mp4",
      "poster_url": "https://media.example.com/macau/prologue_02b.jpg",
      "mime_type": "video/mp4",
      "duration_ms": 38000
    },
    "choices": [
      {
        "id": "continue_search",
        "text": "继续追查",
        "preload": {
          "scene_id": "chapter_02_01",
          "media": {
            "video_url": "https://media.example.com/macau/chapter_02_01.mp4",
            "poster_url": "https://media.example.com/macau/chapter_02_01.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 41000
          }
        }
      }
    ]
  },
  "awarded_clues": [
    {
      "id": "letter_fragment",
      "title": "信件残片",
      "description": "一张与悬案有关的旧信残片。",
      "icon": "letter",
      "acquired_at": "2026-08-03T08:35:00Z"
    }
  ],
  "clues": [
    {
      "id": "letter_fragment",
      "title": "信件残片",
      "description": "一张与悬案有关的旧信残片。",
      "icon": "letter",
      "acquired_at": "2026-08-03T08:35:00Z"
    }
  ],
  "progress": {
    "current_chapter": 1,
    "total_chapters": 6
  }
}
```

`awarded_clues` 只包含本次新获得的线索；`clues` 包含当前会话全部线索。

### 到达结局

返回结构保持一致，但：

- `status` 为 `completed`。
- `scene.type` 为 `ending`。
- `scene.choices` 为空。
- 增加 `ending` 摘要。

```json
{
  "session_id": "a410105b-9d6b-4e11-aa4d-f9673835ece7",
  "status": "completed",
  "story": {
    "id": "macau_mystery_01",
    "title": "跨越中葡的悬案",
    "version": 1
  },
  "scene": {
    "id": "ending_good",
    "type": "ending",
    "chapter": {
      "id": "chapter_06",
      "title": "第六章：真相",
      "location": "大三巴牌坊"
    },
    "media": {
      "video_url": "https://media.example.com/macau/ending_good.mp4",
      "poster_url": "https://media.example.com/macau/ending_good.jpg",
      "mime_type": "video/mp4",
      "duration_ms": 65000
    },
    "choices": []
  },
  "ending": {
    "id": "ending_good",
    "code": "good"
  },
  "awarded_clues": [],
  "clues": [],
  "progress": {
    "current_chapter": 6,
    "total_chapters": 6
  }
}
```

### 幂等行为

- 相同 `session_id` 和 `request_id` 使用相同请求内容重试：返回第一次保存的推进结果，不重复推进。
- 相同 `request_id` 携带不同场景或选项：返回 `409 IDEMPOTENCY_CONFLICT`。
- 幂等记录检查必须先于 `SESSION_COMPLETED`、`STALE_SCENE` 和 `CHOICE_NOT_AVAILABLE` 判断。即使会话在第一次成功后已经继续推进或完成，合法重试仍返回第一次保存的原始响应快照。
- “相同请求内容”按 `session_id`、`scene_id` 和 `choice_id` 判断；同一会话内的 `request_id` 永久对应一次选择请求，至少保留到该会话按保留策略被整体清理。
- 第一次成功响应所需的下一节点、`awarded_clues`、当时的全部 `clues`、进度和结局摘要必须可从同一事务保存的数据稳定重建或直接保存，不能在重试时用会话的最新状态重新拼装。

已确认的数据库设计无需因此新增表；实现时可以使用对应 `choice_made` 事件的 `payload_json` 保存幂等响应快照或其完整重建信息。

### 失败

- `404 SESSION_NOT_FOUND`：会话不存在。
- `409 SESSION_COMPLETED`：会话已经结束。
- `409 STALE_SCENE`：请求中的 `scene_id` 不是当前节点。
- `409 CHOICE_NOT_AVAILABLE`：选项不属于当前节点。
- `409 IDEMPOTENCY_CONFLICT`：重复请求标识对应不同请求内容。
- `500 STORY_DATA_CORRUPTED`：会话绑定的已发布剧情数据异常。

## 5. 恢复游戏状态

`GET /api/v1/game/state/{session_id}`

浏览器从本地存储读取 `session_id` 后调用。成功响应与开始游戏的快照结构一致，不包含 `awarded_clues`。

### 成功响应：`200 OK`

```json
{
  "session_id": "a410105b-9d6b-4e11-aa4d-f9673835ece7",
  "status": "active",
  "story": {
    "id": "macau_mystery_01",
    "title": "跨越中葡的悬案",
    "version": 1
  },
  "scene": {
    "id": "prologue_02b",
    "type": "video",
    "chapter": {
      "id": "prologue",
      "title": "第一章：妈阁启程",
      "location": "妈阁庙"
    },
    "media": {
      "video_url": "https://media.example.com/macau/prologue_02b.mp4",
      "poster_url": "https://media.example.com/macau/prologue_02b.jpg",
      "mime_type": "video/mp4",
      "duration_ms": 38000
    },
    "choices": [
      {
        "id": "continue_search",
        "text": "继续追查",
        "preload": {
          "scene_id": "chapter_02_01",
          "media": {
            "video_url": "https://media.example.com/macau/chapter_02_01.mp4",
            "poster_url": "https://media.example.com/macau/chapter_02_01.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 41000
          }
        }
      }
    ]
  },
  "clues": [],
  "progress": {
    "current_chapter": 1,
    "total_chapters": 6
  }
}
```

已完成的会话仍返回结局节点和 `ending` 摘要。

### 失败

- `404 SESSION_NOT_FOUND`：会话不存在或已按保留策略清理。
- `500 STORY_DATA_CORRUPTED`：绑定的剧情版本无法解析。

## 6. 统一错误格式

所有业务错误返回：

```json
{
  "error": {
    "code": "STALE_SCENE",
    "message": "提交的场景不是当前游戏场景",
    "details": {
      "submitted_scene_id": "prologue_01",
      "current_scene_id": "prologue_02b"
    }
  }
}
```

要求：

- `code` 是稳定的英文机器码，前端依据它处理逻辑或翻译提示。
- `message` 是便于开发调试的中文说明，不作为前端唯一展示文案。
- `details` 只包含非敏感的诊断字段，没有明细时为 `{}`。
- Pydantic 请求校验失败统一适配为相同外层结构，状态码为 `422`，错误码为 `VALIDATION_ERROR`。
- 不向客户端返回 Python 堆栈、数据库语句、文件绝对路径或密钥。

## 7. 状态码约定

| HTTP 状态 | 使用场景                |
| ------- | ------------------- |
| `200`   | 查询或提交选择成功           |
| `201`   | 新游戏会话创建成功           |
| `404`   | 故事或会话不存在            |
| `409`   | 当前状态冲突、旧场景选择、重复请求冲突 |
| `422`   | 请求字段、类型或格式不合法       |
| `500`   | 已发布剧情数据损坏等内部异常      |
| `503`   | 故事媒体或已发布版本尚不可用      |

## 8. 无缝视频衔接的接口配合

1. 后端在当前场景响应中返回全部可选项及各自的 `preload.media`。
2. 前端在播放当前视频期间预加载候选视频，但不提前切换剧情状态。
3. 当前视频结束时，前端保持最后一帧并在其上显示选项。
4. 玩家点击后，前端提交包含 `scene_id` 和 `request_id` 的选择请求。
5. 等待响应期间继续保持上一视频末帧，不能清空播放器背景。
6. 后端返回权威下一节点后，前端立即播放已预加载的对应视频。
7. 如果返回目标与预加载提示不一致，以后端响应为准，并继续保持上一末帧直到新视频可播放。

后端负责尽早提供候选媒体 URL 和快速完成状态事务；末帧冻结、缓冲策略和播放器切换仍由前端负责。

## 9. 与当前接口的差异

当前 mock 接口返回扁平的 `chapter`、`location`、`narration`、`dialogue` 和 `choices`。新契约的主要变化：

- 场景统一放入嵌套 `scene` 对象。
- 移除首版运行不需要的 `narration` 和 `dialogue`。
- 增加视频 `media`、场景类型和选项预加载信息。
- `/game/choice` 新增必填 `scene_id` 和 `request_id`。
- 状态接口返回完整可恢复快照，而不是内部数组索引。
- 不存在的会话和故事使用正确 HTTP 错误，不再伪造一个 `unknown` 成功响应。

实现阶段需要同步调整 `frontend/src/lib/api.ts` 的类型适配，但不要求成员 C 修改游戏页面视觉或播放器组件。

## 10. 部署相关接口配置

- CORS 允许来源不能在生产环境继续写死为 localhost，应通过环境变量配置前端正式域名。
- 健康检查继续使用 `GET /api/v1/health`，只报告服务和数据库连接状态，不泄露配置。
- API 返回的视频 URL 必须能被最终浏览器直接访问，并正确配置跨域、缓存和 Range 请求。
- 大视频流量不经过 FastAPI 和 Railway 应用容器转发。

## 11. 评审结论

本契约已确认：

1. 开始、选择和恢复三个核心接口继续使用现有 URL，但升级响应结构。
2. `/game/choice` 强制携带 `scene_id` 和 `request_id`，防止旧页面和重复点击错误推进。
3. 每个选项响应中包含解析到下一可播放节点后的预加载信息。
4. 首版后端不再返回旁白和对白字段。
