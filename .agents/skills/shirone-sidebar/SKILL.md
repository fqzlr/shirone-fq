---
name: shirone-sidebar
description: 开发 Shirone 侧边栏系统、小组件、FAB 悬浮控件以及 Swup 持久外壳同步。在新增或配置侧边栏小组件、更改侧边栏排布或页面过滤、调整 FAB 项，或构建响应路由的外壳行为时使用。
---

# Shirone 侧栏 / FAB / Swup 持久壳

`src/components/organisms/SideBar.astro` 是纯编排容器:过滤(`enable`)→ 分栏(`column`)→ 分停靠位(`slot`)→ 经中央注册表 `componentMap` 透传配置给 widget。所有行为由 `src/config/sidebarConfig.ts` 驱动,类型在 `src/types/sidebarConfig.ts`。

## 核心红线

1. **widget 三标签 + 页面过滤**:每个 widget 条目携带 `enable`(必填)、`slot`(`top` 固定顶部 / `sticky` 跟随滚动,必填)、`column`(`primary`/`secondary`,仅双栏时生效);可选 `pages: SidebarPage[]` 控制只在指定页面显示,省略即全页显示(向后兼容)。widget 专属配置进 `SidebarWidget` 判别联合分支,不搞扁平大对象。
2. **页面标识符以 `SidebarPage` 为权威**:`home`、`archive`、`friends`、`moments`、`anime`、`compass`、`albums`、`about`、`categories`、`tags`、`post` 等;新增页面类时同步更新类型、侧栏过滤与相关测试。
3. **Swup 持久壳规则**:`#swup-container` 之外的元素(侧栏、TopAppBar、FAB、横幅等)不会被 Swup 重渲染。依赖当前路由的壳逻辑必须挂在 Swup 生命周期钩子(`content:replace` / `page:view`)或事件委托上;页面过滤读取 `#swup-container` 的 `data-current-page`,SSR 与 Swup 替换后都要成立。
4. **测试必须覆盖两条路径**:直接刷新加载 + Swup 站内导航,缺一不可。
5. **编排与宽度自动联动**:`arrangement: "single"`(默认,页框 85rem)/ `"dual"`(副栏接收 `column: "secondary"`,页框 96rem,≥1280px 生效,以下自动退化单栏);`side` 决定主栏物理侧。宽度由 `resolvePageWidth()` 自动解析,不提供手动覆盖。
6. **FAB 契约**:`src/config/fabConfig.ts` 的 item 支持 `devices` 设备矩阵(SSR 阶段直接输出响应式类,CLS=0)与 `pages` 过滤;评论按钮在评论系统关闭时 0 DOM;FAB 不集成音乐播放器。
7. **新增 widget**:遵循 `docs/common-components.md` 的新增 checklist,并阅读 `docs/sidebar-widgets.md` 的同类 widget 文档;可选 widget 关闭时遵循零额外负担(见 `shirone-feature` 技能)。

## 必读文档

- `docs/sidebar-system.md` — 编排模型、三标签、页面过滤、Swup 同步
- `docs/sidebar-widgets.md` — 内置 widget 逐个文档与配置形状
- `docs/fab-system.md` — FAB 与移动端悬浮目录架构、设备矩阵
- `docs/common-components.md` — 新增可复用组件/侧栏 widget 流程(§3.1 checklist)
- `src/pages/AGENTS.md` — 页面层规则(thin route、SidebarPage、持久壳测试)
- `src/config/sidebarConfig.ts` — 侧栏编排配置
- `src/types/sidebarConfig.ts` — `SidebarPage` / `SidebarWidget` 权威类型

## 验证命令

`npx.cmd astro check` → 相关分片(`tests/site/fab-navigation.spec.ts`、`tests/site/toc.spec.ts`、widget 对应 spec)+ `tests/site/a11y.spec.ts` → 涉及壳状态时补 Swup 导航断言;改配置排布后跑 `tests/site/post-list.spec.ts`/相关页面 spec 确认布局。
