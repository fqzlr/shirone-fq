import type { WallpaperMode } from "@/types/config";
import type { SidebarPage } from "@/types/sidebarConfig";

export type BannerViewport = "desktop" | "mobile";
export type BannerContentLayout = "banner" | "compact";

export type BannerCopyMode = "home" | "context" | null;

export interface BannerStateInput {
	mode: WallpaperMode;
	/** 全屏壁纸布局（mode === "fullscreen" 时参与文案判定） */
	fullscreenLayout?: "classic" | "hero";
	page: SidebarPage | undefined;
	viewport: BannerViewport;
	imageCount: number;
	carouselEnabled: boolean;
	reducedMotion: boolean;
	/** 当前页面上下文标题（非空时全屏壁纸模式非首页可显示 context 文案） */
	contextTitle?: string;
}

export interface BannerState {
	visible: boolean;
	assetGroup: BannerViewport | null;
	copyMode: BannerCopyMode;
	rotate: boolean;
	transparentTopAppBar: boolean;
	contentLayout: BannerContentLayout;
}

/**
 * 按壁纸模式解析横幅舞台的可见性与内容形态：
 * - banner：桌面全页 + 移动首页，文案随页面切换（home/context）；
 * - fullscreen：壁纸全屏，所有页面可见；首页显示 home 文案，
 *   classic 布局非首页在横幅条带内展示上下文文案（对齐参考站内页
 *   Hero 标题），hero 布局非首页不显示文案（与 overlay 一致）；
 * - overlay：壁纸固定铺满视口作背景，内容卡片浮于其上，不显示文案；
 * - none：无壁纸。
 */
export function resolveBannerState(input: BannerStateInput): BannerState {
	const isHome = input.page === "home";
	const hasImages = input.imageCount > 0;

	if (input.mode === "fullscreen" || input.mode === "overlay") {
		const visible = hasImages;
		const classicContext =
			input.mode === "fullscreen" &&
			input.fullscreenLayout === "classic" &&
			!isHome &&
			Boolean(input.contextTitle);
		return {
			visible,
			assetGroup: visible ? input.viewport : null,
			copyMode:
				input.mode === "fullscreen" && isHome
					? "home"
					: classicContext
						? "context"
						: null,
			rotate:
				visible &&
				input.carouselEnabled &&
				input.imageCount > 1 &&
				!input.reducedMotion,
			transparentTopAppBar: visible,
			contentLayout: "compact",
		};
	}

	const visible =
		input.mode === "banner" &&
		hasImages &&
		(input.viewport === "desktop" || isHome);

	const copyMode: BannerCopyMode = !visible
		? null
		: isHome
			? "home"
			: "context";

	return {
		visible,
		assetGroup: visible ? input.viewport : null,
		copyMode,
		rotate:
			visible &&
			input.carouselEnabled &&
			input.imageCount > 1 &&
			!input.reducedMotion,
		transparentTopAppBar: visible,
		contentLayout: visible ? "banner" : "compact",
	};
}
