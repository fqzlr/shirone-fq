import {
	AUTO_MODE,
	BANNER_CAROUSEL_CHANGE_EVENT,
	BANNER_CAROUSEL_ENABLED_KEY,
	BANNER_GRADIENT_CHANGE_EVENT,
	BANNER_GRADIENT_ENABLED_KEY,
	BANNER_TITLE_CHANGE_EVENT,
	BANNER_TITLE_ENABLED_KEY,
	BANNER_WAVES_CHANGE_EVENT,
	BANNER_WAVES_ENABLED_KEY,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
	TEXTURE_CHANGE_EVENT,
	TEXTURE_OPACITY_KEY,
	TEXTURE_PRESET_KEY,
	TEXTURE_PRESETS,
	WALLPAPER_FULLSCREEN_LAYOUT_CHANGE_EVENT,
	WALLPAPER_FULLSCREEN_LAYOUT_KEY,
	WALLPAPER_MODE_CHANGE_EVENT,
	WALLPAPER_MODE_KEY,
	WALLPAPER_OVERLAY_BLUR_KEY,
	WALLPAPER_OVERLAY_CARD_OPACITY_KEY,
	WALLPAPER_OVERLAY_OPACITY_KEY,
} from "@constants/constants.ts";
import { prefersReducedMotion } from "@utils/motion";
import { applyCurrentScheme } from "@utils/theme-utils";
import { expressiveCodeConfig, siteConfig } from "@/config";
import type {
	FullscreenWallpaperLayout,
	LIGHT_DARK_MODE,
	WallpaperMode,
} from "@/types/config";
import type { TexturePreset } from "@/types/textureConfig";

export function isTexturePreset(value: unknown): value is TexturePreset {
	return (
		typeof value === "string" &&
		(TEXTURE_PRESETS as readonly string[]).includes(value)
	);
}

export function getDefaultTexturePreset(): TexturePreset {
	const textureCfg =
		typeof siteConfig.texture === "object" ? siteConfig.texture : undefined;
	const fallback = textureCfg?.defaultPreset ?? "starlight";
	const value =
		document.getElementById("config-carrier")?.dataset.texturePreset;
	return isTexturePreset(value) ? value : fallback;
}

export function getStoredTexturePreset(): TexturePreset {
	const value = localStorage.getItem(TEXTURE_PRESET_KEY);
	return isTexturePreset(value) ? value : getDefaultTexturePreset();
}

export function setTexturePreset(preset: TexturePreset): void {
	localStorage.setItem(TEXTURE_PRESET_KEY, preset);
	document.documentElement.dataset.texturePreset = preset;
	window.dispatchEvent(
		new CustomEvent(TEXTURE_CHANGE_EVENT, {
			detail: { preset, opacity: getStoredTextureOpacity() },
		}),
	);
}

export function getDefaultTextureOpacity(): number {
	const textureCfg =
		typeof siteConfig.texture === "object" ? siteConfig.texture : undefined;
	const fallback = textureCfg?.defaultOpacity ?? 0.12;
	const carrier = document.getElementById("config-carrier");
	const val = carrier?.dataset.textureOpacity;
	if (val) {
		const parsed = Number.parseFloat(val);
		if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
			return parsed;
		}
	}
	return fallback;
}

export function getStoredTextureOpacity(): number {
	const value = localStorage.getItem(TEXTURE_OPACITY_KEY);
	if (value) {
		const parsed = Number.parseFloat(value);
		if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
			return parsed;
		}
	}
	return getDefaultTextureOpacity();
}

export function setTextureOpacity(opacity: number): void {
	const clamped = Math.min(Math.max(opacity, 0), 1);
	localStorage.setItem(TEXTURE_OPACITY_KEY, String(clamped));
	document.documentElement.style.setProperty(
		"--texture-opacity",
		String(clamped),
	);
	window.dispatchEvent(
		new CustomEvent(TEXTURE_CHANGE_EVENT, {
			detail: { preset: getStoredTexturePreset(), opacity: clamped },
		}),
	);
}

export function isWallpaperMode(value: unknown): value is WallpaperMode {
	return (
		value === "banner" ||
		value === "none" ||
		value === "fullscreen" ||
		value === "overlay"
	);
}

export function getDefaultWallpaperMode(): WallpaperMode {
	const value =
		document.getElementById("config-carrier")?.dataset.wallpaperMode;
	return isWallpaperMode(value) ? value : "none";
}

