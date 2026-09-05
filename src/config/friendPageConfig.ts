import type {
	FriendCheckOptions,
	FriendContactItem,
	FriendNoteItem,
	FriendPageConfig,
	FriendSiteInfo,
} from "@/types/friendPageConfig";
import { withUserConfig } from "../utils/config-overlay.ts";
import { profileConfig } from "./profileConfig.ts";
import { siteConfig } from "./siteConfig.ts";

/**
 * 友链页信息模块配置：/friends/ 页的「本站信息 / 申请友链 / 注意事项」引导卡片。
 * site 缺省字段回退 profileConfig / siteConfig，见 resolveFriendSiteInfo。
 * 内容仓可用 `config/friend-page.yaml` 覆盖；enable: false 时页面不渲染该模块。
 */
export const friendPageConfig: FriendPageConfig = withUserConfig("friendPage", {
	enable: true,
	site: {},
	// 申请友链模板：占位符由访客自行替换后发送
	template: [
		"站点名称：您的站点名称",
		"站点描述：您的站点描述",
		"站点链接：您的站点链接",
		"头像链接：您的站点头像",
	].join("\n"),
	// 申请友链联系方式：第 2 步联系方式区展示；留空数组则该区零 DOM
	contacts: [],
	notes: [
		{
			title: "互换原则",
			content: "请先将本站添加到您的友链页面，确认后会添加您的友链",
		},
		{
			title: "链接维护",
			content: "友链网站长期无法访问或内容违规，将会被移除",
		},
		{ title: "内容要求", content: "内容积极向上，不含有任何违法违规内容" },
		{
			title: "站点要求",
			content: "支持 HTTPS，以原创内容为主，能够正常访问且有持续更新",
		},
	],
	// 友链可达性检测（check-flink）：默认开启，对接 https://check.fqzlr.com/result.json。
	// 启用后：右上角状态徽标(绿/橙/红) + hover截图预览 + 暂存区/墓碑分级。
	// 内容仓可用 config/friend-page.yaml 覆盖（friendPage.check.*），
	// 或构建期设置环境变量 FRIEND_CHECK_RESULT_URL。
	check: {
		enable: true,
		resultUrl: "https://check.fqzlr.com/result.json",
		cacheTtlMinutes: 30,
		pendingZone: [1, 6],
		graveyardZone: [7, 9999],
	},
});

const CHECK_TTL_MIN = 5;
const CHECK_TTL_MAX = 24 * 60;
const DEFAULT_PENDING_ZONE: [number, number] = [1, 6];
const DEFAULT_GRAVEYARD_ZONE: [number, number] = [7, 9999];

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:";
	} catch {
		return false;
	}
}

function clampInt(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Math.round(value)));
}

/** 校验闭区间（两个有限整数且 min ≤ max），非法时回退默认值 */
function normalizeZone(
	value: unknown,
	fallback: [number, number],
): [number, number] {
	if (
		Array.isArray(value) &&
		value.length === 2 &&
		value.every((n) => typeof n === "number" && Number.isFinite(n))
	) {
		const [min, max] = value as [number, number];
		if (min <= max) return [Math.round(min), Math.round(max)];
	}
	return fallback;
}

/**
 * 解析友链检测运行时契约：
 * - resultUrl 显式配置优先，缺省回退环境变量 FRIEND_CHECK_RESULT_URL（本地/CI 预览用）；
 * - URL 非法或留空时自动禁用（enable: false），保持零额外负担；
 * - 分区阈值非法时回退默认区间；暂存区上限越过墓碑下限时同样回退，保证两区互斥。
 * 返回值冻结，可安全经 props 传入客户端组件。
 */
export function resolveFriendCheckOptions(): FriendCheckOptions {
	const check = friendPageConfig.check ?? {};
	const rawUrl = (
		check.resultUrl ??
		process.env.FRIEND_CHECK_RESULT_URL ??
		""
	).trim();

	const pendingZone = normalizeZone(
		check.pendingZone ?? DEFAULT_PENDING_ZONE,
		DEFAULT_PENDING_ZONE,
	);
	let graveyardZone = normalizeZone(
		check.graveyardZone ?? DEFAULT_GRAVEYARD_ZONE,
		DEFAULT_GRAVEYARD_ZONE,
	);
	if (pendingZone[1] >= graveyardZone[0]) {
		// 两区互斥被破坏：回退默认分级，避免友链同时落入两个分区
		graveyardZone = DEFAULT_GRAVEYARD_ZONE;
	}

	const enable =
		check.enable === true && rawUrl.length > 0 && isHttpUrl(rawUrl);
	return Object.freeze({
		enable,
		resultUrl: enable ? rawUrl : "",
		cacheTtlMs:
			clampInt(check.cacheTtlMinutes ?? 30, CHECK_TTL_MIN, CHECK_TTL_MAX) *
			60_000,
		pendingZone: Object.freeze(pendingZone),
		graveyardZone: Object.freeze(graveyardZone),
	} satisfies FriendCheckOptions);
}

/**
 * 解析友链引导模块的本站信息：显式配置优先，缺省回退 profile / site 配置。
 * 头像路径（相对 /src 或 /public）由调用方（SSR）用 resolveAsset 解析为可用 URL。
 */
export function resolveFriendSiteInfo(): Required<
	Pick<FriendSiteInfo, "name" | "desc" | "url">
> &
	FriendSiteInfo {
	const site = friendPageConfig.site ?? {};
	return {
		name: site.name ?? profileConfig.name,
		desc: site.desc ?? profileConfig.bio ?? "",
		url: site.url ?? siteConfig.site,
		avatar: site.avatar ?? profileConfig.avatar,
		email: site.email ?? "",
	};
}

/** 解析注意事项列表（未配置时返回空数组，模块渲染时跳过该卡） */
export function resolveFriendNotes(): FriendNoteItem[] {
	return friendPageConfig.notes ?? [];
}

/** 申请友链模板文本（未配置时回退空串，模块渲染时跳过复制块） */
export function resolveFriendTemplate(): string {
	return friendPageConfig.template ?? "";
}

/** 申请友链联系方式（未配置时返回空数组，模块渲染时跳过联系方式区） */
export function resolveFriendContacts(): FriendContactItem[] {
	return friendPageConfig.contacts ?? [];
}
