/**
 * 统一页面可用性判定（构建期/SSR 专用，禁止在客户端 `<script>` 中导入——
 * 会把配置模块拖进浏览器 bundle）。
 *
 * 页面最终可用 = `siteConfig.pages.<page>`（统一开关）&& 行为领域 `enable`（AND 交集）。
 * 未登记的 pageKey（`home`/`archive`/`github`/`rss`/`atom`/`post`、
 * 自定义页与外链）恒为可用。
 *
 * 循环依赖注意：本模块被 `navBarConfig`（反向依赖模块）引用，因此只允许从
 * `@/config/<domain>Config` 具体文件导入，禁止走 `@/config` barrel
 * （否则形成 `barrel → navBarConfig → 本模块 → barrel` 环）。
 */
import { animeConfig } from "../config/animeConfig.ts";
import { devicesConfig } from "../config/devicesConfig.ts";
import { projectsConfig } from "../config/projectsConfig.ts";
import { siteConfig } from "../config/siteConfig.ts";
import { skillsConfig } from "../config/skillsConfig.ts";
import { sponsorConfig } from "../config/sponsorConfig.ts";
import { timelineConfig } from "../config/timelineConfig.ts";
import type { PageToggles } from "../types/config.ts";

/** 拥有独立行为领域开关的页面：第二因子取该领域的 `enable`。 */
const DOMAIN_ENABLES: Partial<Record<keyof PageToggles, boolean>> = {
	anime: animeConfig.enable,
	skills: skillsConfig.enable,
	projects: projectsConfig.enable,
	devices: devicesConfig.enable,
	timeline: timelineConfig.enable,
	sponsor: sponsorConfig.enable,
};

/**
 * 纯函数核心（可注入，供单元测试覆盖 AND 交集各分支）：
 * - 开关键未登记（非布尔）→ 可用；
 * - 统一开关为 false → 不可用；
 * - 否则取领域 enable（未登记领域视为 true）。
 */
export function evaluatePageAvailability(
	page: string,
	pageToggles: Record<string, boolean>,
	domainEnables: Record<string, boolean | undefined>,
): boolean {
	const toggle = pageToggles[page];
	if (typeof toggle !== "boolean") return true;
	if (!toggle) return false;
	return domainEnables[page] ?? true;
}

/** 判定某个页面标识（navBar `pageKey` 语义的任意字符串）当前是否可用。 */
export function isPageAvailable(page: string): boolean {
	return evaluatePageAvailability(
		page,
		siteConfig.pages as unknown as Record<string, boolean>,
		DOMAIN_ENABLES,
	);
}
