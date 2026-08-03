# 沉浸式短剧剧情 JSON 数据契约

- 文档状态：已确认
- 版本：1.0
- 更新日期：2026-08-03
- 对应数据库设计：`01-database-design.md` 1.0
- 适用范围：第一阶段预制视频分支短剧

## 1. 契约目标

本契约是剧本编写、视频交付和后端状态机之间的边界：

- 剧本人员决定章节、选项、跳转、线索和结局条件。
- 视频人员为可播放节点提供视频和海报资源。
- 后端负责校验数据、执行分支、记录线索和返回可播放节点。
- 前端不解析条件路由，也不自行决定下一剧情。

首版 JSON 只描述运行游戏所需的数据。视频内的旁白、对白、字幕和文字剧情不属于后端必填字段。

## 2. 标识符规范

`story_id`、章节、场景、选项和线索标识统一使用：

- 小写英文字母开头。
- 后续只包含小写字母、数字和下划线。
- 建议长度为 2 至 64 个字符。
- 示例：`macau_mystery_01`、`prologue_01`、`letter_fragment`。
- 标识符一旦进入已发布版本便不修改；需要替换内容时发布新版本。

场景 ID 在整个故事内唯一，不能只保证章内唯一。选项 ID 在所属场景内唯一。

## 3. 根对象

```json
{
  "schema_version": 1,
  "story_id": "macau_mystery_01",
  "title": "跨越中葡的悬案",
  "description": "沿澳门六个景点步行，破解历史悬案。",
  "entry_scene": "prologue_01",
  "chapters": [],
  "clues": {}
}
```

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `schema_version` | 是 | integer | 首版固定为 `1` |
| `story_id` | 是 | string | 稳定故事标识 |
| `title` | 是 | string | 故事名称 |
| `description` | 否 | string | 故事简介 |
| `entry_scene` | 是 | string | 开始游戏时的首个可播放节点 |
| `chapters` | 是 | array | 按剧情顺序排列的章节 |
| `clues` | 是 | object | 按线索 ID 索引的线索定义；没有线索时为 `{}` |

## 4. 章节对象

```json
{
  "id": "prologue",
  "title": "第一章：妈阁启程",
  "location": "妈阁庙",
  "gps": {
    "lat": 22.1867,
    "lng": 113.5318
  },
  "scenes": []
}
```

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | 是 | string | 章节标识 |
| `title` | 是 | string | 章节名称 |
| `location` | 是 | string | 当前澳门景点名称 |
| `gps` | 否 | object | 为未来定位功能预留；首版不用于解锁剧情 |
| `scenes` | 是 | array | 本章包含的全部节点，包括不可见路由节点 |

章节数组顺序用于展示六个景点的总体进度，但剧情实际推进只依据场景跳转关系。

## 5. 场景类型

首版支持三种场景：`video`、`ending` 和 `router`。

### 5.1 `video`：普通可播放节点

```json
{
  "id": "prologue_01",
  "type": "video",
  "media": {
    "status": "ready",
    "video_url": "https://media.example.com/macau/prologue_01.mp4",
    "poster_url": "https://media.example.com/macau/prologue_01.jpg",
    "mime_type": "video/mp4",
    "duration_ms": 42000
  },
  "choices": [
    {
      "id": "ask_history",
      "text": "询问妈阁庙的历史",
      "next_scene": "prologue_02a",
      "grant_clues": []
    },
    {
      "id": "inspect_letter",
      "text": "调查那封旧信",
      "next_scene": "prologue_02b",
      "grant_clues": ["letter_fragment"]
    }
  ]
}
```

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | 是 | string | 全故事唯一场景标识 |
| `type` | 是 | string | 固定为 `video` |
| `media` | 是 | object | 当前节点媒体资源 |
| `choices` | 是 | array | 视频结束后显示的选项 |

普通节点建议提供 2 至 3 个选项，但后端不把上限写死。所有从入口可达的 `video` 节点必须至少有一个选项，否则玩家会停在一个未声明为结局的节点。只需要自动进入下一段剧情时可以配置一个选项，由前端以“继续”形式展示；真正无交互的条件跳转应使用 `router`。

### 5.2 `ending`：结局节点

```json
{
  "id": "ending_good",
  "type": "ending",
  "ending_code": "good",
  "media": {
    "status": "ready",
    "video_url": "https://media.example.com/macau/ending_good.mp4",
    "poster_url": "https://media.example.com/macau/ending_good.jpg",
    "mime_type": "video/mp4",
    "duration_ms": 65000
  },
  "choices": []
}
```

结局节点可以播放结局视频，但 `choices` 必须为空。`ending_code` 为必填标识符并遵循第 2 节命名规范；同一故事内建议保持唯一。后端把结局节点返回给前端时即将游戏会话标记为 `completed`。

### 5.3 `router`：不可见条件路由节点

