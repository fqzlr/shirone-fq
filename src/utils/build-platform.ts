/**
 * 构建平台识别（构建期/SSR 专用，禁止在客户端 `<script>` 中导入）。
 *
 * 通过各平台注入的标志性环境变量识别当前构建/部署平台，用于
 * 侧栏「站点信息」widget 的展示行。识别失败时回退为 "Local"（本地开发）。
 * 环境变量 `SHIRONE_BUILD_PLATFORM` 优先级最高，可强制指定展示名。
 */

/** 各部署平台的标志性环境变量 → 展示名（按检测优先级排列） */
const PLATFORM_MARKERS: readonly (readonly [string, string])[] = [
	["EDGEONE_PROJECT_ID", "EdgeOne Pages"],
	["ESA_PROJECT_ID", "ESA Pages"],
	["CF_PAGES", "Cloudflare Pages"],
	["VERCEL", "Vercel"],
	["NETLIFY", "Netlify"],
	["GITHUB_ACTIONS", "GitHub Pages"],
	["CI", "CI"],
];

/** 识别当前构建平台展示名；`SHIRONE_BUILD_PLATFORM` 可强制覆盖 */
export function detectBuildPlatform(): string {
	const override = process.env.SHIRONE_BUILD_PLATFORM?.trim();
	if (override) return override;

	for (const [marker, name] of PLATFORM_MARKERS) {
		if (process.env[marker]) return name;
	}
	return "Local";
}
