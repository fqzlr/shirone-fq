/**
 * 打赏页配置类型。值与默认配置见 src/config/sponsorConfig.ts。
 *
 * 页面可用 = `siteConfig.pages.sponsor` && `sponsorConfig.enable`（AND 交集，
 * 判定见 src/utils/page-availability.ts）；`enable: false`（默认）时路由跳转
 * /404/、导航入口自动隐藏，页面组件不输出任何 DOM（零额外负担）。
 */

/** 打赏方式卡片：二维码图（扫码）与外链（前往打赏）二选一，均省略的项视为未配置 */
export interface SponsorMethod {
	/** 是否启用该打赏方式 */
	enable: boolean;
	/** 方式名称（如 "微信" / "支付宝" / "爱发电" / "ko-fi"），直接展示 */
	name: string;
	/** astro-icon 图标名（如 "material-symbols:qr-code-2-rounded"） */
	icon: string;
	/** 卡片描述（如 "使用 微信 扫码打赏"），省略时按卡片类型生成默认文案 */
	description?: string;
	/** 收款码图片地址（public 路径或远程 URL）；提供时渲染为扫码卡片 */
	qrcode?: string;
	/** 收款码图片替代文本，省略时回退 sponsorScan 文案（“使用 {name} 扫码打赏”） */
	qrcodeAlt?: string;
	/** 跳转链接（如爱发电 / ko-fi 主页）；提供时渲染为"前往打赏"外链卡片 */
	url?: string;
	/** 链接是否在新标签页打开（默认按 url 是否为 http(s) 判断） */
	external?: boolean;
}

/** 打赏者条目：名单卡片区按数组顺序渲染 */
export interface SponsorDonor {
	/** 名称（直接展示；无头像时取首字符作占位头像） */
	name: string;
	/** 金额文案（如 "¥50"），省略时不显示 */
	amount?: string;
	/** 打赏日期（YYYY-MM-DD 等 Date 可解析值），省略时不显示 */
	date?: string;
	/** 头像地址（public 路径或远程 URL），省略时用首字符占位 */
	avatar?: string;
}

/** 打赏页配置：`/sponsor/` 页的提示条文案与打赏方式清单 */
export interface SponsorConfig {
	/** 页面行为开关：false 时页面跳转 /404/ 且导航入口隐藏（与 pages.sponsor 取 AND） */
	enable: boolean;
	/** 页面副标题（PageHeader 下方描述），省略时使用 i18n 默认文案 */
	description?: string;
	/** 顶部提示条文案（打赏用途说明），省略时使用 i18n 默认文案；空字符串隐藏提示条 */
	usage?: string;
	/** 打赏方式清单，按数组顺序渲染卡片 */
	methods: SponsorMethod[];
	/** 是否展示打赏者名单卡片区（默认 true；sponsors 为空时显示空态文案） */
	showSponsorsList?: boolean;
	/** 打赏者清单，按数组顺序渲染 */
	sponsors?: SponsorDonor[];
	/** 是否在打赏页展示评论区（默认 true；仍需评论系统全局启用才渲染） */
	showComment?: boolean;
}