```json
{
  "id": "final_clue_router",
  "type": "router",
  "routes": [
    {
      "priority": 10,
      "when": { "min_clue_count": 5 },
      "next_scene": "ending_good"
    },
    {
      "priority": 20,
      "when": { "min_clue_count": 3 },
      "next_scene": "ending_normal"
    },
    {
      "priority": 999,
      "when": { "default": true },
      "next_scene": "ending_bad"
    }
  ]
}
```

`router` 不包含媒体和选项，也不会返回前端。后端按 `priority` 从小到大检查规则，命中第一条后继续解析，直到得到 `video` 或 `ending` 节点。

要求：

- `priority` 在同一路由节点内唯一。
- 必须且只能有一条 `{ "default": true }` 规则。
- 默认规则优先级必须最低，即数字最大。
- 非默认规则必须包含至少一个受支持的条件字段，不允许空对象或未知字段。
- 路由链不能形成循环。
- 后端设置最大内部跳转次数，防止错误数据导致无限解析。

## 6. 媒体对象

```json
{
  "status": "ready",
  "video_url": "https://media.example.com/macau/prologue_01.mp4",
  "poster_url": "https://media.example.com/macau/prologue_01.jpg",
  "mime_type": "video/mp4",
  "duration_ms": 42000
}
```

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `status` | 是 | string | `placeholder` 或 `ready` |
| `video_url` | 是 | string | 视频访问地址；发布环境应使用 HTTPS |
| `poster_url` | 是 | string | 首帧或宣传帧图片地址，用于加载和失败回退 |
| `mime_type` | 是 | string | 首版建议统一为 `video/mp4` |
| `duration_ms` | 否 | positive integer | 视频时长，毫秒 |

约定：

- 开发期允许 `placeholder` 媒体；演示版本发布前应全部变为 `ready`。
- 后端和数据库不保存视频二进制。
- 视频文件名建议与场景 ID 一致。
- `poster_url` 不是选项界面的背景切换机制；选项出现时保持视频末帧由前端播放器实现。
- 当前节点返回时，后端会计算各选项的下一可播放节点，并在 API 中提供预加载媒体信息。

## 7. 选项对象

```json
{
  "id": "inspect_letter",
  "text": "调查那封旧信",
  "next_scene": "prologue_02b",
  "grant_clues": ["letter_fragment"]
}
```

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | 是 | string | 所属场景内唯一 |
| `text` | 是 | string | 由剧本人员编写的玩家可见文案 |
| `next_scene` | 是 | string | 下一节点，可以指向可播放节点或 `router` |
| `grant_clues` | 是 | string array | 选择后获得的线索；没有时使用空数组 |

首版不在选项中执行任意脚本、Python 表达式或字符串条件。

处理选择时，后端先以幂等方式发放 `grant_clues`，再使用发放后的完整线索集合解析 `next_scene` 之后可能出现的 `router`。API 的预加载目标也必须按同一顺序模拟计算，保证正常情况下预加载提示与实际推进结果一致。

## 8. 线索对象

```json
{
  "letter_fragment": {
    "title": "信封内页残字",
    "description": "某年春，自妈阁启程",
    "icon": "letter"
  }
}
```

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `title` | 是 | string | 线索名称 |
| `description` | 是 | string | 线索说明 |
| `icon` | 否 | string | 前端图标键，不直接存 emoji 或图片二进制 |

同一会话内同一线索只发放一次。重复经过相关分支不会产生重复线索记录。

## 9. 条件对象

路由规则的 `when` 支持以下字段：

```json
{
  "min_clue_count": 3,
  "all_clues": ["letter_fragment", "stone_inscription"],
  "any_clues": ["family_seal", "old_photo"]
}
```

语义：

- `min_clue_count`：已获得线索总数不少于指定值。
- `all_clues`：列表中的线索必须全部获得。
- `any_clues`：列表中至少获得一项。
- 同一条件对象出现多个字段时，各字段组之间采用“并且”。
- `{ "default": true }` 只能单独作为默认规则，不能与其他条件组合。
- `min_clue_count` 必须是大于等于 1 的整数。
- `all_clues` 和 `any_clues` 必须是非空、无重复的线索 ID 数组，且每个 ID 都必须在根级 `clues` 中定义。
- 非默认条件对象不得为空，也不得包含本节未定义的字段。

首版不支持数值属性、概率随机、任意代码表达式和基于真实 GPS 的条件。

## 10. 完整最小示例

