<script lang="ts">
import PanelStack from "@components/atoms/display/PanelStack.svelte";
import Tabs from "@components/atoms/navigation/Tabs.svelte";
import SegmentedButton from "@components/atoms/selection/SegmentedButton.svelte";
import Slider from "@components/atoms/selection/Slider.svelte";
import Switch from "@components/atoms/selection/Switch.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	defaultMode,
	flipToMode,
	getStoredMode,
	LAYOUT_MODE_CHANGE_EVENT,
	storeMode,
} from "@utils/layout-mode";
import {
	MC_SPECS,
	MC_STYLES,
	type McSpec,
	type McStyle,
	resolveScheme,
} from "@utils/mc-utils";
import {
	getDefaultSakuraEnabled,
	getSakuraEnabled,
	setSakuraEnabled,
} from "@utils/sakura-utils";
import {
	getDefaultBannerCarouselEnabled,
	getDefaultBannerGradientEnabled,
	getDefaultBannerTitleEnabled,
	getDefaultBannerWavesEnabled,
	getDefaultFullscreenLayout,
	getDefaultHue,
	getDefaultOverlayBlur,
	getDefaultOverlayCardOpacity,
	getDefaultOverlayOpacity,
	getDefaultTextureOpacity,
	getDefaultTexturePreset,
	getHue,
	getMotionPreference,
	getStoredBannerCarouselEnabled,
	getStoredBannerGradientEnabled,
	getStoredBannerTitleEnabled,
	getStoredBannerWavesEnabled,
	getStoredFullscreenLayout,
	getStoredOverlayBlur,
	getStoredOverlayCardOpacity,
	getStoredOverlayOpacity,
	getStoredTextureOpacity,
	getStoredTexturePreset,
	getStoredWallpaperMode,
	setBannerCarouselEnabled,
	setBannerGradientEnabled,
	setBannerTitleEnabled,
	setBannerWavesEnabled,
	setFullscreenLayout,
	setHue,
	setMotionPreference,
	setOverlayBlur,
	setOverlayCardOpacity,
	setOverlayOpacity,
	setTextureOpacity,
	setTexturePreset,
	setWallpaperMode,
} from "@utils/setting-utils";
import { getSpec, getStyle, setSpec, setStyle } from "@utils/theme-utils";
import { onMount } from "svelte";
import {
	getDefaultSpec,
	getDefaultStyle,
	resolveDisplaySettings,
	siteConfig,
} from "@/config";
import type { FullscreenWallpaperLayout, WallpaperMode } from "@/types/config";
import type { PostListMode } from "@/types/postListConfig";
import type { TexturePreset } from "@/types/textureConfig";

let { class: className = "" }: { class?: string } = $props();

const displayConfig = resolveDisplaySettings();

const defaultHue = getDefaultHue();
const defaultStyle = getDefaultStyle() as McStyle;
const defaultSpec = getDefaultSpec() as McSpec;
let hue = $state(getHue());
let style = $state<McStyle>(getStyle());
let spec = $state<McSpec>(getSpec());
let dark = $state(
	typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark"),
);

let motionReduced = $state(false);

// 文章列表布局（list/grid）：初始值取访客偏好，变化时存储 + FLIP 重排
const defaultLayoutMode = defaultMode();
let postListMode = $state<PostListMode>(getStoredMode());
let lastAppliedMode = postListMode;

// 壁纸模式与全屏布局
const defaultWallpaperMode = siteConfig.wallpaperMode.defaultMode;
let wallpaperMode = $state<WallpaperMode>(getStoredWallpaperMode());
let lastAppliedWallpaperMode = wallpaperMode;
const defaultFullscreenLayout = getDefaultFullscreenLayout();
let fullscreenLayout = $state<FullscreenWallpaperLayout>(
	getStoredFullscreenLayout(),
);
let lastAppliedFullscreenLayout = fullscreenLayout;

// 覆盖透明参数（透明度 / 模糊 / 卡片透明度，滑块用整数百分比）
const defaultOverlayOpacity = getDefaultOverlayOpacity();
const defaultOverlayBlur = getDefaultOverlayBlur();
const defaultOverlayCardOpacity = getDefaultOverlayCardOpacity();
let overlayOpacityPercent = $state(Math.round(getStoredOverlayOpacity() * 100));
let overlayBlur = $state(getStoredOverlayBlur());
let overlayCardOpacityPercent = $state(
	Math.round(getStoredOverlayCardOpacity() * 100),
);

// 横幅壁纸运行时开关（默认值取站点配置）
const defaultBannerTitle = getDefaultBannerTitleEnabled();
const defaultBannerCarousel = getDefaultBannerCarouselEnabled();
const defaultBannerWaves = getDefaultBannerWavesEnabled();
const defaultBannerGradient = getDefaultBannerGradientEnabled();
let bannerTitleEnabled = $state(getStoredBannerTitleEnabled());
let bannerCarouselEnabled = $state(getStoredBannerCarouselEnabled());
let bannerWavesEnabled = $state(getStoredBannerWavesEnabled());
let bannerGradientEnabled = $state(getStoredBannerGradientEnabled());

