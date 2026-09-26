export type { PermalinkConfig } from "./permalinkConfig.ts";

import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";
import type { SakuraConfig } from "./effectsConfig";
import type { TextureConfig } from "./textureConfig";

export type WallpaperMode = "banner" | "fullscreen" | "overlay" | "none";

/** 全屏壁纸模式的内容布局："classic" 内容紧随导航栏，"hero" 首页首屏整屏展示壁纸 */
export type FullscreenWallpaperLayout = "classic" | "hero";

/** 首页横幅快捷入口按钮：text + icon 渲染文字胶囊，仅 icon 渲染圆形图标按钮 */
export interface BannerHomeLink {
	/** 按钮文案；省略时渲染为圆形图标按钮 */
	text?: string;
	/** astro-icon 图标名（如 "material-symbols:send-outline-rounded"） */
	icon: string;
	/** 跳转地址 */
	url: string;
	/** 无文字按钮的访问名称（aria-label），纯图标按钮建议提供 */
	ariaLabel?: string;
	/** 是否在新标签页打开（默认按 url 是否为 http(s) 判断） */
	external?: boolean;
}

/**
 * 统一页面开关：`false` 时该页路由跳转 `/404/`，顶栏与移动抽屉的导航入口
 * 自动隐藏（navBarConfig 输出统一过滤，无需改 nav-bar.yaml）。
 * 键名是 navBar `pageKey` 语义的子集；`home` 与 `archive` 永远开放，不提供开关。
 */
export type PageToggles = {
	/** 友链页 /friends/ */
	friends: boolean;
	/** 留言板页 /guestbook/ */
	guestbook: boolean;
	/** 打赏页 /sponsor/，与 sponsorConfig.enable 取 AND */
	sponsor: boolean;
	/** 动态页 /moments/ */
	moments: boolean;
	/** 番剧页 /anime/，与 animeConfig.enable 取 AND */
	anime: boolean;
	/** 罗盘页 /compass/ */
	compass: boolean;
	/** 技能页 /skills/，与 skillsConfig.enable 取 AND */
	skills: boolean;
	/** 项目页 /projects/，与 projectsConfig.enable 取 AND */
	projects: boolean;
	/** 设备页 /devices/，与 devicesConfig.enable 取 AND */
	devices: boolean;
	/** 时间线页 /timeline/，与 timelineConfig.enable 取 AND */
	timeline: boolean;
	/** 相册页 /albums/ 与 /albums/[id]/ */
	albums: boolean;
	/** 分类索引页 /categories/ */
	categories: boolean;
	/** 标签索引页 /tags/ */
	tags: boolean;
	/** 关于页 /about/ */
	about: boolean;
};

export type TopAppBarContentAlign = "left" | "center";

export type DisplaySettingsConfig = {
	/** 是否在显示设置面板展示配色风格（9 宫格）选择器（默认 true） */
	colorStyle?: boolean;
	/** 是否在显示设置面板展示 Color Spec（调色规范 2021 / 2025）切换器（默认 true） */
	colorSpec?: boolean;
	/** 是否在显示设置面板展示 Page background（页面背景 纯色 / 横幅）切换器（默认 true） */
	wallpaperMode?: boolean;
	/** 是否在显示设置面板展示 Layout（文章列表布局 列表 / 网格）切换器（默认 true） */
	layoutMode?: boolean;
	/** 是否在显示设置面板展示 Reduce motion（减少动效）切换器（默认 true） */
	reduceMotion?: boolean;
	/** 是否在显示设置面板展示背景纹理选择器（默认 true，且受 texture.enable 控制） */
	texture?: boolean;
	/** 是否在显示设置面板展示樱花特效开关（默认 true，且受 effects.sakura 提供默认值） */
	effects?: boolean;
	/** 是否在显示设置面板展示「首页壁纸标题」开关（默认 true，且受 banner.homeText.enable 控制） */
	bannerTitle?: boolean;
	/** 是否在显示设置面板展示「壁纸轮播」开关（默认 true，且受 banner.carousel.enable 控制） */
	bannerCarousel?: boolean;
	/** 是否在显示设置面板展示「水波纹动画」开关（默认 true，仅横幅模式显示，且受 banner.waves.enable 控制） */
	bannerWaves?: boolean;
	/** 是否在显示设置面板展示「渐变过渡」开关（默认 true，仅横幅模式显示） */
	bannerGradient?: boolean;
};

