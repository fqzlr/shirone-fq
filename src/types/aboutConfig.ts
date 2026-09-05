/**
 * 关于页数据类型契约。
 *
 * 注：关于页的具体内容数据（技术栈分组、魔改时间线、社交链接）
 * 是纯内容，维护在内容仓 `data/about.ts`（物化为 `src/data/about.ts`），
 * 与技能 / 项目 / 时间线页的数据维护方式一致。
 */

/** 技术栈单项 */
export interface AboutTechItem {
	/** 技术名 */
	name: string;
	/** 一句话说明 */
	desc: string;
	/** Iconify 图标名 */
	icon: string;
	/** 官网链接 */
	url: string;
	/** 明色主题图标色 */
	color: string;
	/** 暗色主题图标色（黑白 logo 必备；彩色可省） */
	darkColor?: string;
}

/** 技术栈分组（手风琴一组） */
export interface AboutTechGroup {
	id: string;
	label: string;
	/** 分组图标（Iconify 名） */
	icon: string;
	items: AboutTechItem[];
}

/** 魔改时间线节点 */
export interface AboutMilestone {
	/** 时间戳（如 2025.10） */
	date: string;
	title: string;
	desc: string;
	/** 可选标签（起点 / 功能 / 体验…） */
	tag?: string;
}

/** 社交链接品牌色键（驱动 --about-social-brand 变量） */
export type AboutSocialBrand =
	| "github"
	| "bilibili"
	| "qq"
	| "email"
	| "rss"
	| "twitter";

/** 社交链接单项 */
export interface AboutSocialLink {
	platform: string;
	handle: string;
	note?: string;
	href: string;
	/** Iconify 图标名 */
	icon: string;
	brand: AboutSocialBrand;
}