// 樱花特效开关
const defaultSakuraEnabled = getDefaultSakuraEnabled();
let sakuraEnabled = $state(getSakuraEnabled());

// 背景纹理预设与浓度
const defaultTexturePreset = getDefaultTexturePreset();
const defaultTextureOpacity = getDefaultTextureOpacity();
let texturePreset = $state<TexturePreset>(getStoredTexturePreset());
let lastAppliedTexturePreset = texturePreset;
let textureOpacity = $state<number>(getStoredTextureOpacity());

const textureOptions: {
	value: TexturePreset;
	labelKey: I18nKey;
	icon: string;
}[] = [
	{
		value: "none",
		labelKey: I18nKey.texturePresetNone,
		icon: "material-symbols:block-rounded",
	},
	{
		value: "starlight",
		labelKey: I18nKey.texturePresetStarlight,
		icon: "material-symbols:auto-awesome-outline-rounded",
	},
	{
		value: "cyber-dots",
		labelKey: I18nKey.texturePresetCyberDots,
		icon: "material-symbols:grid-view-rounded",
	},
	{
		value: "topography",
		labelKey: I18nKey.texturePresetTopography,
		icon: "material-symbols:waves-rounded",
	},
	{
		value: "geometric",
		labelKey: I18nKey.texturePresetGeometric,
		icon: "material-symbols:category-outline-rounded",
	},
	{
		value: "sakura",
		labelKey: I18nKey.texturePresetSakura,
		icon: "material-symbols:local-florist-outline-rounded",
	},
];

// 壁纸模式选项（2×2 宫格，带图标）
const wallpaperModeOptions: {
	value: WallpaperMode;
	labelKey: I18nKey;
	icon: string;
}[] = [
	{
		value: "banner",
		labelKey: I18nKey.wallpaperModeBanner,
		icon: "material-symbols:image-outline",
	},
	{
		value: "fullscreen",
		labelKey: I18nKey.wallpaperModeFullscreen,
		icon: "material-symbols:wallpaper",
	},
	{
		value: "overlay",
		labelKey: I18nKey.wallpaperModeOverlay,
		icon: "material-symbols:full-coverage-outline-rounded",
	},
	{
		value: "none",
		labelKey: I18nKey.wallpaperModeNone,
		icon: "material-symbols:hide-image-outline",
	},
];

