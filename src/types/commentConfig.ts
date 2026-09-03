export type CommentProvider = "none" | "twikoo" | "waline";

export interface TwikooConfig {
	/** Twikoo 环境 ID 或后端服务地址 URL */
	envId: string;
	/** Twikoo 客户端 JS 脚本 CDN 地址 */
	scriptUrl: string;
	/** 评论语言，"auto" 自动跟随站点语言，也可指定如 "zh-CN", "en" 等 */
	lang: "auto" | string;
	/** 评论输入框的灰色说明文字；留空时不显示 */
	placeholder?: string;
}

export interface WalineConfig {
	/** Waline 服务端地址（如 "https://your-waline.vercel.app"），必填 */
	serverURL: string;
	/** Waline 客户端 ESM 脚本地址（@waline/client v3 dist/waline.js） */
	scriptUrl: string;
	/** Waline 样式表地址（@waline/client v3 dist/waline.css） */
	cssUrl: string;
	/** 评论语言，"auto" 自动跟随站点语言，也可指定如 "zh-CN", "en" 等 */
	lang: "auto" | string;
	/** 评论输入框的灰色说明文字；留空时使用 Waline 默认文案 */
	placeholder?: string;
	/** 是否开启页面浏览量统计（需服务端支持） */
	pageview?: boolean;
	/** 表情包预设 URL 列表；留空使用 Waline 默认表情 */
	emoji?: string[];
	/** 评论字数限制 [最小, 最大]；留空不限制 */
	wordLimit?: [number, number];
}

export interface CommentConfig {
	/** 是否全局启用评论功能 */
	enable: boolean;
	/** 选用的评论提供商 */
	provider: CommentProvider;
	/** 是否开启视口懒加载（进入视口前不加载外部脚本） */
	lazy: boolean;
	/** Twikoo 专属配置 */
	twikoo: TwikooConfig;
	/** Waline 专属配置 */
	waline: WalineConfig;
}

/** 传递给具体 Provider 组件的归一化上下文 */
export interface CommentContext {
	/** 页面唯一稳定标识（如 post:my-first-post） */
	key: string;
	/** 评论挂钩的 canonical 路径（如 /posts/my-first-post/） */
	path: string;
	/** 文章标题 */
	title: string;
	/** 当前页面语言代码 */
	language: string;
}
