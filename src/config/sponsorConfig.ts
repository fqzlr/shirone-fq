import type { SponsorConfig, SponsorMethod } from "@/types/sponsorConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 打赏页配置：/sponsor/ 页的提示条文案与打赏方式清单。
 * 内容仓可用 `config/sponsor.yaml` 覆盖；`enable: false`（默认）时路由跳转
 * /404/、导航入口自动隐藏、组件零 DOM（零额外负担，判定见 page-availability）。
 * description / usage 省略时回退 i18n 默认文案（sponsorDescription / sponsorUsage），
 * 配置为空字符串可隐藏对应文案块。
 */
export const sponsorConfig: SponsorConfig = withUserConfig("sponsor", {
	enable: false,
	methods: [],
});

/**
 * 解析生效的打赏方式清单：过滤未启用项；qrcode 与 url 均缺失的方式
 * 视为未配置完成，渲染时跳过（避免输出空卡片）。
 */
export function resolveSponsorMethods(): SponsorMethod[] {
	return sponsorConfig.methods.filter(
		(method) => method.enable !== false && Boolean(method.qrcode || method.url),
	);
}