export function getStoredWallpaperMode(): WallpaperMode {
	const value = localStorage.getItem(WALLPAPER_MODE_KEY);
	return isWallpaperMode(value) ? value : getDefaultWallpaperMode();
}

/** 当前模式是否使用半透明卡片（overlay 全模式；fullscreen 仅 hero 布局） */
function isTransparentCardMode(mode: WallpaperMode): boolean {
	return (
		mode === "overlay" ||
		(mode === "fullscreen" &&
			document.documentElement.dataset.fullscreenLayout === "hero")
	);
}

/** 按当前模式与 fullscreen 布局同步 <html> 的半透明卡片开关（CSS 据此切换卡片底色） */
function syncWallpaperTransparentClass(mode: WallpaperMode): void {
	document.documentElement.dataset.cardTransparent = String(
		isTransparentCardMode(mode),
	);
}

// 壁纸模式 / 布局切换的几何平滑过渡（参考 Firefly）：各模式几何差异大
// （横幅条 ↔ 整屏 fixed），但舞台全程保持可见——旧的「淡出→落位→淡入」
// 编排会露出页面底色造成闪白，且几何硬切表现为图片尺寸跳变。现改为：
// 1. 给 <html> 打 data-wallpaper-switching，激活舞台的高度 / 透明度与图片
//    scale-blur 过渡（仅切换窗口内生效，避免窗口缩放拖慢 100lvh 重排）；
// 2. 立即写入新模式属性并派发事件，CSS 由 html[data-wallpaper-mode] 驱动
//    平滑动画到新形态，图片元素不重载；
// 3. 过渡计时结束后移除属性。快速连续切换时以最后一次为准，计时顺延。
const WALLPAPER_SWITCH_TRANSITION_MS = 520;
let wallpaperSwitchTimer: number | undefined;

/**
 * 打开（或续期）壁纸几何过渡窗口：窗口内舞台高度/透明度与图片 scale-blur
 * 变化按 M3E 时长平滑动画。除模式/布局切换外，Swup 切页导致的
 * --banner-stage-height 变化（首页 ↔ 文章页横幅高度不同）也复用此窗口，
 * 让壁纸高度与 #main-layout top 的既有 top 过渡同步，消除切页空档。
 */
export function beginWallpaperSwitchWindow(): void {
	document.documentElement.dataset.wallpaperSwitching = "true";
	window.clearTimeout(wallpaperSwitchTimer);
	if (prefersReducedMotion()) {
		delete document.documentElement.dataset.wallpaperSwitching;
		wallpaperSwitchTimer = undefined;
		return;
	}
	wallpaperSwitchTimer = window.setTimeout(() => {
		wallpaperSwitchTimer = undefined;
		delete document.documentElement.dataset.wallpaperSwitching;
	}, WALLPAPER_SWITCH_TRANSITION_MS);
}

function applyWallpaperChangeWithFade(apply: () => void): void {
	beginWallpaperSwitchWindow();
	apply();
}

export function applyWallpaperModeToDocument(mode: WallpaperMode): void {
	applyWallpaperChangeWithFade(() => {
		document.documentElement.dataset.wallpaperMode = mode;
		syncWallpaperTransparentClass(mode);
		window.dispatchEvent(
			new CustomEvent(WALLPAPER_MODE_CHANGE_EVENT, { detail: { mode } }),
		);
	});
}

export function setWallpaperMode(mode: WallpaperMode): void {
	localStorage.setItem(WALLPAPER_MODE_KEY, mode);
	applyWallpaperModeToDocument(mode);
}

// 全屏壁纸布局（classic / hero）

export function getDefaultFullscreenLayout(): FullscreenWallpaperLayout {
	return siteConfig.wallpaperMode.fullscreen?.layout === "hero"
		? "hero"
		: "classic";
}

export function getStoredFullscreenLayout(): FullscreenWallpaperLayout {
	const value = localStorage.getItem(WALLPAPER_FULLSCREEN_LAYOUT_KEY);
	return value === "hero" || value === "classic"
		? value
		: getDefaultFullscreenLayout();
}

export function applyFullscreenLayoutToDocument(
	layout: FullscreenWallpaperLayout,
): void {
	const safeLayout = layout === "hero" ? "hero" : "classic";
	applyWallpaperChangeWithFade(() => {
		document.documentElement.dataset.fullscreenLayout = safeLayout;
		// hero 布局在 fullscreen 模式下使用半透明卡片，需重新同步 body 类
		syncWallpaperTransparentClass(getStoredWallpaperMode());
		window.dispatchEvent(
			new CustomEvent(WALLPAPER_FULLSCREEN_LAYOUT_CHANGE_EVENT, {
				detail: { layout: safeLayout },
			}),
		);
	});
}

