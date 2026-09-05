import type { RandomCoverConfig } from "@/types/randomCoverConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 随机封面配置单一真源。
 *
 * 遵循「零额外负担」原则：默认全局关闭（enable: false）。
 * 关闭时无封面文章完全保持原渲染分支（列表卡进入箭头 / 文章页虚线），
 * 不产生任何外部网络请求、零 DOM 变化、零包体积膨胀。
 *
 * 【开启步骤】
 * 1. 在内容仓 config/random-cover.yaml 覆盖：
 *      enable: true
 *      endpoint: "https://your-imgbed.domain/random?type=img&dir=katong"
 * 2. 端点要求：CloudFlare ImgBed /random API，需带 type=img 直接返回图片本体；
 * 3. 本地兜底图默认 public/images/default-cover.webp，可在覆盖层替换路径。
 */
export const randomCoverConfig: RandomCoverConfig = withUserConfig("randomCover", {
	/** 是否启用：未配置封面的文章回退显示图床随机图 */
	enable: false,
	/** 图床随机图端点（CloudFlare ImgBed /random，type=img 直接返回图片本体） */
	endpoint: "",
	/** 随机图加载失败时的本地兜底图（public/ 下路径） */
	fallback: "/images/default-cover.webp",
});

export type ResolvedRandomCoverOptions = {
	/** 随机图端点（可直接作为 <img src>） */
	randomUrl: string;
	/** 本地兜底图 URL（经站点 base 处理前） */
	fallbackUrl: string;
} | null;

/**
 * 解析并校验随机封面配置。未启用或端点为空时返回 null（消费方据此短路）。
 */
export function resolveRandomCoverOptions(
	config: RandomCoverConfig,
): ResolvedRandomCoverOptions {
	if (!config.enable) {
		return null;
	}
	const endpoint = config.endpoint.trim();
	if (!endpoint) {
		return null;
	}
	return { randomUrl: endpoint, fallbackUrl: config.fallback.trim() };
}
