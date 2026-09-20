/**
 * 公告配置（AnnouncementConfig）
 * 可见性由 sidebarConfig.components 统一控制。
 */
export interface AnnouncementLinkConfig {
	/** 是否启用链接 */
	enable: boolean;
	/** 链接文本 */
	text: string;
	/** 链接 URL */
	url: string;
	/** 是否外部链接（新窗口打开） */
	external?: boolean;
}

/**
 * 公告板单条公告（FAB 弹窗列表项）
 */
export interface AnnouncementBoardItem {
	/** 左上角小标签（如"更新"、"活动"；省略不显示 chip） */
	tag?: string;
	/** 公告标题 */
	title: string;
	/** 公告日期（展示文本，如 2026-08-29） */
	date?: string;
	/** 公告正文 */
	content: string;
	/** 可选"查看详情"链接（提供 url 且未显式 enable: false 时渲染） */
	link?: Omit<AnnouncementLinkConfig, "enable"> & { enable?: boolean };
}

/**
 * 公告板（FAB 弹窗）配置。
 * 零额外负担：enable 为 false 或 items 为空时，FAB 按钮与弹窗均不渲染。
 */
export interface AnnouncementBoardConfig {
	/** 公告板总开关 */
	enable?: boolean;
	/** 公告列表（按数组顺序展示） */
	items?: AnnouncementBoardItem[];
}

export interface AnnouncementConfig {
	/** 公告栏标题，留空则自动使用 i18n Key.announcement ("公告") */
	title?: string;
	/** 公告正文内容 */
	content: string;
	/** 向后兼容老配置的 text 字段 */
	text?: string;
	/** 公告栏可选图标 */
	icon?: string;
	/** 公告类型 */
	type?: "info" | "warning" | "success" | "error";
	/** 是否允许用户关闭公告 */
	closable?: boolean;
	/**
	 * 关闭公告后的有效生命周期（单位：秒）。
	 * 超过此时间后，公告将重新向用户展示。
	 * 0 或未设置表示永久关闭（直到清理浏览器缓存或重置）。
	 * 例如：86400 为 24 小时，604800 为 7 天。
	 */
	closeDuration?: number;
	/** 可选行动链接配置 */
	link?: AnnouncementLinkConfig;
	/** 公告板（FAB 弹窗列表）；未开启或列表为空时不渲染任何 DOM（零额外负担） */
	board?: AnnouncementBoardConfig;
}