export type SiteConfig = {
	site: string;
	base?: string;
	title: string;
	subtitle: string;
	topAppBar: {
		/** 桌面端标题与导航内容组的对齐方式。 */
		contentAlign: TopAppBarContentAlign;
	};

	/** 显示设置浮层各切换项的前端可见性控制 */
	displaySettings?: DisplaySettingsConfig;

	/** 统一页面开关（12 个内容页，默认全开；与行为领域 enable 取 AND，判定见 src/utils/page-availability.ts） */
	pages: PageToggles;

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	/** IANA time zone used to interpret precise content timestamps. */
	timeZone: string;

	themeColor: {
		hue: number;
		fixed: boolean;
		style: string;
		spec: string;
	};
	wallpaperMode: {
		defaultMode: WallpaperMode;
		/** 全屏壁纸模式默认布局（访客可在设置面板中切换并保存到浏览器） */
		fullscreen?: {
			layout?: FullscreenWallpaperLayout;
		};
		/** 覆盖透明模式默认参数（访客可在设置面板中调节并保存到浏览器） */
		overlay?: {
			/** 壁纸整体不透明度 0-1（默认 0.8） */
			opacity?: number;
			/** 壁纸模糊半径 px 0-20（默认 10） */
			blur?: number;
			/** 半透明卡片不透明度 0-1（默认 0.6） */
			cardOpacity?: number;
		};
	};
	/** 页面背景纹理系统配置，支持布尔值直接开关或详细配置对象 */
	texture?: boolean | TextureConfig;
	/** 页面特效配置（樱花飘落等画布特效），enable: false 时零负担 */
	effects?: {
		sakura?: SakuraConfig;
	};
	banner: {
		src: {
			desktop: string[];
			mobile: string[];
		};
		position?: "top" | "center" | "bottom";
		/** 轮播关闭（静态 Banner）时的主图选择："first" 用列表第一项（默认）| "random" 每次访问随机选一项（随机到视频播完停最后一帧）；轮播开启时不生效 */
		pick?: "first" | "random";
		dim: {
			enable: boolean;
			opacity: number;
		};
		homeText: {
			enable: boolean;
			title: string;
			/** 首页副标题文本，支持单条字符串或多条交替循环的字符串数组 */
			subtitle: string | string[];
			/** 标题下方的快捷入口按钮；省略或空数组时零 DOM（零额外负担） */
			links?: BannerHomeLink[];
			typewriter: {
				enable: boolean;
				/** 打字速度（每个字符间隔，毫秒，默认 120） */
				speed: number;
				/** 回退反向删除速度（每个字符间隔，毫秒，默认 50） */
				deleteSpeed?: number;
				/** 打字完成后等待停顿时间（毫秒，默认 2000） */
				pauseTime?: number;
				/** 完成后是否循环播放（默认 true） */
				loop: boolean;
			};
		};
		/** 横幅背景视频：enable: false（默认）时不输出 video 元素与播放控件（零额外负担） */
		video?: {
			enable: boolean;
			/** 视频源列表（public 路径或远程 URL），至少一项时播放控件才可用 */
			src: string[];
			/** 多视频播放顺序："order" 按数组顺序（默认）| "random" 随机 */
			mode?: "order" | "random";
		};
		carousel: {
			enable: boolean;
			interval: number;
			/** 交叉淡入淡出过渡时长（毫秒，默认 1200） */
			fadeDuration?: number;
			/** 运镜呼吸动画模式："ken-burns"（默认，序列运镜）| "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "none" */
			animation?:
				| "ken-burns"
				| "zoom-in"
				| "zoom-out"
				| "pan-left"
				| "pan-right"
				| "none";
		};
		waves: {
			enable: boolean;
		};
		/** 渐变过渡：横幅模式切换页面时的渐变动画，enable 为访客开关的站点默认值 */
		gradient?: {
			enable?: boolean;
		};
	};
	/** Markdown 正文图片处理配置。 */
	imageOptimization?: {
		/** 添加 `referrerpolicy="no-referrer"` 的远程图片域名，支持 `*.example.com` 通配符。 */
		noReferrerDomains?: string[];
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	/** 进度条预设样式（页面切换进度条等，仅线性扫描模式） */
	progressIndicator: {
		/** dual 双向扫描（官方默认双线）/ single 单向扫描（单线） */
		style: "dual" | "single";
	};

	favicon: Favicon[];
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	publishedAt?: Date;
	updated?: Date;
	updatedAt?: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	alias?: string;
	permalink?: string;
	prevTitle?: string;
	prevUrl?: string;
	nextUrl?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
	lightTheme?: string;
	darkTheme?: string;
};
