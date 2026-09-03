import type {
	CommentConfig,
	TwikooConfig,
	WalineConfig,
} from "@/types/commentConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 评论系统配置单一真源。
 *
 * 遵循「零额外负担」原则：默认全局关闭（enable: false），
 * 在未开启时不产生任何外部网络请求、零额外 DOM 占位与零包体积膨胀。
 *
 * 【开启 Twikoo 评论配置步骤】
 * 1. 部署 Twikoo 服务端并获取环境 ID（腾讯云 CloudBase / Vercel / Railway / 私有部署等）；
 * 2. 将 `enable` 置为 `true`，并将 `provider` 设置为 `"twikoo"`；
 * 3. 填入你的 `twikoo.envId`；
 * 4. （可选）自定义 `scriptUrl`（如使用自建 CDN 或官方 unpkg/jsdelivr 源）。
 *
 * 【开启 Waline 评论配置步骤】
 * 1. 部署 Waline 服务端并获取服务端地址（Vercel / Railway / 私有部署等，见 waline.js.org）；
 * 2. 将 `enable` 置为 `true`，并将 `provider` 设置为 `"waline"`；
 * 3. 填入你的 `waline.serverURL`；
 * 4. （可选）自定义 `scriptUrl` / `cssUrl`（如使用自建 CDN 或 jsdelivr 源）。
 */
export const commentConfig: CommentConfig = withUserConfig("comment", {
	/** 全局评论总开关：false 时完全不加载评论脚本与 DOM */
	enable: false,
	/** 评论提供商类型："none" | "twikoo" | "waline" */
	provider: "none",
	/** 是否开启视口懒加载：滚动进入视口才动态加载评论组件（推荐 true） */
	lazy: true,
	/** Twikoo 专有配置 */
	twikoo: {
		/** Twikoo 环境 ID（如 "https://your-twikoo.vercel.app" 或腾讯云环境 ID） */
		envId: "",
		/** Twikoo 前端 JS 脚本 CDN 地址 */
		scriptUrl: "https://cdn.jsdelivr.net/npm/twikoo@1.7.19/dist/twikoo.min.js",
		/** 评论语言："auto"（跟随站点）| "zh-CN" | "zh-TW" | "en" | "ja" 等 */
		lang: "auto",
		/** 评论输入框占位提示文本 */
		placeholder: "Share your thoughts...",
	},
	/** Waline 专有配置 */
	waline: {
		/** Waline 服务端地址（如 "https://your-waline.vercel.app"） */
		serverURL: "",
		/** Waline 客户端 ESM 脚本地址 */
		scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
		/** Waline 样式表地址 */
		cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
		/** 评论语言："auto"（跟随站点）| "zh-CN" | "zh-TW" | "en" | "ja" 等 */
		lang: "auto",
		/** 评论输入框占位提示文本；留空使用 Waline 默认文案 */
		placeholder: "",
		/** 是否开启页面浏览量统计（需服务端支持） */
		pageview: false,
		/** 表情包预设 URL 列表；留空使用 Waline 默认表情 */
		emoji: [],
		/** 评论字数限制 [最小, 最大]；留空不限制 */
		wordLimit: [0, 0],
	},
});

export type ResolvedCommentOptions =
	| {
			provider: "twikoo";
			lazy: boolean;
			twikoo: TwikooConfig;
	  }
	| {
			provider: "waline";
			lazy: boolean;
			waline: WalineConfig;
	  }
	| null;

/**
 * 解析并校验评论配置。未启用、提供商为 none 或关键参数缺失时返回 null。
 */
export function resolveCommentOptions(
	config: CommentConfig,
): ResolvedCommentOptions {
	if (!config.enable || config.provider === "none") {
		return null;
	}
	if (config.provider === "twikoo") {
		const envId = config.twikoo.envId?.trim();
		const scriptUrl = config.twikoo.scriptUrl?.trim();
		if (!envId || !scriptUrl) {
			return null;
		}
		return {
			provider: "twikoo",
			lazy: config.lazy,
			twikoo: {
				...config.twikoo,
				envId,
				scriptUrl,
			},
		};
	}
	if (config.provider === "waline") {
		const serverURL = config.waline.serverURL?.trim();
		const scriptUrl = config.waline.scriptUrl?.trim();
		const cssUrl = config.waline.cssUrl?.trim();
		if (!serverURL || !scriptUrl || !cssUrl) {
			return null;
		}
		const wordLimit = config.waline.wordLimit;
		const hasWordLimit =
			Array.isArray(wordLimit) &&
			wordLimit.length === 2 &&
			wordLimit[0] > 0 &&
			wordLimit[1] > 0;
		return {
			provider: "waline",
			lazy: config.lazy,
			waline: {
				...config.waline,
				serverURL,
				scriptUrl,
				cssUrl,
				wordLimit: hasWordLimit
					? ([wordLimit[0], wordLimit[1]] as [number, number])
					: undefined,
			},
		};
	}
	return null;
}
