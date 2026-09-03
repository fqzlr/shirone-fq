/**
 * 友链页信息模块配置（FriendPageConfig）。
 * 驱动 /friends/ 页的「本站信息 / 申请友链 / 注意事项」引导卡片（FriendGuide）。
 * `enable: false` 时不渲染任何 DOM、不加载组件脚本（零额外负担）。
 */
export interface FriendSiteInfo {
	/** 站点名称，缺省回退 profileConfig.name */
	name?: string;
	/** 站点描述，缺省回退 profileConfig.bio */
	desc?: string;
	/** 站点链接，缺省回退 siteConfig.site */
	url?: string;
	/** 站点头像（相对 /src、/public 或远程 URL），缺省回退 profileConfig.avatar */
	avatar?: string;
	/** 联系邮箱（展示在申请步骤中），留空则不展示 */
	email?: string;
}

export interface FriendNoteItem {
	/** 注意事项小标题，如「互换原则」 */
	title: string;
	/** 注意事项说明文字 */
	content: string;
}

export interface FriendPageConfig {
	/** 是否启用友链页信息模块（关闭时友链列表本身不受影响） */
	enable: boolean;
	/** 本站信息（申请友链时供对方复制的字段），缺省项自动回退站点/profile 配置 */
	site?: FriendSiteInfo;
	/** 申请友链模板（多行纯文本，第 2 步代码块展示并提供一键复制） */
	template?: string;
	/** 注意事项列表 */
	notes?: FriendNoteItem[];
}