export function setFullscreenLayout(layout: FullscreenWallpaperLayout): void {
	localStorage.setItem(
		WALLPAPER_FULLSCREEN_LAYOUT_KEY,
		layout === "hero" ? "hero" : "classic",
	);
	applyFullscreenLayoutToDocument(layout);
}

// 覆盖透明模式参数（壁纸透明度 / 背景模糊度 / 卡片透明度）

function clampNumber(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function readStoredNumber(
	key: string,
	min: number,
	max: number,
): number | null {
	const value = localStorage.getItem(key);
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	return Number.isNaN(parsed) ? null : clampNumber(parsed, min, max);
}

export function getDefaultOverlayOpacity(): number {
	return clampNumber(siteConfig.wallpaperMode.overlay?.opacity ?? 0.8, 0, 1);
}

export function getDefaultOverlayBlur(): number {
	return clampNumber(siteConfig.wallpaperMode.overlay?.blur ?? 10, 0, 20);
}

export function getDefaultOverlayCardOpacity(): number {
	return clampNumber(
		siteConfig.wallpaperMode.overlay?.cardOpacity ?? 0.6,
		0,
		1,
	);
}

export function getStoredOverlayOpacity(): number {
	return (
		readStoredNumber(WALLPAPER_OVERLAY_OPACITY_KEY, 0, 1) ??
		getDefaultOverlayOpacity()
	);
}

export function getStoredOverlayBlur(): number {
	return (
		readStoredNumber(WALLPAPER_OVERLAY_BLUR_KEY, 0, 20) ??
		getDefaultOverlayBlur()
	);
}

export function getStoredOverlayCardOpacity(): number {
	return (
		readStoredNumber(WALLPAPER_OVERLAY_CARD_OPACITY_KEY, 0, 1) ??
		getDefaultOverlayCardOpacity()
	);
}

/** 壁纸透明度作用于壁纸容器；模糊作用于壁纸图片；卡片透明度作用于全局半透明卡片色 */
export function applyOverlayOpacityToDocument(opacity: number): void {
	document.documentElement.style.setProperty(
		"--overlay-opacity",
		String(clampNumber(opacity, 0, 1)),
	);
}

export function applyOverlayBlurToDocument(blur: number): void {
	document.documentElement.style.setProperty(
		"--overlay-blur",
		`${clampNumber(blur, 0, 20)}px`,
	);
}

export function applyOverlayCardOpacityToDocument(cardOpacity: number): void {
	document.documentElement.style.setProperty(
		"--card-transparent-opacity",
		String(clampNumber(cardOpacity, 0, 1)),
	);
}

export function applyStoredOverlaySettingsToDocument(): void {
	applyOverlayOpacityToDocument(getStoredOverlayOpacity());
	applyOverlayBlurToDocument(getStoredOverlayBlur());
	applyOverlayCardOpacityToDocument(getStoredOverlayCardOpacity());
}

export function setOverlayOpacity(opacity: number): void {
	const safe = clampNumber(opacity, 0, 1);
	localStorage.setItem(WALLPAPER_OVERLAY_OPACITY_KEY, String(safe));
	applyOverlayOpacityToDocument(safe);
}

export function setOverlayBlur(blur: number): void {
	const safe = clampNumber(blur, 0, 20);
	localStorage.setItem(WALLPAPER_OVERLAY_BLUR_KEY, String(safe));
	applyOverlayBlurToDocument(safe);
}

export function setOverlayCardOpacity(cardOpacity: number): void {
	const safe = clampNumber(cardOpacity, 0, 1);
	localStorage.setItem(WALLPAPER_OVERLAY_CARD_OPACITY_KEY, String(safe));
	applyOverlayCardOpacityToDocument(safe);
}

// 横幅壁纸运行时开关（首页标题 / 轮播 / 水波纹 / 渐变过渡）
// 统一写入 <html> 的 data-* 属性：CSS 与 BannerStage 运行时直接读取，切换即生效。

function applyBannerToggleToDocument(
	attr: string,
	key: string,
	enabled: boolean,
	event: string,
): void {
	localStorage.setItem(key, String(enabled));
	document.documentElement.dataset[attr] = String(enabled);
	window.dispatchEvent(new CustomEvent(event, { detail: { enabled } }));
}

function readStoredToggle(key: string): boolean | null {
	const value = localStorage.getItem(key);
	return value === null ? null : value === "true";
}

export function getDefaultBannerTitleEnabled(): boolean {
	return siteConfig.banner.homeText.enable;
}

export function getStoredBannerTitleEnabled(): boolean {
	return (
		readStoredToggle(BANNER_TITLE_ENABLED_KEY) ?? getDefaultBannerTitleEnabled()
	);
}

export function setBannerTitleEnabled(enabled: boolean): void {
	applyBannerToggleToDocument(
		"bannerTitleEnabled",
		BANNER_TITLE_ENABLED_KEY,
		enabled,
		BANNER_TITLE_CHANGE_EVENT,
	);
}

export function getDefaultBannerCarouselEnabled(): boolean {
	return siteConfig.banner.carousel.enable;
}

export function getStoredBannerCarouselEnabled(): boolean {
	// 站点默认关闭轮播时，访客残留偏好不参与（面板开关也不渲染），与 Layout 内联脚本同语义
	if (!siteConfig.banner.carousel.enable) return false;
	return (
		readStoredToggle(BANNER_CAROUSEL_ENABLED_KEY) ??
		getDefaultBannerCarouselEnabled()
	);
}

export function setBannerCarouselEnabled(enabled: boolean): void {
	applyBannerToggleToDocument(
		"bannerCarouselEnabled",
		BANNER_CAROUSEL_ENABLED_KEY,
		enabled,
		BANNER_CAROUSEL_CHANGE_EVENT,
	);
}

export function getDefaultBannerWavesEnabled(): boolean {
	return siteConfig.banner.waves.enable;
}

export function getStoredBannerWavesEnabled(): boolean {
	return (
		readStoredToggle(BANNER_WAVES_ENABLED_KEY) ?? getDefaultBannerWavesEnabled()
	);
}

export function setBannerWavesEnabled(enabled: boolean): void {
	applyBannerToggleToDocument(
		"bannerWavesEnabled",
		BANNER_WAVES_ENABLED_KEY,
		enabled,
		BANNER_WAVES_CHANGE_EVENT,
	);
}

/** 渐变过渡站点默认值（banner.gradient.enable，默认 true）；与水波纹相互独立 */
export function getDefaultBannerGradientEnabled(): boolean {
	return siteConfig.banner.gradient?.enable ?? true;
}

export function getStoredBannerGradientEnabled(): boolean {
	return (
		readStoredToggle(BANNER_GRADIENT_ENABLED_KEY) ??
		getDefaultBannerGradientEnabled()
	);
}

export function setBannerGradientEnabled(enabled: boolean): void {
	applyBannerToggleToDocument(
		"bannerGradientEnabled",
		BANNER_GRADIENT_ENABLED_KEY,
		enabled,
		BANNER_GRADIENT_CHANGE_EVENT,
	);
}

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
	applyCurrentScheme();
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE): void {
	// 原始模式（light/dark/auto）写入 <html>，供亮暗切换按钮在 SSR 首帧
	// 由纯 CSS 显示正确图标（水合前 Svelte 状态不可用）
	document.documentElement.dataset.themeMode = theme;

	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}

	// Set the theme for Expressive Code based on current mode
	// (light/dark code block themes)
	const isDark = document.documentElement.classList.contains("dark");
	document.documentElement.setAttribute(
		"data-theme",
		isDark
			? (expressiveCodeConfig.darkTheme ?? expressiveCodeConfig.theme)
			: (expressiveCodeConfig.lightTheme ?? expressiveCodeConfig.theme),
	);

	// Dark mode affects the resolved M3/M3E scheme
	applyCurrentScheme();
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}

const MOTION_KEY = "mc-motion";

/** 是否开启「减少动态效果」（手动覆盖 prefers-reduced-motion） */
export function getMotionPreference(): boolean {
	return localStorage.getItem(MOTION_KEY) === "reduced";
}

export function applyMotionPreference(reduced: boolean): void {
	document.documentElement.classList.toggle("motion-reduced", reduced);
}

export function setMotionPreference(reduced: boolean): void {
	localStorage.setItem(MOTION_KEY, reduced ? "reduced" : "full");
	applyMotionPreference(reduced);
}
