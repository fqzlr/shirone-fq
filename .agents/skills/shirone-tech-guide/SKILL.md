---
name: shirone-tech-guide
description: Shirone 博客主题的综合技术指南与交叉引用参考 - 架构、组件分层、内容系统、内容分离、数据/媒体模块、性能、部署与开发约定。在审查、扩展、维护或自定义主题，需要权威内部概览以及任务对应的 docs/rules/源码文件时调用。
---

# Shirone 技术解读与开发指导

Shirone 是 Astro 7 + Svelte 5 + Tailwind 4 + Stylus + pnpm 的 M3E 博客主题。本技能是**任务化总入口**:把"做某类任务该读哪些权威文档、守哪些红线、看哪份源码"收敛成摘要。**全量细节与交叉引用见 `docs/tech-guide.md`**,正文不复制其内容,只维护摘要与入口。

## 触发入口

- 先读 `docs/tech-guide.md`,它是后续开发迭代、功能扩展、内容维护的技术指导真源。
- 按具体任务再转给专项技能(见 `.agents/skills/README.md` 技能清单),本技能不含任何可执行步骤。

## 十二条主线速览

1. **总览与设计理念**:M3E、动态配色、Swup 切页、零额外负担、行为与内容分层、内容分离生态。
2. **技术栈与工程骨架**:Astro 7 + Svelte 5 Runes + Tailwind 4 + Stylus + TS,SSG + Swup + Pagefind。
3. **整体架构**:`src/` 七模块(`components/config/content/layouts/pages/data/utils`),分层 `atoms → molecules → organisms → templates → pages`,SSR 优先。
4. **前端界面与交互**:M3E CSS 令牌(`--m3e-*`)、多主题动态配色、响应式,原子清单权威在 `src/components/atoms/manifest.json`。
5. **内容创作体系**:`src/content.config.ts` 的 posts/moments/spec/friends 集合,frontmatter schema、草稿、加密。
6. **内容分离与双仓协同**:`shirone.content.json` 源/挂载/YAML 覆盖,与 `scripts/content/` CLI。
7. **数据与媒体模块**:friends/compass/anime/projects/skills/devices/timeline 等数据页与相册。
8. **性能优化与构建**:本地图标精灵、中文字体子集化、Pagefind 索引、预算校验。
9. **部署方案**:`INDEX.md` 分层与标准部署流程。
10. **开发规范与最佳实践**:命名、注释、提交约定、`npx.cmd astro check` 门禁。
11. **潜在扩展方向**:新集成按零额外负担红线评估。
12. **附录**:命令速查与配置清单。

## 红线(改任何架构/组件/路由/数据管道前必读)

1. **零额外负担**:可选功能关闭时零外部请求、零 DOM 足迹、零打包膨胀、向后兼容。
2. **关注点分离**:配置管行为/开关,数据管内容实体。
3. **原子化依赖方向**:低层不反向引用高层,无循环依赖,跨层用 `@components/<layer>/<file>`。
4. **SSR 优先**:纯 SSR 用 `astro-icon`,交互才加 `client:*`。

## 必读文档链

- `docs/tech-guide.md` — 本技能承载的完整技术指导(十二章节)
- `AGENTS.md` — 仓库总纲
- `docs/atomic-structure.md`、`docs/m3e-standard.md` — 组件分层与 M3E 标准
- `src/content.config.ts`(集合 schema)、`src/config/README.md` — 配置契约
- `docs/markdown-extensions.md` 等 — 针对具体模块的权威文档

## 校验

修改本技能或 `docs/tech-guide.md` 后用 `pnpm.cmd check:manifest` 验证技能结构与路径引用一致。