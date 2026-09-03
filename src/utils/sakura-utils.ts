import {
	SAKURA_ENABLED_KEY,
	SAKURA_TOGGLE_EVENT,
} from "@constants/constants.ts";
import { siteConfig } from "@/config";
import type { SakuraConfig } from "@/types/effectsConfig";

/** 站点配置的樱花特效默认项（缺省字段回退到主题默认值） */
const SAKURA_DEFAULTS: SakuraConfig = {
	enable: false,
	sakuraNum: 21,
	limitTimes: -1,
	size: { min: 0.5, max: 1.1 },
	opacity: { min: 0.3, max: 0.9 },
	speed: {
		horizontal: { min: -1.7, max: -1.2 },
		vertical: { min: 1.5, max: 2.2 },
		rotation: 0.03,
		fadeSpeed: 0.03,
	},
	zIndex: 100,
};

/** 解析生效的樱花特效配置：站点配置覆盖主题默认值 */
export function resolveSakuraConfig(): SakuraConfig {
	const userCfg = siteConfig.effects?.sakura;
	if (!userCfg) return SAKURA_DEFAULTS;
	return {
		...SAKURA_DEFAULTS,
		...userCfg,
		size: { ...SAKURA_DEFAULTS.size, ...userCfg.size },
		opacity: { ...SAKURA_DEFAULTS.opacity, ...userCfg.opacity },
		speed: {
			horizontal: {
				...SAKURA_DEFAULTS.speed.horizontal,
				...userCfg.speed?.horizontal,
			},
			vertical: {
				...SAKURA_DEFAULTS.speed.vertical,
				...userCfg.speed?.vertical,
			},
			rotation: userCfg.speed?.rotation ?? SAKURA_DEFAULTS.speed.rotation,
			fadeSpeed: userCfg.speed?.fadeSpeed ?? SAKURA_DEFAULTS.speed.fadeSpeed,
		},
	};
}

/** 站点默认开关（显示设置面板未存储访客偏好时使用） */
export function getDefaultSakuraEnabled(): boolean {
	return resolveSakuraConfig().enable;
}

/** 访客当前开关（localStorage 优先，缺省回退站点默认值） */
export function getSakuraEnabled(): boolean {
	if (typeof window === "undefined") return false;
	const stored = localStorage.getItem(SAKURA_ENABLED_KEY);
	return stored !== null ? stored === "true" : getDefaultSakuraEnabled();
}

/** 写入访客开关并广播；画布管理器（Layout 加载器注册）监听事件即时启停 */
export function setSakuraEnabled(enabled: boolean): void {
	localStorage.setItem(SAKURA_ENABLED_KEY, String(enabled));
	window.dispatchEvent(
		new CustomEvent(SAKURA_TOGGLE_EVENT, { detail: { enabled } }),
	);
}
