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

/** 申请友链联系方式单项（展示在申请步骤的联系方式区） */
export interface FriendContactItem {
	/** 渠道名，如「邮箱 / B站 / QQ群 / GitHub」 */
	label: string;
	/** 联系标识（邮箱地址 / 账号名），提供一键复制 */
	value: string;
	/** 可选 Iconify 图标名 */
	icon?: string;
	/** 可选跳转链接（如 B 站主页 / QQ 群加群链 / GitHub 主页） */
	link?: string;
}

export interface FriendPageConfig {
	/** 是否启用友链页信息模块（关闭时友链列表本身不受影响） */
	enable: boolean;
	/** 本站信息（申请友链时供对方复制的字段），缺省项自动回退站点/profile 配置 */
	site?: FriendSiteInfo;
	/** 申请友链模板（多行纯文本，第 2 步代码块展示并提供一键复制） */
	template?: string;
	/** 申请友链联系方式（第 2 步联系方式区展示；留空数组则不渲染该区） */
	contacts?: FriendContactItem[];
	/** 注意事项列表 */
	notes?: FriendNoteItem[];
	/** 友链可达性检测（check-flink），默认关闭；关闭时零请求、零徽标 DOM、零分区模块 */
	check?: FriendCheckConfig;
}

export interface FriendCheckConfig {
	/** 是否启用友链可达性检测（默认 false，零额外负担） */
	enable?: boolean;
	/**
	 * check-flink 部署产物的 result.json 地址（如 https://check.example.com/result.json）。
	 * 留空时检测自动禁用；构建期可用环境变量 FRIEND_CHECK_RESULT_URL 兜底（便于本地/CI 预览）。
	 */
	resultUrl?: string;
	/** result.json 客户端缓存有效期（分钟），默认 30 */
	cacheTtlMinutes?: number;
	/** 连续检测失败次数落入「友链暂存区」的闭区间，默认 [1, 6] */
	pendingZone?: [number, number];
	/** 连续检测失败次数落入「友链墓碑」的闭区间，默认 [7, 9999] */
	graveyardZone?: [number, number];
}

/**
 * 检测功能的运行时契约（由 resolveFriendCheckOptions 解析出，经 props 传入客户端组件；
 * 客户端组件不得直接 import config，避免把 Node 侧配置层带进浏览器 bundle）。
 */
export interface FriendCheckOptions {
	enable: boolean;
	/** result.json 地址（enable 为 true 时必为非空 https(s) URL） */
	resultUrl: string;
	/** 客户端缓存有效期（毫秒） */
	cacheTtlMs: number;
	/** 友链暂存区 fail_count 闭区间 */
	pendingZone: readonly [number, number];
	/** 友链墓碑 fail_count 闭区间 */
	graveyardZone: readonly [number, number];
}
