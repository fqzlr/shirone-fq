import type {
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
});

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