```json
{
  "schema_version": 1,
  "story_id": "macau_mystery_demo",
  "title": "澳门悬案演示",
  "description": "用于验证分支、汇合、线索和多结局。",
  "entry_scene": "scene_start",
  "chapters": [
    {
      "id": "chapter_01",
      "title": "第一章：妈阁庙",
      "location": "妈阁庙",
      "gps": { "lat": 22.1867, "lng": 113.5318 },
      "scenes": [
        {
          "id": "scene_start",
          "type": "video",
          "media": {
            "status": "placeholder",
            "video_url": "https://media.example.com/demo/scene_start.mp4",
            "poster_url": "https://media.example.com/demo/scene_start.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 10000
          },
          "choices": [
            {
              "id": "inspect",
              "text": "检查旧信",
              "next_scene": "scene_merge",
              "grant_clues": ["letter_fragment"]
            },
            {
              "id": "ignore",
              "text": "直接离开",
              "next_scene": "scene_merge",
              "grant_clues": []
            }
          ]
        },
        {
          "id": "scene_merge",
          "type": "video",
          "media": {
            "status": "placeholder",
            "video_url": "https://media.example.com/demo/scene_merge.mp4",
            "poster_url": "https://media.example.com/demo/scene_merge.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 10000
          },
          "choices": [
            {
              "id": "reveal_truth",
              "text": "揭晓真相",
              "next_scene": "ending_router",
              "grant_clues": []
            }
          ]
        },
        {
          "id": "ending_router",
          "type": "router",
          "routes": [
            {
              "priority": 10,
              "when": { "all_clues": ["letter_fragment"] },
              "next_scene": "ending_good"
            },
            {
              "priority": 999,
              "when": { "default": true },
              "next_scene": "ending_bad"
            }
          ]
        },
        {
          "id": "ending_good",
          "type": "ending",
          "ending_code": "good",
          "media": {
            "status": "placeholder",
            "video_url": "https://media.example.com/demo/ending_good.mp4",
            "poster_url": "https://media.example.com/demo/ending_good.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 10000
          },
          "choices": []
        },
        {
          "id": "ending_bad",
          "type": "ending",
          "ending_code": "bad",
          "media": {
            "status": "placeholder",
            "video_url": "https://media.example.com/demo/ending_bad.mp4",
            "poster_url": "https://media.example.com/demo/ending_bad.jpg",
            "mime_type": "video/mp4",
            "duration_ms": 10000
          },
          "choices": []
        }
      ]
    }
  ],
  "clues": {
    "letter_fragment": {
      "title": "信件残片",
      "description": "一张与悬案有关的旧信残片。",
      "icon": "letter"
    }
  }
}
```

## 11. 导入和发布校验结果

校验工具应返回结构化结果：

```json
{
  "valid": false,
  "errors": [
    {
      "code": "MISSING_SCENE_TARGET",
      "path": "chapters[0].scenes[0].choices[2].next_scene",
      "message": "目标场景 prologue_photo 不存在"
    }
  ],
  "warnings": [
    {
      "code": "UNREACHABLE_SCENE",
      "path": "chapters[0].scenes[4]",
      "message": "该场景无法从 entry_scene 到达"
    }
  ]
}
```

错误会阻止发布；警告允许发布，但必须展示给维护人员。

发布校验至少还必须保证：

- `entry_scene` 指向 `video` 节点。
- 每个从入口可达的 `video` 节点至少有一个选项。
- 每个 `router` 都满足默认规则、优先级和条件字段约束，且所有可能路由结果最终解析为 `video` 或 `ending`。
- 从入口可达的每个节点都至少存在一条通向 `ending` 的路径；完全无法结束的可达分支应作为错误，而不是警告。
- 所有 `ending` 节点包含合法 `ending_code`，所有条件引用和 `grant_clues` 引用均指向已定义线索。

“澳门六景点、共六章”属于本项目正式内容的发布验收条件，不写死在通用状态机或 JSON Schema 中；本文件的一章最小示例仍可用于自动化测试。

## 12. 与现有 JSON 的迁移关系

现有 `macau_mystery_01.json` 可保留以下内容：

- `script_id` 改名为 `story_id`。
- `chapters`、章节 `location`、`gps`、场景 `id` 和 `choices` 结构继续使用。
- 单个 `clue_reward` 转换为 `grant_clues` 数组。
- 根级 `clues` 定义继续使用。

需要调整：

- 增加 `schema_version` 和 `entry_scene`。
- 为每个场景增加 `type` 和 `media`。
- 把根级字符串结局条件改为 `router` 和结构化条件。
- 补齐所有不存在的跳转目标和其余五章。
- 正式运行不依赖 `narration`、`dialogue`、`photo_triggers` 和章节 `transition`；如内容团队仍需保存这些生产资料，应放在独立制作稿中，不作为首版状态机必填字段。

## 13. 评审结论

本契约已确认：

1. 使用 `video`、`router`、`ending` 三种节点。
2. 线索条件只支持计数、全部拥有和任一拥有三种结构化规则。
3. 正式运行 JSON 不要求旁白、对白、字幕和照片识别触发器。
4. 普通节点建议提供 2 至 3 个选项，但后端只强制可达 `video` 节点至少有一个选项，不设置固定上限。
