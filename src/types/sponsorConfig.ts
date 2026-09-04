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
}
