export const LIGHT_MODE = "light",
	DARK_MODE = "dark",
	AUTO_MODE = "auto";
export const DEFAULT_THEME = AUTO_MODE;

export const WALLPAPER_MODE_KEY = "wallpaper-mode";
export const WALLPAPER_MODE_CHANGE_EVENT = "wallpaper-mode:change";
export const WALLPAPER_MODE_OPTIONS = [
	"none",
	"banner",
	"fullscreen",
	"overlay",
] as const;

// 壁纸运行时开关（localStorage 键 + 跨组件同步事件）
export const WALLPAPER_OVERLAY_OPACITY_KEY = "wallpaper-overlay-opacity";
export const WALLPAPER_OVERLAY_BLUR_KEY = "wallpaper-overlay-blur";
export const WALLPAPER_OVERLAY_CARD_OPACITY_KEY =
	"wallpaper-overlay-card-opacity";
export const WALLPAPER_FULLSCREEN_LAYOUT_KEY = "wallpaper-fullscreen-layout";
export const WALLPAPER_FULLSCREEN_LAYOUT_CHANGE_EVENT =
	"wallpaper-fullscreen-layout:change";
export const BANNER_TITLE_ENABLED_KEY = "wallpaper-banner-title";
export const BANNER_TITLE_CHANGE_EVENT = "wallpaper-banner-title:change";
export const BANNER_CAROUSEL_ENABLED_KEY = "wallpaper-banner-carousel";
export const BANNER_CAROUSEL_CHANGE_EVENT = "wallpaper-banner-carousel:change";
export const BANNER_WAVES_ENABLED_KEY = "wallpaper-banner-waves";
export const BANNER_WAVES_CHANGE_EVENT = "wallpaper-banner-waves:change";
export const BANNER_GRADIENT_ENABLED_KEY = "wallpaper-banner-gradient";
export const BANNER_GRADIENT_CHANGE_EVENT = "wallpaper-banner-gradient:change";

// 樱花特效运行时开关
export const SAKURA_ENABLED_KEY = "sakura-enabled";
export const SAKURA_TOGGLE_EVENT = "sakura:toggle";

export const TEXTURE_PRESET_KEY = "texture-preset";
export const TEXTURE_OPACITY_KEY = "texture-opacity";
export const TEXTURE_CHANGE_EVENT = "texture:change";
export const TEXTURE_PRESETS = [
	"none",
	"starlight",
	"cyber-dots",
	"topography",
	"geometric",
	"sakura",
] as const;

// Banner height unit: vh
export const BANNER_HEIGHT = 35;
export const BANNER_HEIGHT_EXTEND = 30;
export const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;

// The height the main panel overlaps the banner, unit: rem
// Keep a small overlap so the content frame meets the wave edge naturally.
export const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT = 1;

// Page width: rem. Single sidebar uses PAGE_WIDTH; dual-column
// arrangement widens the frame one tier (resolved in responsive-utils).
export const PAGE_WIDTH = 85;
export const PAGE_WIDTH_DUAL = 96;
