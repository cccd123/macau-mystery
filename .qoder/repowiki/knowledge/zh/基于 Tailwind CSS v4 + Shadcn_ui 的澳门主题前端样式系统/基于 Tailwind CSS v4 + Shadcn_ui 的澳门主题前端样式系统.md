---
kind: frontend_style
name: 基于 Tailwind CSS v4 + Shadcn/ui 的澳门主题前端样式系统
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/app/globals.css
    - frontend/postcss.config.mjs
    - frontend/components.json
    - frontend/package.json
    - frontend/src/app/layout.tsx
    - frontend/src/components/ui/button.tsx
---

## 样式体系概览

该前端项目采用 **Tailwind CSS v4（PostCSS 插件模式）+ Shadcn/ui 组件库** 的组合，通过 CSS 变量构建「澳门历史城区」主题色板，并配合 `tw-animate-css` 提供动画能力。

## 核心架构与文件

- **全局样式入口**：`src/app/globals.css` 是唯一的样式集中地，使用 `@import "tailwindcss"`、`@import "tw-animate-css"`、`@import "shadcn/tailwind.css"` 引入依赖，并通过 `@theme inline` 将 CSS 变量映射到 Tailwind 设计令牌。
- **PostCSS 配置**：`postcss.config.mjs` 仅启用 `@tailwindcss/postcss`，无额外插件，保持极简。
- **Shadcn/ui 配置**：`components.json` 声明 style 为 `base-nova`、RSC/TSX 模式、图标库为 `lucide`、别名映射到 `@/components`、`@/lib/utils` 等路径。
- **字体**：`layout.tsx` 通过 `next/font/google` 加载 Geist Sans 和 Geist Mono，并以 CSS 变量 `--font-geist-sans` / `--font-geist-mono` 暴露给 Tailwind。

## 设计令牌与主题

`globals.css` 中通过 `:root` 和 `.dark` 两套 CSS 变量定义完整色板，围绕「澳门蓝瓷砖（azulejo）」文化意象：
- 主色 `--primary: #1a8a6e`（翡翠绿）、辅助 `--accent: #e0edf6`（天青）、强调 `--destructive: #c44536`（漆红）、金色 `--brass: #c9942e`、石灰白 `--limestone: #f0e8d8`。
- 所有颜色通过 `--color-*` 映射到 Tailwind 令牌，支持暗色模式切换。
- 圆角统一由 `--radius` 控制，派生 `--radius-sm/md/lg/xl/2xl/3xl/4xl`。

## 组件样式策略

- **基础 UI 组件**位于 `src/components/ui/`，每个组件使用 `class-variance-authority`（cva）定义 variant 和 size，通过 `clsx` + `@/lib/utils` 的 `cn()` 合并类名。
- 以 `button.tsx` 为例：按钮变体（default/outline/secondary/ghost/destructive/link）和尺寸（default/xs/sm/lg/icon/*）全部通过 cva 声明，className 由 `cn(buttonVariants({ variant, size, className }))` 组合。
- 自定义业务组件（如 `choice-panel.tsx`、`clue-card.tsx`、`dialogue-box.tsx` 等）直接在 JSX 中使用 Tailwind 原子类，不单独建 CSS 文件。

## 动画与视觉特效

`globals.css` 内自建一组 keyframes 与工具类：
- 浮动动画：`animate-float`、`animate-float-slow`、`animate-float-delayed`
- 光晕脉冲：`animate-pulse-glow`、`animate-hero-gradient`
- 入场动画：`animate-fade-in-up`、`animate-slide-in-left`、`animate-scale-in`
- 延迟阶梯：`.delay-100` ~ `.delay-1000`
- 纯 CSS 图案：`.azulejo-bg`、`.azulejo-pattern` 模拟蓝瓷砖纹理
- 毛玻璃：`.glass`（含暗色适配）
- 鼠标跟随：`.cursor-glow`、`.cursor-tile`、`.cursor-tile-sm` 三个固定定位层
- 按钮闪烁：`.btn-shimmer` 伪元素渐变扫光
- 卡片悬浮提升：`.card-hover`

## 响应式与布局约定

- 根布局 `layout.tsx` 设置 `lang="zh-CN"`、`antialiased`、`h-full`，body 使用 `min-h-full flex flex-col bg-background text-foreground`。
- 页面级容器通过 Tailwind 的 `container mx-auto px-4` 居中。
- 未使用传统 `tailwind.config.js`，而是依赖 Tailwind v4 的 CSS 内 `@theme` 声明来扩展设计令牌。

## 约束与规范

- 样式集中管理于 `globals.css`，组件级样式通过 Tailwind 原子类 + cva 变体实现，避免散落的 CSS 模块。
- 主题色完全通过 CSS 变量驱动，新增颜色需同时更新 `:root` 和 `.dark` 两套变量，并在 `@theme inline` 中映射。
- Shadcn/ui 组件遵循 `data-slot` 语义标记，便于后续样式覆盖。
- 动画统一使用 `tw-animate-css` 提供的工具类或自建的 `animate-*` 类，避免在组件内硬编码 animation 属性。