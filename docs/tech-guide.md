# Shirone 博客系统技术解读与开发指导文档

> 本文档基于 Shirone 官方文档站点（https://docs.shirone.mysqil.com/）全面解读，并结合本地主题仓库 `f:\blog\Shirone` 的内部实现细节（`docs/`、`rules/`、`AGENTS.md`、源码）交叉验证形成，作为后续**开发迭代、功能扩展、内容维护**的技术指导。所有代码引用均为本地仓库实际文件。
>
> 适用范围：主题维护与二开（改架构、组件、路由、数据管道、Markdown 语法）、独立定制与部署、日常内容维护。
> 版本基线：Astro 7 + Svelte 5 + Tailwind CSS 4 + Stylus + TypeScript，pnpm（锁定 `pnpm@9.14.4`），Node ≥ 22.12。

---

## 目录

1. [总览与设计理念](#一总览与设计理念)
2. [技术栈与工程骨架](#二技术栈与工程骨架)
3. [整体架构设计](#三整体架构设计)
4. [前端界面与交互规范](#四前端界面与交互规范)
5. [内容创作体系](#五内容创作体系)
6. [内容分离与双仓协同](#六内容分离与双仓协同)
7. [数据与媒体模块](#七数据与媒体模块)
8. [性能优化与构建](#八性能优化与构建)
9. [部署方案](#九部署方案)
10. [开发规范与最佳实践](#十开发规范与最佳实践)
11. [潜在扩展方向](#十一潜在扩展方向)
12. [附录：命令速查与配置清单](#十二附录命令速查与配置清单)

---

## 一、总览与设计理念

Shirone 是一个基于 **M3E（Material 3 Expressive）规范**、富有表现力的现代化二次元个人静态博客主题，核心设计理念贯穿"性能、可访问性、内容分层"。

### 1.1 核心特性

| 特性 | 说明 |
|---|---|
| **动态配色** | 基于 HCT 色彩空间与 Material Color Utilities，支持从横幅壁纸实时提取主题色；内置 8 大调色板与 25+ 颜色角色 |
| **平滑切页** | 基于 Swup 的无刷新 SPA 切页，外围应用框架（音乐播放器、侧边栏）状态不中断 |
| **内容排版扩展** | Expressive Code 增强代码块、KaTeX 数学公式、Mermaid 图表、提示容器、标签页、时间线、媒体画廊等 15+ 扩展语法 |
| **零额外负担** | SSR 优先、键盘导航无障碍；可选功能关闭时零外部请求、零 DOM 占位、零打包体积占用 |
| **行为与内容分层** | 配置管理行为与开关，数据管理内容实体，杜绝配置与内容混杂 |
| **内容分离生态** | 主题代码与独立内容仓库解耦，配合 YAML 覆盖层与 CLI 工具链平滑升级 |

### 1.2 四条贯穿全篇的红线（来自 AGENTS.md）

1. **零额外负担（zero extra burden）**：可选功能（评论、分析、音乐、番剧等）在 `enable:false` 或省略时，必须做到——零外部网络请求、零 DOM 足迹/布局位移、零 npm 打包膨胀（仅动态加载）、完全向后兼容（无需大规模改既有内容 frontmatter）。这是判断任何新集成分支合并的第一标准。
2. **关注点分离（SoC）**：行为/开关（`src/config/*Config.ts`）与内容实体（`src/data/*.ts`、`src/content/`）严格分离。
3. **原子化依赖方向**：`atoms → molecules → organisms → templates → pages`；低层禁止反向引用高层，禁止循环依赖，跨层用 `@components/<layer>/<file>` 别名。
4. **SSR 优先**：纯 SSR 路径用 `astro-icon` 直出、禁止额外水合；需要交互才加 `client:load / client:visible / client:only="svelte"`。

### 1.3 模块定位

- **主题代码** = 房屋框架、水电管线、施工体系（交互/明暗模式/响应式/图片转码/构建流水线），由维护者公开演进。
- **博主内容** = 家具、照片、书籍、日记（文章/说说/相册/资料/配置覆盖），由博主全权掌控，可私有。
- 二者可放在**同一仓库**（默认单仓）或**双仓解耦**（推荐长线博客，见第六章）。

---

## 二、技术栈与工程骨架

### 2.1 技术栈

- 框架：**Astro 7**（内容驱动、岛屿架构、静态构建）
- 交互组件：**Svelte 5**（Runes 响应式，`toContent` 全局）
- 样式：**Tailwind CSS 4** + **Stylus**（预处理器）+ M3E CSS 变量
- 语言：**TypeScript**（严格模式）+ 部分 `.mjs` 构建脚本
- 包管理：**pnpm 9.x**（锁定 `pnpm@9.14.4`）
- 服务端渲染：纯静态（SSG）；切页：**Swup**；搜索：**Pagefind**（WASM 本地全文字）
- 图标：**Iconify**（构建期离线提取为本地 SVG 精灵），`astro-icon` SSR 渲染

### 2.2 根目录架构

- `public/`：纯静态资源（favicon、自定义字体、robots.txt 等，原样发布）
- `src/`：核心源码（见 2.3）
- `scripts/`：自动化构建与离线同步脚本
  - `content/`：内容分离 CLI（sync/validate/status/export/clean/eject/overlay）
  - `fonts/`：中文字体子集化与预算校验
  - `icons/`：本地图标生成
  - `images/`：说说缩略图生成
  - `anime/`：Bangumi/Bilibili 追番同步
  - `perf/`、`lighthouse/`：性能度量
  - 另有 `check-design.mjs`、`check-manifest.mjs`、`check-markdown-manifest.mjs`、`new-post.js`、`package-skills.mjs` 等
- `astro.config.mjs`：Astro 顶层配置（集成 Swup、icon、Expressive Code、Svelte、sitemap、MDX；Markdown processor）
- `svelte.config.js`：Svelte 5 编译器配置（启用 Runes）
- `tsconfig.json`：路径映射与严格模式
- `package.json`：依赖与脚本命令；`pnpm-lock.yaml`：锁版本
- `docs/`、`rules/`：内部实现文档与工程规则（主题开发专用），其中本文档 `docs/tech-guide.md` 为全站技术解读汇总

### 2.3 `src/` 七大核心模块

| 模块 | 职能 | 关键文件 |
|---|---|---|
| `components/` | UI 组件库（原子/分子/有机体/系统/外壳） | `atoms/manifest.json` 为原子清单权威 |
| `config/` | 集中化强类型配置（25+ 个文件） | `siteConfig.ts`、`sidebarConfig.ts`、`musicConfig.ts`、`animeConfig.ts` 等，`README.md` 为契约 |
| `content/` | 内容层（posts/moments/spec/friends） | 集合定义在 `content.config.ts`（见 5.1） |
| `layouts/` | 页面骨架布局 | `MainLayout.astro`（HTML 壳/SEO/Swup 容器/动态配色）、`PostLayout.astro`（TOC/评论/版权） |
| `pages/` | 文件系统路由 | `[...page].astro`、`[...permalink].astro`、`posts/[...slug].astro`、`albums/[id]/index.astro`，以及 `about/anime/friends/projects/compass/devices/moments/skills/timeline/tags/categories/archive/albums` 等，另有 `rss.xml.ts`、`atom.xml.ts`、`llms.txt.ts`、`robots.txt.ts` |
| `styles/` | 设计系统 | `tokens.css`（M3E Token）、`typography.css`、`animation.css` |
| `utils/` | 业务工具库 | `crypto`/`post-encryption`/`post-decryption`（加密）、`color.ts`（壁纸取色）、`music/*`（播放器）、`motion.ts`（动效原语）、`markdown-*`（Markdown 运行时）、`config-overlay.ts`、`password-protection.ts` 等 |

另有 `src/i18n/`（十个语言包 + 翻译逻辑）、`src/data/`（结构化数据实体）、`src/integration/`（npm 打包/用户项目适配，见 10.5）、`src/assets/`（构建期处理的静态资源）。

### 2.4 构建产物（`dist/`）

`pnpm build` 后生成完全静态的解耦产物：

- `_astro/`：带内容 hash 的 JS/CSS chunk
- `pagefind/`：Pagefind 全文索引（WASM 运行时 + 倒排索引块）
- `posts/…`：预渲染文章 HTML
- `rss.xml`、`atom.xml`：订阅源；`sitemap-index.xml`：SEO 索引；`llms.txt`：LLM 友好摘要
- `index.html`：首页

---

## 三、整体架构设计

### 3.1 配置驱动模型

全站行为收敛在 [src/config/index.ts](file:///f:/blog/Shirone/src/config/index.ts) 与各 `*Config.ts`，每个配置通过 `withUserConfig("<domain>", {...默认值})` 包裹（见 [src/utils/config-overlay.ts](file:///f:/blog/Shirone/src/utils/config-overlay.ts)），支持单仓默认值与双仓 YAML 覆盖的深合并。

以 `siteConfig` 为例（[src/config/siteConfig.ts](file:///f:/blog/Shirone/src/config/siteConfig.ts)）典型字段：

| 字段 | 默认 | 说明 |
|---|---|---|
| `site` | 演示站 | 正式域名，影响 RSS/Sitemap/OG |
| `base` | `/` | 子目录部署时修改 |
| `title` / `subtitle` | Shirone / — | 顶栏标题与 SEO 副标题 |
| `lang` | `en` | 界面语言（内置 10 种，见 2.3 i18n） |
| `timeZone` | `Asia/Shanghai` | IANA 时区，决定文章/瞬间精确时间 |
| `toc` | 启用、depth 2 | 右侧目录深度（1~3） |
| `progressIndicator.style` | `dual` | 顶部阅读进度条样式 |
| `favicon` | `[]` | 数组，空则用默认 |
| `enableSwup` / `enablePagefind` | true | SPA 切页与全文搜索开关 |

> **口诀**：开关/排序/凭据 → `src/config/*Config.ts`；具体展示条目 → `src/data/*.ts`；单个配置项停用可用 `disabledKeys`。

### 3.2 配置分层规则

- `src/config/*Config.ts`：主题默认 + 强类型约束，消费时禁止硬编码。
- `src/data/*.ts`：结构化数据（friends、projects、skills、devices、timeline、compass、music、anime 本地快照等），由页面/有机体消费。
- 内容仓 `config/*.yaml`：仅写要覆盖的键（**对象递归深合并，数组整体替换**），自动编译为 `src/user/user-config.ts` 桥接文件。

### 3.3 内容层

内容集合由 [src/content.config.ts](file:///f:/blog/Shirone/src/content.config.ts) 用 `astro:content` + Zod 定义，含 `posts`、`spec`、`moments` 三类（双仓模式下由 [src/integration/collections.ts](file:///f:/blog/Shirone/src/integration/collections.ts) 的 `defineCollections()` 按内容目录/挂载生成）。数据加载、校验、排序在构建期完成，运行时纯 SSR 预渲染。

### 3.4 组件体系与依赖方向

Shirone 采用 **Atomic Design** 分层（本地聚类见 [src/components/](file:///f:/blog/Shirone/src/components/)，AGENTS.md 亦有权威说明）：

- **Atoms（原子）**：最小交互/展示单元，单向消费 Design Tokens，严禁业务实体逻辑与网络回源。`atoms/` 下按职责再分 `action/`、`input/`、`selection/`、`display/`、`feedback/`、`navigation/`、`overlay/`、`blog/`。
- **Molecules（分子）**：简单组合结构（卡片、搜索条、面包屑、分页等）。
- **Organisms & Shell（有机体/外壳）**：具备完整业务功能的状态聚合体（AnimeSection、MomentSection、TopAppBar、SideBar、MusicSidebar 等），负责数据编排、i18n 注入、Swup 事件同步。
- **System（系统运行时）**：全局基础设施（`ConfigCarrier.astro` 注入全局数据属性、`GlobalStyles.astro`、动态色引擎、`UmamiRuntime.astro`）。

**依赖方向（必须遵守）**：原子可组合原子；分子可组合原子与同层分子；有机体可组合低层 + 自己显式拥有的小有机体；模板组合组件；页面组合模板。低层不 import 高层，避免循环；跨层用 `@components/<layer>/<file>` 别名。

### 3.5 渲染模型与 SSR 边界

| 场景 | 技术栈 | 契约 |
|---|---|---|
| 静态展示组件（文章卡片、元数据、侧栏容器、页脚、标签列表） | `.astro`（SSR 直出） | 零运行时 JS、SEO 友好 |
| 交互控制组件（按钮、输入框、播放器、弹窗、滑块、搜索面板） | `.svelte`（Svelte 5 Runes） | 按需水合：`client:load / client:idle / client:visible / client:only="svelte"` |

> Svelte 中沿用文件既有写法（Runes 或 legacy），**禁止在一个组件里混用两种模式**；条件类名与作用域未使用 CSS 分析冲突时用模板字面量 class，其余保留合法的 `class:` 指令。

### 3.6 Swup 生命周期与持久外壳同步

- 持久外壳（TopAppBar、SideBar、音乐播放器、明暗切换、FAB）位于 `#swup-container` 之外，**切页不会被销毁重建**。
- 对路由敏感的组件必须在 `$effect` 中绑定事件并返回清理函数；主动监听 `swup:content:replace` 与 `swup:page:view` 同步数据。
- 文章内嵌小组件需隔离在容器 DOM 内，不依赖跨页全局可变状态（零状态残留）。
- 侧栏 widget 渲染读取 `#swup-container` 的 `data-current-page` 做页面过滤（SSR 与客户端导航后均需生效）。参见 [src/components/organisms/SideBar.astro](file:///f:/blog/Shirone/src/components/organisms/SideBar.astro)。

---

## 四、前端界面与交互规范

### 4.1 M3E 设计 Token（详见 [docs/m3e-standard.md](file:///f:/blog/Shirone/docs/m3e-standard.md)）

**全部组件严禁硬编码 `px`、十六进制色值或非标准圆角**，必须引用 CSS 变量：

- **动态色彩（HCT）**：`--primary` / `--on-primary` / `--primary-container` / `--on-primary-container`；`--secondary*`；`--surface` / `--surface-container[-low/-high/-highest]`；`--on-surface` / `--on-surface-variant` / `--outline` / `--outline-variant`。
- **圆角**：`--shape-corner-xs`(4) / `-s`(8) / `-m`(12 默认卡片/控件) / `-l`(16 FAB) / `-xl`(28 弹窗) / `-full`(9999 胶囊)。
- **阴影（Elevation）**：`--m3e-elevation-1` ~ `-5`（Level1~5）。
- **动效**：`--m3e-duration-*`、`--m3e-easing-*`；固定黑白仅限图片叠加可读性等文档化例外。

### 4.2 状态层 `.m3-state-layer`

所有交互控件（按钮、卡片、列表项、选项卡）统一继承状态层：`:hover` 不透明度 0.08、`:focus-visible` 0.12、`:active` 0.12，配合 `--m3e-state-color`。

### 4.3 组件 API 全览

> 以下组件均在 [src/components/](file:///f:/blog/Shirone/src/components/) 下。所有支持 `$bindable()` 的 props（`open`、`checked`、`value`、`query`、`activeId`、`selectedId` 等）可双向绑定。

#### 操作与交互原子（action/）
- **Button.svelte**：五种变体 `filled|elevated|tonal|outlined|text`；五种尺寸；`href` 时自动渲染为原生 `<a>`；`icon` 用 Iconify 格式（如 `material-symbols:add-rounded`）。
- **IconButton.svelte**：`variant: standard|filled|tonal|outlined`；`toggle` 开关型；`selected` 激活态；`ariaLabel` 无障碍必填。
- **FAB.svelte**：`lowered` 降高；传 `label` 自动变 Extended FAB。
- **Chip.astro / Chips.svelte**：前者静态胶囊零 JS，后者做多选/单选过滤栏（`multiple`、`onchange`）。
- 另有 `SplitButton`、`ToggleButton`、`FABMenu`、`FloatingToolbar`、`ButtonGroup`。

#### 输入与选择原子（input/、selection/）
- **TextField.svelte**：`filled|outlined`、浮动标签、首尾图标、`errorMessage` 触发红色错误态、`maxlength` 字数计数器。
- **Select.svelte**：单选、键盘上下键导航。
- **SearchBar.svelte**：防抖（`debounceMs` 默认 200）、快捷键（`/` 或 `Ctrl+K`）、一键清空。
- **Switch.svelte**：M3 Thumb/Track 几何，可选内嵌图标。
- **Slider.svelte**：连续/离散、`showIndicator` 数值气泡。
- **SegmentedButton / Checkbox / RadioButton / Autocomplete / DatePicker 系列**。

#### 展示与反馈原子（display/、feedback/）
- **Card.svelte**：`filled|elevated|outlined`，按 `href`/`onClick` 智能渲染为 `<a>`/`<button>`/`<div>`。
- **Avatar.svelte**：懒加载、失败文字降级、`glow` 动态光效。
- **Icon.svelte / MetaIcon.astro**：前者离线渲染器（严禁运行时向外部 API 发请求），后者服务端静态直出零 JS。
- **Badge / BadgedBox**：`max` 超限显示 `99+`、`dot` 小红点。
- **Skeleton / LoadingIndicator（异形变形加载器）/ ProgressIndicator（线/环、确定/不确定）**。

#### 导航与浮层原子（navigation/、overlay/）
- **Menu.svelte**：锚点定位、键盘导航、`destructive` 项。
- **Tabs.svelte**：CSS 变量计算滑动指示线。
- **Dialog / AlertDialog**：M3 28px 圆角 + Level3 阴影；打开锁定焦点、Esc 关闭、锁 body 滚动。
- **Snackbar / Tooltip / BottomSheet / NavigationDrawer**。

#### 博客专用原子（blog/）
多数为 Astro 纯 SSR 零 JS：
- **PostCard.astro**：封面裁剪、置顶徽标、加密锁定提示、分类标签、悬浮动效。
- **PostMeta.astro**：日期/分类/字数/阅读时长元信息条。
- **TocList.astro**：IntersectionObserver 当前标题高亮、平滑锚点。
- **TagBadge / TagList / CategoryList**：计数、多彩色调。
- **PagePagination.astro**：分页折叠导航。
- **SearchPanel.svelte**：Pagefind 全文搜索、实时分词高亮、键盘选择、直达跳转。

#### 有机体与外壳（organisms/、system/）
- **TopAppBar.astro**：滚动 > 60px 切半透明表面 + 毛玻璃（blur 12px）+ Level2 阴影。
- **SideBar.astro**：按 `sidebarConfig` 动态装配 Profile/音乐/分类/标签/公告/统计等 widget；禁用部件 Tree-shake。
- **MusicSidebar(.astro) + MusicSidebarClient.svelte**：Swup 容器外的全局音频单例，跨页连续播放；`mixed` 容灾（本地秒开 + 异步扩容云端）；Media Session API。
- **UmamiStats.astro / UmamiRuntime.astro**：公开统计展示 + 全局请求池拦截 Swup 路由刷新。
- **DisplaySettings.svelte**：HCT 种子色/壁纸模糊/字号调节；**LightDarkSwitch.svelte**：明暗切换。
- **ContextMenu.svelte**：右键增强（复制/分享/回顶/随机文章/夜间切换）。
- **RouteProgress.svelte**：Swup 顶部加载进度条。
- **System**：`ConfigCarrier.astro` 注入 `data-hue`、`data-wallpaper-mode`、`data-texture-*` 等全局属性。

### 4.4 无障碍与动效

- 键盘可达：交互控件支持 Tab/Esc/方向键；`ariaLabel` 必填场景。
- `prefersReducedMotion()` 必须被尊重（[src/utils/motion.ts](file:///f:/blog/Shirone/src/utils/motion.ts)：`fadeOutThenHide`、`flipFromRect`、`revealIn`、`collapse`）。
- 状态层 / 焦点可见性（`:focus-visible`）。

---

## 五、内容创作体系

### 5.1 Frontmatter Schema（权威以 [src/content.config.ts](file:///f:/blog/Shirone/src/content.config.ts) 为准）

文章位于 `src/content/posts/`，支持 Markdown/MDX。常用字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | 标题 |
| `published` | date | 是 | 发布日期，参与排序展示 |
| `publishedAt` | datetime | 否 | 精确时间戳（同日多篇排序/时区/固定链接占位符） |
| `updated` / `updatedAt` | date | 否 | 更新时间，触发"最后更新"提示 |
| `pinned` | boolean | 否 | 置顶 |
| `draft` | boolean | 否 | 草稿（生产不发布，dev 可见） |
| `comment` | boolean | 否 | 单篇关闭评论 |
| `description` | string | 否 | 摘要（缺省回退正文截取） |
| `image` | string | 否 | 封面（相对/`public` 绝对/远程 URL） |
| `tags` | array | 否 | 标签（可多，自动聚合） |
| `category` | string | 否 | 分类（唯一，自动聚合） |
| `lang` | string | 否 | 文章语言（不影响界面语言） |
| `encrypted` | boolean | 否 | 标记加密文章 |
| `password` | string/number | 否 | **设置即隐式启用加密**，加密时必须非空 |
| `passwordHint` | string | 否 | 密码提示 |
| `hideHomeContent` | boolean | 否 | 加密文章在首页/归档/RSS 隐藏摘要与字数 |
| `alias` / `permalink` | string | 否 | 文章别名与自定义固定链接 |

**内容集合**：`posts`、`spec`（`about/friends` 等页面文案）、`moments`（说说，含 `mood`、`location`、`images[]`、`pinned`、`draft`）。

**图片路径三种写法**：相对路径 `./cover.webp`（推荐，可走构建优化）· 绝对路径 `/images/x.webp`（相对 `public`，原样输出）· 远程 URL（原样引用）。

**时间与时区**：`published`/`publishedAt`/`updated` 按站点 `timeZone` 解释；纯日期视为 UTC 00:00 不跨日；同日多篇可用完整时间戳精准控制；日期字段用约定格式，避免混用字符串与 `Date`。

### 5.2 两种文章组织模式

- **文件夹方案（推荐）**：`2026-09-01-slug/` 内含 `index.md` + 伴生 `cover.webp`/`diagram.png`/`snippet.ts`，资源自包含、相对路径引用、无孤儿文件。
- **单文件方案**：`2026-08-31-hello.md`，适合图片外链托管的轻量场景。

可用 `pnpm new-post my-first-post` 脚手架生成（见 [scripts/new-post.js](file:///f:/blog/Shirone/scripts/new-post.js)）。文件名为 URL slug，建议英文短横线。

### 5.3 Markdown / MDX 扩展语法

原生支持 CommonMark + GFM；并有 `markdown-syntaxes.mjs` / `markdown-source-syntaxes.mjs` / `markdown-processor.mjs`（[src/utils/](file:///f:/blog/Shirone/src/utils/)）驱动的 15+ 扩展语法。涉及自定义 Markdown 处理前必读 [docs/markdown-extensions.md](file:///f:/blog/Shirone/docs/markdown-extensions.md)、[docs/markdown-on-demand-loading.md](file:///f:/blog/Shirone/docs/markdown-on-demand-loading.md) 与 [docs/markdown-syntax-manifest.md](file:///f:/blog/Shirone/docs/markdown-syntax-manifest.md)。

常用扩展：
- **提示容器/admonitions、标签页 tabs、步骤 steps、文件树、代码树、GitHub 卡片、缩写、脚注标注、剧透 spoilers、数学公式 KaTeX、Mermaid 图表**。
- **属性扩展**：`[链接](url){target="_blank" rel="noopener"}`、`==高亮=={.secondary}`、`## 标题 {#custom-id}`、`` `code`{.badge}``。
- **图片网格**：`::: grid{columns="3" aspect="16/9" fit="cover"} … :::`；单图宽度 `![alt w-60%](./architecture.webp "图题")`。
- **视频门面**：`::bilibili{bvid="BV1GJ411x7h7" part=1}`（点击后才建 iframe）。
- **原生 HTML**：`<kbd>`、`<details>`、`<div style=...>` 等。

> 修改/新增/退役任何自定义作者语法前，必须同步维护 Markdown 语法清单与 manifest（[docs/markdown-syntax-manifest.md](file:///f:/blog/Shirone/docs/markdown-syntax-manifest.md)），并在 npm 包模式下注册（见 10.5）。

### 5.4 客户端文章加密（Web Crypto API）

- **标准**：密钥派生 PBKDF2-SHA-256（OWASP 标准 **310,000 次迭代**）；认证加密 **AES-256-GCM**。
- **AAD 作用域绑定**：载荷绑定 `shirone-protected-content:1:${slug}`，防密文跨文章重放。
- **零明文**：构建产物仅含 Base64 密文与 IV，不含明文密码或正文；遗忘密码无法恢复（零知识）。
- **Fail-Closed**：`encrypted:true` 但 `password` 空 → 构建抛错 `Encrypted posts require a non-empty password`。
- **RSS/Atom 脱敏**：加密文章标题加 `🔒`，正文/摘要替换为占位提示。
- **会话解锁记忆**：解密成功后当前浏览器会话内保持。
- 实现相关：`post-encryption.ts`、`post-decryption.ts`、`password-protection.ts`、`protected-session.ts`；组件 `EncryptedContent.astro` / `PasswordGate.svelte` / `ProtectedPost.svelte` / `ProtectedAlbum.svelte`（[src/components/organisms/](file:///f:/blog/Shirone/src/components/organisms/)、[src/utils/](file:///f:/blog/Shirone/src/utils/)）。

---

## 六、内容分离与双仓协同

### 6.1 概念与收益

把**主题代码仓**（公开演进）与**个人内容仓**（私有可托管）解耦，博主像使用无头 CMS 一样写作，同时无缝跟随主题主线更新。核心收益：主题升级零冲突、保护草稿/相册私密内容、专注创作轻量维护。单仓 vs 双仓选型对比：

| 维度 | 单仓（起步） | 双仓（推荐） |
|---|---|---|
| 适用人群 | 极简起步 | 长期写作、需保护私密、频繁跟随更新 |
| 主题升级 | 手动拉上游可能冲突 | 拉上游即可，零合并冲突 |
| 私密性 | 开源则草稿公开 | 内容仓私有 |
| 写作工具 | 主题工程内 | Obsidian/VS Code/Typora 独立打开 |

### 6.2 Shirone-Content 标准结构

- `config/*.yaml`：全站声明式配置覆盖（site/profile/nav-bar/sidebar/font/anime/music/comment/article/post-list/devices/projects/skills/timeline/friends/announcement/expressive-code/fab/image-bloom/license/llms/umami/footer）+ `footer.html` 自定义页脚碎片。
- `content/posts`、`content/moments`、`content/spec`：原创文章/说说/页面文案。
- `data/*.ts`：结构化数据实体（anime/compass/devices/friends/music/projects/skills/timeline）。
- `public/assets`（番剧封面与媒资缓存）、`public/images`（博客图片与相册）、`public/albums`（相册目录 `01.webp` + `info.json`）。
- `shirone.content.json`：内容源协议、挂载映射、文件保护白名单。
- `.github/workflows/trigger-build.yml.example`：跨仓触发模板。

**映射与同步保护规则**：
- `assets/` 与 `public/` 保持标准相对路径映射，图片路径无需转换（构建期 `assets/` 参与压缩，`public/` 原样发布）。
- `config/*.yaml` 同步时自动编译为带类型约束的 `src/user/user-config.ts`。
- 系统目录（`.git/`、`.github/`、`.vscode/`、`.scripts/`、`README.md`）不被同步。
- 派生资源（说说缩略图缓存、番剧封面缓存、中文字体子集产物）受白名单保护不被误删/覆盖。

### 6.3 初始化

- **方式一：`content:eject` 一键迁出**（已有主题代码仓）：自动提取文章/动态/相册/数据实体、生成 `shirone.content.json` 与触发工作流；仅导出核心身份标识（site/profile）；在代码仓 `.gitignore` 追加并取消 Git 跟踪；未带 `--yes` 时为只读预演。
  ```bash
  pnpm.cmd content:eject                 # 预演
  pnpm.cmd content:eject --yes           # 执行，默认上级 ../shirone-content
  pnpm.cmd content:eject --yes --out "<路径>"
  ```
  （Windows 用 `pnpm.cmd`；Linux/macOS 用 `pnpm`）
- **方式二：从模板克隆**：克隆 `LyraVoid/Shirone-Content` 后改 remote 与私有仓。
- 建仓必须 **Private**（保护草稿/相册原图/私密配置），不勾选任何初始化选项。

### 6.4 配置覆盖机制（config-overlay）

- **最小化覆盖**：YAML 只写要定制的字段，未声明字段继承主题默认；升级平滑。
- **对象递归合并**（嵌套对象）：如 `site.banner.homeText.typewriter.speed`。
- **数组整体替换**（`nav-bar.yaml`、`sidebar.yaml`、`profile.links`、`site.favicon`、`font.yaml`、`context-menu.yaml`、各 `categories`/`groups`）需列全所有条目。
- **类型纠错**：`pnpm content:validate` 内存预检，报错并推测正确字段（如 `Did you mean "title"?`）。
- **自动桥接**：`content:sync`/构建时生成 `src/user/user-config.ts`，自动完成图标离线化与站点文字送字体子集化。

### 6.5 `shirone.content.json` 清单

```json
{
  "schemaVersion": 1,
  "source": { "type": "path", "path": "../shirone-content" },
  "mounts": { "content": "src/content", "data": "src/data", "assets": "src/assets", "public": "public" },
  "keep": ["src/data/my-special-data.ts"],
  "prune": true
}
```

字段：`schemaVersion`（默认 1）、`source.type`（`path`/`git`）、`source.path` / `source.url`/`source.ref`、`mounts`（自定义挂载映射）、`keep`（受保护白名单，支持 `*`/`**`）、`prune`（false 时仅增量拷贝不删除）。

**环境变量优先级**：进程环境 > `.env.local` > `.env` > `shirone.content.json`。
`CONTENT_DIR`（本地内容路径）、`CONTENT_REPO_URL`（远端 Git）、`CONTENT_REPO_REF`（默认 `main`）、`SHIRONE_CONTENT_SYNC=0`（临时回退单仓）、`CONTENT_SYNC_PULL=false`（离线复用缓存副本）。

### 6.6 CLI 工具链（详见 [scripts/content/](file:///f:/blog/Shirone/scripts/content/)）

| 命令 | 功能 | 典型时机 |
|---|---|---|
| `pnpm content:sync` | 单次全量/增量同步（mtime 或 Git commit 增量）；`--clean-temp` 全量强制 | 本地预览前、CI 构建物化 |
| `pnpm content:watch` | 实时增量监听，改 YAML 自动重生成 TS 桥接热重载 | 外部编辑器边写边看 |
| `pnpm content:validate` | 内存安全预检（零写盘），给行号与建议字段 | 提交 Git 前必跑 |
| `pnpm content:status` | 只读状态/差异：内容源、配置清单、远端 SHA、新旧程度 | 排查 |
| `pnpm content:export` | 差异反向导出（最小化覆盖，只导相对默认修改的键） | 代码仓调试好的配置回流 |
| `pnpm content:clean` | 安全重置，自动快照备份到 `.content-backup/clean-<时间戳>/` | 还原演示态 |
| `pnpm content:eject` | 一键单仓→双仓迁出 | 升级 |

通用 flags：`--dry-run`、`--verbose`、`--force`、`--json`。

### 6.7 双仓 CI/CD 接线

- 内容仓生成 **Fine-grained PAT**（Repository access=仅主题仓，Repository permissions → Contents = **Read and write**），存入内容仓 Secret（**Name 必须为 `DISPATCH_TOKEN`**）。
- 内容仓 `.github/workflows/trigger-build.yml` 用 `peter-evans/repository-dispatch@v3` 向主题仓派发 `event-type: content-update`。
- 主题仓 `.github/workflows/deploy.yml` 监听 `repository_dispatch: types: [content-update]`，`pnpm/action-setup@v3`（version 9）、`setup-node@v4`（node 20 + cache）、`pnpm install --frozen-lockfile`、`pnpm content:sync && pnpm build`，用 `CONTENT_REPO_URL=https://x-access-token:${{ secrets.CONTENT_ACCESS_TOKEN }}@github.com/<owner>/<repo>.git` 拉私有内容，`peaceiris/actions-gh-pages@v4` 发布 `dist`。
- Deploy Hook 集成（Cloudflare/Vercel/EdgeOne）见内容分离的 deploy-hooks 章节。

---

## 七、数据与媒体模块

> 原则：**运行时绝不请求第三方 API**。番剧/音乐等仅在**离线同步阶段**拉取并落成快照/缓存，页面运行时与生产构建只消费本地产物。

### 7.1 Bangumi 追番同步

- 配置 `animeConfig`（[src/config/animeConfig.ts](file:///f:/blog/Shirone/src/config/animeConfig.ts)）：`enable`、`source.kind: "snapshot"`、`fallback.kind: "local"`（回退 `src/data/anime.ts`）、`providers.bangumi.{enable, userId, request:{pageSize≤100, maxItems, minDelayMs}}`。
- 端点（基址 `https://api.bgm.tv`，需合规 UA）：收藏 `GET /v0/users/{userId}/collections?subject_type=2&type=&limit=&offset=`；详情 `GET /v0/subjects/{subjectId}`（6 并发分批）。
- 转换：标题优先 `name_cn` 回退 `name`；制作公司从 `infobox` 检索；评分优先个人 `rate` 回退社区 `score`；集数 `ep_status`。
- 执行 `pnpm anime:sync --provider bangumi` -> 快照 `src/data/anime-snapshots/bangumi.json`。
- 排错：404 → 检查 `userId`；429 → 调大 `minDelayMs`。

### 7.2 Bilibili 追番同步 + 视频门面

- 配置：`providers.bilibili.{enable, vmid, sessdataEnv(默认 "BILI_SESSDATA"), cover:{mode:"local",useWebp:true}, request:{pageSize≤50,minDelayMs}}`。
- 端点 `GET https://api.bilibili.com/x/space/bangumi/follow/list`（桌面 UA + `Referer` + 可选 `Cookie: SESSDATA`）；`code:0` 成功，`53013/-401` 需 SESSDATA（追番私密）。
- 封面防盗链：`cover.mode:"local"` 下载到 `public/assets/anime/covers/bili_{id}.webp`。
- 视频门面：见 5.3 `::bilibili`，点击后懒建 iframe。
- **凭据安全**：SESSDATA 有完整会话权限，勿提交 `.env` 到公开仓库。入口 [scripts/anime/sync.mjs](file:///f:/blog/Shirone/scripts/anime/sync.mjs)。

### 7.3 Meting 音乐

- 配置 `musicConfig`（[src/config/musicConfig.ts](file:///f:/blog/Shirone/src/config/musicConfig.ts)）：`provider: "local"|"meting"|"custom"|"mixed"`、`meting.{server: netease|tencent|kugou|xiami|baidu, type: playlist|song|album|artist, id}`、`defaultVolume`、`defaultMode`。
- URL 模板 `{api}?server=:server&type=:type&id=:id&auth=:auth&r=:r`；默认公共端点 `https://api.injahow.cn/meting/`（建议自建，CORS 需 `Access-Control-Allow-Origin: *`）。
- 清洗 `parseMetingSong`：ID 规范化 `meting-${server}-${id}`、`duration>10000` 毫秒转秒、按重复 ID 去重、输出只读 `TrackDescriptor`。
- **mixed 模式（推荐）**：优先本地 `src/data/music.ts` 秒开 → 后台异步合并云端 → 超时静默降级。实现见 [src/utils/music/](file:///f:/blog/Shirone/src/utils/music/)。

### 7.4 Umami 统计

- 配置 `umamiConfig`（[src/config/umamiConfig.ts](file:///f:/blog/Shirone/src/config/umamiConfig.ts)）：`shareUrl`（公开统计读 PV/UV）、`websiteId`+`scriptUrl`（采集上报）。`enable:false` 全关零加载；只配 `shareUrl` 仅读。
- 底层 npm 包 `oddmisc` 客户端；`window.oddmisc: getSiteStats/getPageStats/getActiveVisitors`；就绪事件 `oddmisc-ready`。
- 高可用：内存 + `localStorage` 双层缓存（TTL 1h）、并发请求合并、监听 Swup 事件。
- 错误类型：`UmamiUrlError / UmamiAuthError(401) / UmamiNetworkError / UmamiTimeoutError(10s)`。

### 7.5 相册与其它数据型模块

- **相册（albums）**：数据型页面（非配置覆盖体系），由照片目录 + `info.json` 元数据驱动，支持加密相册（`ProtectedAlbum`）。路由 `src/pages/albums/[id]/index.astro`。
- **叙事数据模块**：友链（`FriendSection`、`config/friends.yaml` 分组）、罗盘（`CompassSection`）、项目（`ProjectSection`、`config/projects.yaml`）、技能（`SkillSection`、`config/skills.yaml`）、设备（`DeviceSection`、`config/devices.yaml`）、时间线（`TimelineSection`、`config/timeline.yaml`）、说说（`MomentSection`/`moments` 集合）。相互开启可框架部分为分子卡片（`molecules/`）后由有机体编排。
- 远程数据契约遵循 [docs/remote-data-system.md](file:///f:/blog/Shirone/docs/remote-data-system.md)（如需新增远程源，按 shirone-feature 的零负担契约做远程数据 + 按需加载）。

---

## 八、性能优化与构建

### 8.1 七阶段生产流水线（`pnpm build`）

| 阶段 | 脚本 | 职责 |
|---|---|---|
| 1 内容同步 | `scripts/content/sync.mjs` | 双仓同步 + Frontmatter/`config/*.yaml` 强类型校验 |
| 2 本地图标 | `scripts/icons/generate-local-icons.mjs` | 提取 Iconify 图标，离线生成 SVG 精灵 |
| 3 缩略图 | `scripts/images/generate-moment-thumbnails.mjs` | Sharp 生成低分辨率占位 + WebP，缓存纵横比防 CLS |
| 4 字体裁剪 | `scripts/fonts/subset-fonts.mjs` | 扫描 Markdown/i18n/配置/Meting 文本，20MB+ → 300-800KB |
| 5 静态渲染 | `astro build` | 编译模板 + TailwindCSS v4，预渲染 Svelte 5 为零 JS HTML |
| 6 搜索索引 | `pagefind --site dist` | 生成分片 WASM 搜索索引 |
| 7 字体预算 | `scripts/fonts/check-fonts.mjs` | 校验不超 `budget.maxTotalBytes` |

> **勿裸跑 `astro build`**：会跳过 content 同步、图标、缩略图、字体子集化与 Pagefind 索引。

### 8.2 中文字体子集化

- 配置 `fontConfig`（[src/config/fontConfig.ts](file:///f:/blog/Shirone/src/config/fontConfig.ts)）：`mode: "custom"|"system"`、`subsetting.{enable, includeContent, includeI18n, includeConfig, includeCommon, allowRemoteText}`（`allowRemoteText` 用于 Meting 歌单）、`budget.{maxTotalBytes: 6MB, maxFamilyBytes: 4MB}`。
- `pnpm dev` 跳过子集化（保留完整字体保 HMR）；`pnpm build` 全量。
- 实测（100 篇 + 50 瞬间）：首屏字体 24.5MB → ~520KB（-97.9%）、构建 45s → 12.8s、FCP 1.8 → 0.3s、LCP 3.2 → 0.6s、CLS 0.18 → 0.002、Lighthouse 68 → 100。
- ⚠️ 发布含**新生僻字**的文章必须重跑 `pnpm build`，否则新字回退系统字体。禁用自定义字体：`mode:"system"` + `fontFamilies:[]`（构建 < 5s）。

### 8.3 其它优化

- **Tonal Bloom**：构建期 Sharp 提取宽高比 + HCT 主色，客户端占位色块淡入，CLS 稳定。
- **Zero-JS SSR**：除播放器/设置面板/评论外，正文/目录/分类/时间线均纯静态 HTML（首屏仅几十 KB）。
- **按需/惰性加载**：可选功能动态加载，避免主包膨胀（遵循 [docs/on-demand-loading.md](file:///f:/blog/Shirone/docs/on-demand-loading.md)）。
- **资产管道**：图片/图标/字体统一走构建期处理（[docs/asset-pipeline.md](file:///f:/blog/Shirone/docs/asset-pipeline.md)、[docs/font-system.md](file:///f:/blog/Shirone/docs/font-system.md)）。

### 8.4 排错

- `JavaScript heap out of memory` → `NODE_OPTIONS="--max-old-space-size=4096"`。
- 缺 pagefind 目录 → 勿裸跑 `astro build`。
- Stylus/Svelte 变更不生效 → 清 `node_modules/.vite` 与 `.astro` 重启；Markdown/rehype 变更 → 清 `.astro/data-store.json` 重启。

---

## 九、部署方案

所有平台统一：Node ≥ 22.12（设 `NODE_VERSION=22`）、构建命令 `pnpm build`、输出目录 `dist`；`preinstall` 钩子 `only-allow pnpm`，npm 构建会失败。

### 9.1 通用前置

- `src/config/siteConfig.ts` 设好 `site`（正式域名）与 `base`。
- 双仓模式追加环境变量 `CONTENT_REPO_URL`（私有仓格式 `https://x-access-token:<TOKEN>@github.com/<owner>/<repo>.git`）。

### 9.2 Cloudflare Pages

- 构建命令 `pnpm build`、输出 `dist`、`NODE_VERSION=22`（默认镜像过旧否则必然失败）。
- Git 集成：`Workers & Pages → Pages → Connect to Git`，生产分支 `main`。
- 或本地 `wrangler` CLI：`wrangler login; pnpm build; wrangler pages deploy dist --project-name=<name>`（CLI 不耗构建额度）。
- 自定义域名：CNAME 指向 `<name>.pages.dev`。缓存策略默认合理，可在 `public/_headers` 覆盖：
  ```
  /assets/*    Cache-Control: public, max-age=31536000, immutable
  /pagefind/*  Cache-Control: public, max-age=86400
  ```

### 9.3 Vercel

- Git 集成：Framework Preset=Astro，Build=`pnpm build`，Output=`dist`，Install=`pnpm install`，Env `NODE_VERSION=22`。
- CLI：`vercel init → vercel --prod`；被问"override settings"选 `N`。
- 自定义域名：加 `A`（`76.76.21.21`）或 `CNAME`（`cname.vercel-dns.com`）。
- 构建超时可开缓存或用 Actions 构建后 `vercel deploy dist --prod`；自建 pipeline 勿漏 `dist/pagefind/`。

### 9.4 EdgeOne Pages（腾讯云，国内推荐）

- 框架预设 `Astro` 或静态网站；构建 `pnpm build`（必须显式）、输出 `dist`、Node 22。
- 未备案走海外/边缘节点，备案后可启用国内加速节点。新式 `pnpm` 过旧则 `corepack enable && pnpm build` 或固定 `PNPM_VERSION=9`。

### 9.5 Netlify

- 控制台导入或 `netlify.toml`：
  ```toml
  [build]
    command = "pnpm build"
    publish = "dist"
  [build.environment]
    NODE_VERSION = "22"
  ```
- CLI：`netlify init`（自动生成 toml、加部署密钥）→ `netlify deploy --build --prod`。
- 非生产分支与 PR 自动生成预览。产物体积限制：注意 `public/` 勿误放大图。

### 9.6 Docker

多阶段构建：构建阶段 Node22 + pnpm 全量 `pnpm build`；运行阶段仅 Nginx + 静态产物，镜像 < 50MB。

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- `.dockerignore`：`.git`、`node_modules`、`dist`、`.astro`、`docs`、`tests`、`scripts`、`public/assets/moments/thumbnails` 等。
- `nginx.conf`：`gzip on`；`/assets/` `expires 1y immutable`；`/pagefind/` `expires 24h`；`try_files $uri $uri/ =404;`。
- ⚠️ 内存：字体子集化 + Pagefind 峰值高，至少 4GB（`--memory=4g`）。
- 构建/运行：`docker build -t shirone-blog .` → `docker run -d --name shirone-blog -p 8080:80 --restart unless-stopped shirone-blog`；Compose `docker compose up -d --build`。
- 反代与 HTTPS：宿主机 Nginx/Caddy 反代 8080。评论（Twikoo 等）建议独立容器，Nginx 区分路径。

---

## 十、开发规范与最佳实践

### 10.1 命名与目录规范

- 组件按原子/分子/有机体分目录；原子按职责分子目录（`atoms/{action,input,selection,display,feedback,navigation,overlay,blog}`）。
- 跨层引用用 `@components/<layer>/<file>` 别名；禁止跨层反向依赖与循环。
- 原子/分子不得直接查询 Astro 集合或自持浏览器持久化；路由状态/`localStorage`/持久外壳同步归有机体或专用工具并有显式运行时契约。

### 10.2 注释与文案规范

- 配置与关键源码配**中文注释**说明默认值与意图。
- **禁止硬编码用户可见文案**：使用 `src/i18n/i18nKey.ts` 与十种语言模块（en/es/id/ja/ko/th/tr/vi/zh_CN/zh_TW），参数化字符串在所有语言保持一致的 `{placeholder}`。涉及界面文案变更先读 `rules/ai-skills.md` 与 i18n 相关文档。

### 10.3 Commit 约定

- 使用常规提交：`type(scope): subject`（`feat/fix/test/docs/refactor/chore` 等）。
- 提交前必须通过验证门禁。

### 10.4 验证门禁

- `npx.cmd astro check`：必须 0 错误。
- `pnpm.cmd exec biome ci ./src`：只读检查（`pnpm lint`/`pnpm format` 含 `--write`，勿作只读）。
- `pnpm type-check`；`pnpm check:manifest`；`pnpm build`。
- 页面/组件改动跑最小 Playwright 片段 + `tests/site/a11y.spec.ts`；样式中英文（Stylus/Svelte）出现陈旧则清缓存。
- 等待主题初始化（`--mc-primary`）与 `onload-animation` 收敛后再断言计算样式/无障碍。

### 10.5 npm 包双模式契约（`shirones`）

- 主题亦以 npm 包形式发布；`src/integration/` 重建 `astro.config.mjs` 供用户项目使用。
- 任何主题改动必须保持源码模式与包装模式同时可用：改动镜像进 `src/integration/`、避免 `process.cwd()` 读取主题自有文件、在 manifest 注册 Markdown 语法、遵循 overlay 规则。
- 涉及即读 [docs/npm-package-mode.md](file:///f:/blog/Shirone/docs/npm-package-mode.md)、[docs/packaging-contract.md](file:///f:/blog/Shirone/docs/packaging-contract.md)、`rules/project-rules.md` §12。

### 10.6 其它红线

- 可选/第三方集成遵循零额外负担契约；新增远程数据源/新配置域按 shirone-feature 的"配置-数据分离"展开。
- 修改架构/组件/路由/数据管道前，先读对应 `rules/` 与 `docs/`；UI/视觉改动必读根 `DESIGN.md` 与 [docs/m3e-standard.md](file:///f:/blog/Shirone/docs/m3e-standard.md)。
- `research/` 仅供参考，禁止拷贝其 schema/命名/算法/布局，禁止在 research 检出中编辑构建。

---

## 十一、潜在扩展方向

1. **新增组件**：在 `atoms/` 对应职责子目录添加原子（遵循 Token/状态层/SSR 边界），在 `atoms/manifest.json` 登记后由分子/有机体编排；无硬编码样式文案。
2. **新增自定义 Markdown 语法**：在 [docs/markdown-syntax-manifest.md](file:///f:/blog/Shirone/docs/markdown-syntax-manifest.md) 登记，按插件注册顺序接进 `markdown-processor.mjs`，内容驱动按需加载，并在 npm 包模式 manifest 注册（参照 5.3 / 10.5）。
3. **新增数据源模块**：仿 Bangumi/Meting 模式——离线同步落快照 + 运行时只读快照 + `fallback` 本地 + 失败保留上一份有效快照；若为可选远程源，遵循零负担/按需加载（[docs/remote-data-system.md](file:///f:/blog/Shirone/docs/remote-data-system.md)）。
4. **新增配置域/可选集成**：新增 `src/config/xxConfig.ts` + `withUserConfig` + 内容仓 `config/xx.yaml` 覆盖 + 10 大语言文案 + 零负担开关；镜像到 `src/integration/`。
5. **增强可访问性**：键盘导航/焦点管理/`prefers-reduced-motion`；新增组件补齐 `ariaLabel`/状态层/焦点锁。
6. **性能与字体**：扩展元字字形裁剪覆盖源（新模块文本纳入 collector），继续压低 CLS/LCP；接入更多构建期静态优化。
7. **双仓/CI 增强**：Deploy Hook（Cloudflare/Vercel/EdgeOne）、更多平台、内容预览环境、增量缓存策略。

---

## 十二、附录：命令速查与配置清单

### 12.1 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 启动开发服务器（含内容同步、图标、缩略图、字体的预处理） |
| `pnpm new-post <file>` | 创建新文章脚手架 |
| `pnpm format` / `pnpm exec biome ci ./src` | 格式化（含 --write） / 只读检查 |
| `pnpm check` / `pnpm type-check` | astro 诊断 / TS 检查 |
| `pnpm test` | Playwright 测试 |
| `pnpm build` | 七阶段生产构建 + Pagefind 索引 |
| `pnpm preview` | 预览生产构建 |
| `pnpm content:sync/watch/validate/status/export/clean/eject` | 内容分离 CLI |
| `pnpm anime:sync --provider bangumi|bilibili` | 追番数据离线同步 |
| `pnpm fonts:check` | 字体预算校验 |
| `pnpm perf:measure` / `pnpm lighthouse:desktop|mobile` | 性能度量 |

Windows 下使用 `pnpm.cmd` / `npx.cmd`。

### 12.2 配置清单（`src/config/`，25+ 文件）

`siteConfig`（站点/色彩/横幅/纹理/TOC）、`profileConfig`（资料/社交）、`navBarConfig`（导航）、`sidebarConfig`（侧栏布局/widget）、`postListConfig`（分页/列表网格）、`articleConfig`（更新提示/延伸阅读/分享）、`commentConfig`（评论）、`musicConfig`（音乐源）、`animeConfig`（番剧源）、`fontConfig`（字体子集化）、`footerConfig`、`announcementConfig`、`expressiveCodeConfig`、`fabConfig`、`imageBloomConfig`、`contextMenuConfig`、`licenseConfig`、`llmsConfig`、`permalinkConfig`、`umamiConfig`、`devicesConfig`、`projectsConfig`、`skillsConfig`、`timelineConfig` + `index.ts` 出口。完整契约见 [src/config/README.md](file:///f:/blog/Shirone/src/config/README.md)。

### 12.3 术语表

- **M3E**：Material 3 Expressive —— Google 动态色彩/形状/动效规范的表达层。
- **HCT**：Hue-Chroma-Tone 色彩空间，Material Color Utilities 使用，用于从图片提色与动态配色。
- **Swup**：无刷新整页过渡库，负责站内链接拦截、`#swup-container` 内容替换。
- **SSR / 水合**：服务端预渲染 / 客户端补充交互（`client:load` 等指令）。
- **Pagefind**：静态站全文搜索索引工具（WASM）。
- **Islands/零额外负担**：只对需要的部分注入 JS，可选功能禁用时零资源/零占用。
- **内容分离 / 双仓**：主题代码仓与个人内容仓解耦的架构。

---

## 参考

- 官方文档：https://docs.shirone.mysqil.com/ （intro / get-started / project-structure / optimize-build / deploy / content-separation / writing / api/components / api/user / frontmatter / writing-post / layout 等章节）
- 代码仓库：https://github.com/LyraVoid/Shirone · 内容模板仓：https://github.com/LyraVoid/Shirone-Content
- 本地实现：`docs/`、`rules/`、`AGENTS.md`、`src/`、`scripts/`

> 本文档为指导性参考资料；实施具体改动时务必先阅读对应的 `AGENTS.md`、`rules/`、`docs/` 与目标源码，并遵守 10.4 验证门禁。