// 明暗切换时重算色卡（LightDarkSwitch 改 <html> 的 class）
onMount(() => {
	const observer = new MutationObserver(() => {
		dark = document.documentElement.classList.contains("dark");
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	motionReduced = getMotionPreference();
	return () => observer.disconnect();
});

/** 完整重置：外观 / 壁纸 / 特效全部还原为站点默认（点击即生效，无确认弹窗） */
function confirmReset() {
	hue = defaultHue;
	style = defaultStyle;
	spec = defaultSpec;
	postListMode = defaultLayoutMode;
	wallpaperMode = defaultWallpaperMode;
	fullscreenLayout = defaultFullscreenLayout;
	overlayOpacityPercent = Math.round(defaultOverlayOpacity * 100);
	overlayBlur = defaultOverlayBlur;
	overlayCardOpacityPercent = Math.round(defaultOverlayCardOpacity * 100);
	bannerTitleEnabled = defaultBannerTitle;
	bannerCarouselEnabled = defaultBannerCarousel;
	bannerWavesEnabled = defaultBannerWaves;
	bannerGradientEnabled = defaultBannerGradient;
	sakuraEnabled = defaultSakuraEnabled;
	texturePreset = defaultTexturePreset;
	textureOpacity = defaultTextureOpacity;
}

/** 壁纸设置区整体重置（模式 / 布局 / 透明参数 / 横幅开关） */
function resetWallpaper() {
	wallpaperMode = defaultWallpaperMode;
	fullscreenLayout = defaultFullscreenLayout;
	overlayOpacityPercent = Math.round(defaultOverlayOpacity * 100);
	overlayBlur = defaultOverlayBlur;
	overlayCardOpacityPercent = Math.round(defaultOverlayCardOpacity * 100);
	bannerTitleEnabled = defaultBannerTitle;
	bannerCarouselEnabled = defaultBannerCarousel;
	bannerWavesEnabled = defaultBannerWaves;
	bannerGradientEnabled = defaultBannerGradient;
}

/** 是否有可重置的偏离（控制 Reset 按钮可见性） */
const isDirty = $derived(
	hue !== defaultHue ||
		style !== defaultStyle ||
		spec !== defaultSpec ||
		postListMode !== defaultLayoutMode ||
		wallpaperMode !== defaultWallpaperMode ||
		fullscreenLayout !== defaultFullscreenLayout ||
		overlayOpacityPercent !== Math.round(defaultOverlayOpacity * 100) ||
		overlayBlur !== defaultOverlayBlur ||
		overlayCardOpacityPercent !== Math.round(defaultOverlayCardOpacity * 100) ||
		bannerTitleEnabled !== defaultBannerTitle ||
		bannerCarouselEnabled !== defaultBannerCarousel ||
		bannerWavesEnabled !== defaultBannerWaves ||
		bannerGradientEnabled !== defaultBannerGradient ||
		sakuraEnabled !== defaultSakuraEnabled ||
		texturePreset !== defaultTexturePreset ||
		textureOpacity !== defaultTextureOpacity,
);

const isOverlayDirty = $derived(
	overlayOpacityPercent !== Math.round(defaultOverlayOpacity * 100) ||
		overlayBlur !== defaultOverlayBlur ||
		overlayCardOpacityPercent !== Math.round(defaultOverlayCardOpacity * 100),
);

const isBannerSettingsDirty = $derived(
	bannerTitleEnabled !== defaultBannerTitle ||
		bannerCarouselEnabled !== defaultBannerCarousel ||
		bannerWavesEnabled !== defaultBannerWaves ||
		bannerGradientEnabled !== defaultBannerGradient,
);

$effect(() => {
	if (hue || hue === 0) setHue(hue);
});
$effect(() => {
	setStyle(style);
});
$effect(() => {
	setSpec(spec);
});
$effect(() => {
	setMotionPreference(motionReduced);
});
$effect(() => {
	if (wallpaperMode === lastAppliedWallpaperMode) return;
	lastAppliedWallpaperMode = wallpaperMode;
	setWallpaperMode(wallpaperMode);
});
$effect(() => {
	if (fullscreenLayout === lastAppliedFullscreenLayout) return;
	lastAppliedFullscreenLayout = fullscreenLayout;
	setFullscreenLayout(fullscreenLayout);
});
$effect(() => {
	setOverlayOpacity(overlayOpacityPercent / 100);
});
$effect(() => {
	setOverlayBlur(overlayBlur);
});
$effect(() => {
	setOverlayCardOpacity(overlayCardOpacityPercent / 100);
});
$effect(() => {
	setBannerTitleEnabled(bannerTitleEnabled);
});
$effect(() => {
	setBannerCarouselEnabled(bannerCarouselEnabled);
});
$effect(() => {
	setBannerWavesEnabled(bannerWavesEnabled);
});
$effect(() => {
	setBannerGradientEnabled(bannerGradientEnabled);
});
$effect(() => {
	setSakuraEnabled(sakuraEnabled);
});
$effect(() => {
	if (texturePreset === lastAppliedTexturePreset) return;
	lastAppliedTexturePreset = texturePreset;
	setTexturePreset(texturePreset);
});
$effect(() => {
	setTextureOpacity(textureOpacity);
});
$effect(() => {
	if (postListMode === lastAppliedMode) return;
	lastAppliedMode = postListMode;
	storeMode(postListMode);
	// 全局广播：番剧页等其它消费方（.anime-list）跟随切换并各自 FLIP
	window.dispatchEvent(
		new CustomEvent(LAYOUT_MODE_CHANGE_EVENT, {
			detail: { layout: postListMode },
		}),
	);
	// 首页才有 #post-list；其它页面仅存储偏好 + 事件同步，下次进首页生效
	const container = document.getElementById("post-list");
	if (container) flipToMode(container, postListMode);
});

// ---------------------------------------------------------------------------
// 标签页：外观 / 壁纸 / 特效（仅一个标签可见时隐藏 Tab 栏）
// ---------------------------------------------------------------------------
const hasWallpaperTab = $derived(displayConfig.wallpaperMode === true);
const hasEffectsTab = $derived(
	displayConfig.reduceMotion || displayConfig.effects !== false,
);

const tabItems = $derived([
	{
		value: "appearance",
		label: i18n(I18nKey.settingsTabAppearance),
		icon: "material-symbols:palette",
	},
	...(hasWallpaperTab
		? [
				{
					value: "wallpaper",
					label: i18n(I18nKey.settingsTabWallpaper),
					icon: "material-symbols:wallpaper",
				},
			]
		: []),
	...(hasEffectsTab
		? [
				{
					value: "effects",
					label: i18n(I18nKey.settingsTabEffects),
					icon: "mdi:flower-poppy",
				},
			]
		: []),
]);

let activeTab = $state("appearance");
const showTabBar = $derived(tabItems.length > 1);

// 外观分区折叠：默认全部展开（仅面板内存态，不持久化）
const sectionExpanded = $state<Record<string, boolean>>({
	hue: true,
	colorStyle: true,
	colorSpec: true,
	layout: true,
	texture: true,
});
const toggleSection = (key: string) => {
	sectionExpanded[key] = !sectionExpanded[key];
};

// 当前标签不可见时回退到第一个；进入覆盖透明 / 全屏模式时自动跳到壁纸页
$effect(() => {
	if (!tabItems.some((t) => t.value === activeTab) && tabItems.length) {
		activeTab = tabItems[0].value;
	}
});
$effect(() => {
	if (
		hasWallpaperTab &&
		(wallpaperMode === "overlay" || wallpaperMode === "fullscreen")
	) {
		activeTab = "wallpaper";
	}
});

// 壁纸分区可见性：透明参数用于 overlay（全屏 hero 仅卡片透明度）；横幅开关用于 banner / fullscreen
const showFullscreenLayout = $derived(
	hasWallpaperTab && wallpaperMode === "fullscreen",
);
const showOverlaySettings = $derived(
	hasWallpaperTab &&
		(wallpaperMode === "overlay" ||
			(wallpaperMode === "fullscreen" && fullscreenLayout === "hero")),
);
const showBannerSettings = $derived(
	hasWallpaperTab &&
		(wallpaperMode === "banner" || wallpaperMode === "fullscreen"),
);

function styleKey(s: McStyle): I18nKey {
	switch (s) {
		case "tonalSpot":
			return I18nKey.styleTonalSpot;
		case "vibrant":
			return I18nKey.styleVibrant;
		case "content":
			return I18nKey.styleContent;
		case "expressive":
			return I18nKey.styleExpressive;
		case "rainbow":
			return I18nKey.styleRainbow;
		case "fruitSalad":
			return I18nKey.styleFruitSalad;
		case "monochrome":
			return I18nKey.styleMonochrome;
		case "neutral":
			return I18nKey.styleNeutral;
		case "fidelity":
			return I18nKey.styleFidelity;
	}
}

/** 某个风格在当前色相/明暗/规范下的 primary/secondary/tertiary */
function styleColors(s: McStyle, h: number, d: boolean, sp: McSpec) {
	const scheme = resolveScheme(h, d, s, sp);
	return {
		primary: scheme.primary ?? "#888",
		secondary: scheme.secondary ?? "#888",
		tertiary: scheme.tertiary ?? "#888",
	};
}

/** 当前主色（标题右侧预览圆点） */
const currentColor = $derived(styleColors(style, hue, dark, spec).primary);

/** 9 个风格的色卡预览（3×3 网格） */
const stylePreviews = $derived(
	MC_STYLES.map((s) => ({
		style: s,
		label: i18n(styleKey(s)),
		colors: styleColors(s, hue, dark, spec),
	})),
);
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 {className}">
    <PanelStack>
        <!-- 标签栏：外观 / 壁纸 / 特效（secondary 变体 + 透明背景，融入面板） -->
        {#if showTabBar}
            <div class="p-1.5 pb-0">
                <Tabs bind:value={activeTab} items={tabItems} variant="secondary" class="settings-panel-tabs" />
            </div>
        {/if}

        <!-- 外观：主题配色 + 布局 + 背景纹理 -->
        {#if activeTab === "appearance"}
            <div class="p-4 flex flex-col gap-3">
                <div class="settings-section flex flex-col gap-2" class:settings-section--collapsed={!sectionExpanded.hue}>
                    <div class="flex flex-row gap-1.5 items-center justify-between">
                        <div class="flex gap-1.5 items-center">
                            <!-- 标题样式与下方分区统一（小号 on-surface-variant），可点击折叠 -->
                            <button type="button"
                                    class="settings-section__header text-sm font-bold text-[var(--on-surface-variant)] ml-1"
                                    aria-expanded={sectionExpanded.hue}
                                    onclick={() => toggleSection("hue")}>
                                {i18n(I18nKey.themeColor)}
                                <span class="settings-section__chevron" class:settings-section__chevron--collapsed={!sectionExpanded.hue} aria-hidden="true">
                                    <Icon icon="material-symbols:keyboard-arrow-down" class="text-base" />
                                </span>
                            </button>
                            <button aria-label="Reset to Default" class="float-control w-7 h-7 rounded-md active:scale-90 will-change-transform flex items-center justify-center"
                                    class:opacity-0={!isDirty} class:pointer-events-none={!isDirty} onclick={confirmReset}>
                                <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                            </button>
                        </div>
                        <div class="flex gap-1 items-center">
                            <!-- 当前色相值展示（段内用低一级容器色保持对比） -->
                            <div title={i18n(I18nKey.themeColor)}
                                 class="h-7 min-w-16 px-1 rounded-(--shape-corner-m) flex items-center justify-center
                                        bg-(--surface-container) text-sm font-bold text-(--on-surface)">
                                {hue}
                            </div>
                            <!-- 当前主色实时预览 -->
                            <div class="h-7 w-7 rounded-full" title={i18n(I18nKey.themeColor)}
                                 style={`background: ${currentColor}; box-shadow: inset 0 0 0 1px var(--outline-variant)`}></div>
                        </div>
                    </div>
                    <div class="settings-section__clip">
                        <div class="settings-section__body">
                            <Slider bind:value={hue} min={0} max={360} step={5} label={i18n(I18nKey.themeColor)} />
                        </div>
                    </div>
                </div>

                {#if displayConfig.colorStyle}
                    <div class="settings-section flex flex-col gap-2 pt-1" class:settings-section--collapsed={!sectionExpanded.colorStyle}>
                        <button type="button"
                                class="settings-section__header text-sm font-bold text-[var(--on-surface-variant)] ml-1"
                                aria-expanded={sectionExpanded.colorStyle}
                                onclick={() => toggleSection("colorStyle")}>
                            {i18n(I18nKey.colorStyle)}
                            <span class="settings-section__chevron" class:settings-section__chevron--collapsed={!sectionExpanded.colorStyle} aria-hidden="true">
                                <Icon icon="material-symbols:keyboard-arrow-down" class="text-base" />
                            </span>
                        </button>
                        <div class="settings-section__clip">
                            <div class="settings-section__body">
                                <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label={i18n(I18nKey.colorStyle)}>
                            {#each stylePreviews as p (p.style)}
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={style === p.style}
                                    title={p.label}
                                    aria-label={p.label}
                                    class="m3-style-cell"
                                    class:selected={style === p.style}
                                    onclick={() => (style = p.style)}
                                >
                                    <span class="m3-style-cell__dots">
                                        <span class="m3-style-cell__dot" style={`background: ${p.colors.primary}`}></span>
                                        <span class="m3-style-cell__dot" style={`background: ${p.colors.secondary}`}></span>
                                        <span class="m3-style-cell__dot" style={`background: ${p.colors.tertiary}`}></span>
                                    </span>
                                    <span class="m3-style-cell__name">{p.label}</span>
                                </button>
                            {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                {#if displayConfig.colorSpec}
                    <div class="settings-section flex flex-col gap-1.5 pt-1" class:settings-section--collapsed={!sectionExpanded.colorSpec}>
                        <button type="button"
                                class="settings-section__header text-sm font-bold text-[var(--on-surface-variant)] ml-1"
                                aria-expanded={sectionExpanded.colorSpec}
                                onclick={() => toggleSection("colorSpec")}>
                            {i18n(I18nKey.colorSpec)}
                            <span class="settings-section__chevron" class:settings-section__chevron--collapsed={!sectionExpanded.colorSpec} aria-hidden="true">
                                <Icon icon="material-symbols:keyboard-arrow-down" class="text-base" />
                            </span>
                        </button>
                        <div class="settings-section__clip">
                            <div class="settings-section__body">
                                <SegmentedButton
                                    options={MC_SPECS.map((s) => ({
                                        value: s,
                                        label: s === "2021" ? i18n(I18nKey.spec2021) : i18n(I18nKey.spec2025),
                                    }))}
                                    bind:value={spec}
                                    label={i18n(I18nKey.colorSpec)}
                                />
                            </div>
                        </div>
                    </div>
                {/if}

                {#if displayConfig.layoutMode}
                    <div class="settings-section flex flex-col gap-1.5 pt-1" class:settings-section--collapsed={!sectionExpanded.layout}>
                        <button type="button"
                                class="settings-section__header text-sm font-bold text-[var(--on-surface-variant)] ml-1"
                                aria-expanded={sectionExpanded.layout}
                                onclick={() => toggleSection("layout")}>
                            {i18n(I18nKey.layoutMode)}
                            <span class="settings-section__chevron" class:settings-section__chevron--collapsed={!sectionExpanded.layout} aria-hidden="true">
                                <Icon icon="material-symbols:keyboard-arrow-down" class="text-base" />
                            </span>
                        </button>
                        <div class="settings-section__clip">
                            <div class="settings-section__body">
                                <SegmentedButton
                                    options={[
                                        { value: "list", label: i18n(I18nKey.layoutList) },
                                        { value: "grid", label: i18n(I18nKey.layoutGrid) },
                                    ]}
                                    bind:value={postListMode}
                                    label={i18n(I18nKey.layoutMode)}
                                />
                            </div>
                        </div>
                    </div>
                {/if}

                {#if displayConfig.texture}
                    <div class="settings-section flex flex-col gap-2 pt-1" class:settings-section--collapsed={!sectionExpanded.texture}>
                        <button type="button"
                                class="settings-section__header text-sm font-bold text-[var(--on-surface-variant)] ml-1"
                                aria-expanded={sectionExpanded.texture}
                                onclick={() => toggleSection("texture")}>
                            {i18n(I18nKey.texturePreset)}
                            <span class="settings-section__chevron" class:settings-section__chevron--collapsed={!sectionExpanded.texture} aria-hidden="true">
                                <Icon icon="material-symbols:keyboard-arrow-down" class="text-base" />
                            </span>
                        </button>
                        <div class="settings-section__clip">
                            <div class="settings-section__body">
                                <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label={i18n(I18nKey.texturePreset)}>
                                    {#each textureOptions as opt (opt.value)}
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={texturePreset === opt.value}
                                            title={i18n(opt.labelKey)}
                                            aria-label={i18n(opt.labelKey)}
                                            class="m3-style-cell"
                                            class:selected={texturePreset === opt.value}
                                            onclick={() => (texturePreset = opt.value)}
                                        >
                                            <Icon icon={opt.icon} class="text-lg" />
                                            <span class="m3-style-cell__name">{i18n(opt.labelKey)}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "wallpaper"}
            <!-- 壁纸：模式 + 全屏布局 + 透明设置 + 横幅设置 -->
            <div class="p-4 flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <div class="flex flex-row gap-2 items-center justify-between">
                        <span class="text-sm font-bold text-[var(--on-surface)] ml-1">{i18n(I18nKey.wallpaperMode)}</span>
                        <button aria-label="Reset to Default" class="float-control w-7 h-7 rounded-md active:scale-90 will-change-transform flex items-center justify-center"
                                class:opacity-0={wallpaperMode === defaultWallpaperMode} class:pointer-events-none={wallpaperMode === defaultWallpaperMode}
                                onclick={() => (wallpaperMode = defaultWallpaperMode)}>
                            <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.75rem]"></Icon>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label={i18n(I18nKey.wallpaperMode)}>
                        {#each wallpaperModeOptions as opt (opt.value)}
                            <button
                                type="button"
                                role="radio"
                                aria-checked={wallpaperMode === opt.value}
                                title={i18n(opt.labelKey)}
                                aria-label={i18n(opt.labelKey)}
                                class="m3-mode-cell"
                                class:selected={wallpaperMode === opt.value}
                                onclick={() => (wallpaperMode = opt.value)}
                            >
                                <Icon icon={opt.icon} class="text-[1.25rem]" />
                                <span class="m3-mode-cell__name">{i18n(opt.labelKey)}</span>
                            </button>
                        {/each}
                    </div>
                </div>

                {#if showFullscreenLayout}
                    <div class="flex flex-col gap-1.5 pt-1">
                        <div class="flex flex-row gap-2 items-center justify-between">
                            <span class="text-sm font-bold text-[var(--on-surface)] ml-1">{i18n(I18nKey.fullscreenLayout)}</span>
                            <button aria-label="Reset to Default" class="float-control w-7 h-7 rounded-md active:scale-90 will-change-transform flex items-center justify-center"
                                    class:opacity-0={fullscreenLayout === defaultFullscreenLayout} class:pointer-events-none={fullscreenLayout === defaultFullscreenLayout}
                                    onclick={() => (fullscreenLayout = defaultFullscreenLayout)}>
                                <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.75rem]"></Icon>
                            </button>
                        </div>
                        <SegmentedButton
                            options={[
                                { value: "classic", label: i18n(I18nKey.fullscreenLayoutClassic) },
                                { value: "hero", label: i18n(I18nKey.fullscreenLayoutHero) },
                            ]}
                            bind:value={fullscreenLayout}
                            label={i18n(I18nKey.fullscreenLayout)}
                        />
                    </div>
                {/if}

                {#if showOverlaySettings}
                    <div class="flex flex-col gap-2 pt-1">
                        <div class="flex flex-row gap-2 items-center justify-between">
                            <span class="text-sm font-bold text-[var(--on-surface)] ml-1">{i18n(I18nKey.overlaySettings)}</span>
                            <button aria-label="Reset to Default" class="float-control w-7 h-7 rounded-md active:scale-90 will-change-transform flex items-center justify-center"
                                    class:opacity-0={!isOverlayDirty} class:pointer-events-none={!isOverlayDirty}
                                    onclick={() => {
                                        overlayOpacityPercent = Math.round(defaultOverlayOpacity * 100);
                                        overlayBlur = defaultOverlayBlur;
                                        overlayCardOpacityPercent = Math.round(defaultOverlayCardOpacity * 100);
                                    }}>
                                <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.75rem]"></Icon>
                            </button>
                        </div>
                        {#if wallpaperMode === "overlay"}
                            <div class="m3-slider-row">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-[var(--on-surface-variant)]">{i18n(I18nKey.overlayOpacity)}</span>
                                    <span class="text-xs text-[var(--on-surface-variant)]">{overlayOpacityPercent}%</span>
                                </div>
                                <Slider bind:value={overlayOpacityPercent} min={20} max={100} step={1} label={i18n(I18nKey.overlayOpacity)} />
                            </div>
                        {/if}
                        <div class="m3-slider-row">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-[var(--on-surface-variant)]">{i18n(I18nKey.overlayBlur)}</span>
                                <span class="text-xs text-[var(--on-surface-variant)]">{overlayBlur.toFixed(1)}px</span>
                            </div>
                            <Slider bind:value={overlayBlur} min={0} max={20} step={0.5} label={i18n(I18nKey.overlayBlur)} />
                        </div>
                        <div class="m3-slider-row">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-[var(--on-surface-variant)]">{i18n(I18nKey.overlayCardOpacity)}</span>
                                <span class="text-xs text-[var(--on-surface-variant)]">{overlayCardOpacityPercent}%</span>
                            </div>
                            <Slider bind:value={overlayCardOpacityPercent} min={20} max={100} step={1} label={i18n(I18nKey.overlayCardOpacity)} />
                        </div>
                    </div>
                {/if}

                {#if showBannerSettings}
                    <div class="flex flex-col gap-2 pt-1">
                        <div class="flex flex-row gap-2 items-center justify-between">
                            <span class="text-sm font-bold text-[var(--on-surface)] ml-1">{i18n(I18nKey.wallpaperSettings)}</span>
                            <button aria-label="Reset to Default" class="float-control w-7 h-7 rounded-md active:scale-90 will-change-transform flex items-center justify-center"
                                    class:opacity-0={!isBannerSettingsDirty} class:pointer-events-none={!isBannerSettingsDirty}
                                    onclick={() => {
                                        bannerTitleEnabled = defaultBannerTitle;
                                        bannerCarouselEnabled = defaultBannerCarousel;
                                        bannerWavesEnabled = defaultBannerWaves;
                                        bannerGradientEnabled = defaultBannerGradient;
                                    }}>
                                <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.75rem]"></Icon>
                            </button>
                        </div>
                        {#if siteConfig.banner.homeText.enable && displayConfig.bannerTitle}
                            <div class="m3-toggle-row">
                                <Icon icon="material-symbols:titlecase-rounded" class="text-lg text-[var(--primary)]" />
                                <span class="text-sm font-bold text-[var(--on-surface)] flex-1">{i18n(I18nKey.wallpaperTitle)}</span>
                                <Switch bind:checked={bannerTitleEnabled} label={i18n(I18nKey.wallpaperTitle)} icons />
                            </div>
                        {/if}
                        {#if siteConfig.banner.carousel.enable && displayConfig.bannerCarousel}
                            <div class="m3-toggle-row">
                                <Icon icon="material-symbols:view-carousel-outline" class="text-lg text-[var(--primary)]" />
                                <span class="text-sm font-bold text-[var(--on-surface)] flex-1">{i18n(I18nKey.wallpaperCarousel)}</span>
                                <Switch bind:checked={bannerCarouselEnabled} label={i18n(I18nKey.wallpaperCarousel)} icons />
                            </div>
                        {/if}
                        {#if wallpaperMode === "banner"}
                            {#if siteConfig.banner.waves.enable && displayConfig.bannerWaves}
                                <div class="m3-toggle-row">
                                    <Icon icon="material-symbols:airwave-rounded" class="text-lg text-[var(--primary)]" />
                                    <span class="text-sm font-bold text-[var(--on-surface)] flex-1">{i18n(I18nKey.wavesAnimation)}</span>
                                    <Switch bind:checked={bannerWavesEnabled} label={i18n(I18nKey.wavesAnimation)} icons />
                                </div>
                            {/if}
                            {#if displayConfig.bannerGradient}
                                <div class="m3-toggle-row">
                                    <Icon icon="material-symbols:gradient" class="text-lg text-[var(--primary)]" />
                                    <span class="text-sm font-bold text-[var(--on-surface)] flex-1">{i18n(I18nKey.gradientTransition)}</span>
                                    <Switch bind:checked={bannerGradientEnabled} label={i18n(I18nKey.gradientTransition)} icons />
                                </div>
                            {/if}
                        {/if}
                    </div>
                {/if}
            </div>
        {:else if activeTab === "effects"}
            <!-- 特效：减少动态效果 + 樱花特效 -->
            <div class="p-4 flex flex-col gap-2">
                {#if displayConfig.reduceMotion}
                    <div class="m3-toggle-row">
                        <Icon icon="material-symbols:motion-photos-off" class="text-lg text-[var(--primary)]" />
                        <span class="text-sm font-bold text-[var(--on-surface)] flex-1">{i18n(I18nKey.reduceMotion)}</span>
                        <Switch bind:checked={motionReduced} label={i18n(I18nKey.reduceMotion)} icons />
                    </div>
                {/if}
                {#if displayConfig.effects !== false}
                    <div class="m3-toggle-row">
                        <Icon icon="mdi:flower-poppy" class="text-lg text-[var(--primary)]" />
                        <span class="text-sm font-bold text-[var(--on-surface)] flex-1">{i18n(I18nKey.sakuraEffect)}</span>
                        <Switch bind:checked={sakuraEnabled} label={i18n(I18nKey.sakuraEffect)} icons />
                    </div>
                {/if}
            </div>
        {/if}
    </PanelStack>
</div>


<style lang="stylus">
    /* 设置面板标签栏：对齐 SegmentedButton（配色规范/布局切换）的分段视觉语言——
       surface-container 轨道 + corner-m 外圆角，激活段 corner-s 填充 secondary-container */
    :global(.settings-panel-tabs.m3-tabs)
        background: var(--surface-container)
        box-shadow: none
        height: 2.25rem
        border-radius: var(--shape-corner-m)
        gap: 2px
        padding: 2px

    :global(.settings-panel-tabs .m3-tabs__indicator)
        background: transparent

    :global(.settings-panel-tabs .m3-tabs__tab)
        border-radius: var(--shape-corner-s)
        padding: 0 0.75rem
        font: var(--m3e-type-label-medium)

    :global(.settings-panel-tabs.m3-tabs .m3-tabs__tab--active)
        background: var(--secondary-container)
        color: var(--on-secondary-container)
        box-shadow: var(--m3e-elevation-1)

    :global(.settings-panel-tabs .m3-tabs__tab-icon > svg)
        width: 1.25rem
        height: 1.25rem

    /* 外观分区折叠：标题行可点击，内容用 grid-rows 1fr↔0fr 平滑收展，
       箭头随状态旋转（展开朝下 / 收起朝右） */
    .settings-section
        &__header
            display: flex
            align-items: center
            gap: 0.125rem
            width: fit-content
            padding: 0
            border: none
            background: none
            cursor: pointer
            text-align: left

        &__chevron
            display: flex
            transition: transform var(--m3e-duration-medium) var(--m3e-easing-standard)

        &__chevron--collapsed
            transform: rotate(-90deg)

        &--collapsed &__clip
            grid-template-rows: 0fr

        &__clip
            display: grid
            grid-template-rows: 1fr
            transition: grid-template-rows var(--m3e-duration-medium) var(--m3e-easing-standard)

        &__body
            min-height: 0
            overflow: hidden

    @media (prefers-reduced-motion: reduce)
        .settings-section
            &__clip, &__chevron
                transition: none

    .m3-style-cell
        display: flex
        flex-direction: column
        align-items: center
        justify-content: center
        gap: 0.375rem
        padding: 0.5rem 0.25rem
        border: none
        border-radius: var(--shape-corner-s)
        background: transparent
        color: var(--on-surface-variant)
        font: var(--m3e-type-label-small)
        cursor: pointer
        user-select: none
        transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard), color var(--m3e-duration-short) var(--m3e-easing-standard)
        &:hover
            background: unquote("color-mix(in oklab, var(--on-surface) 6%, transparent)")
        &.selected
            background: var(--secondary-container)
            color: var(--on-secondary-container)

        &__dots
            display: flex
            gap: 0.25rem

        &__dot
            width: 0.625rem
            height: 0.625rem
            border-radius: var(--shape-corner-full)
            box-shadow: unquote("inset 0 0 0 1px color-mix(in oklab, var(--on-surface) 20%, transparent)")

        &__name
            max-width: 100%
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap

    /* 壁纸模式 2×2 宫格按钮 */
    .m3-mode-cell
        display: flex
        align-items: center
        justify-content: center
        gap: 0.5rem
        padding: 0.625rem 0.5rem
        border: none
        border-radius: var(--shape-corner-m)
        background: var(--btn-regular-bg)
        color: var(--btn-content)
        font: var(--m3e-type-label-medium)
        cursor: pointer
        user-select: none
        transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard), color var(--m3e-duration-short) var(--m3e-easing-standard)
        &:hover
            background: var(--btn-regular-bg-hover)
        &.selected
            background: var(--secondary-container)
            color: var(--on-secondary-container)

        &__name
            min-width: 0
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap

    /* 透明设置滑块行 */
    .m3-slider-row
        display: flex
        flex-direction: column
        gap: 0.25rem
        padding: 0.625rem 0.75rem
        border-radius: var(--shape-corner-m)
        background: var(--btn-regular-bg)

    /* 特效 / 壁纸开关行 */
    .m3-toggle-row
        display: flex
        align-items: center
        gap: 0.625rem
        padding: 0.625rem 0.75rem
        border-radius: var(--shape-corner-m)
        background: var(--btn-regular-bg)

</style>
