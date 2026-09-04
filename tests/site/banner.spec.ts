import { expect, test } from "@playwright/test";
import { resolveBannerState } from "../../src/utils/banner-state";

function isBannerAsset(value: string): boolean {
	return /\/assets\/(?:images\/)?banner\//.test(decodeURIComponent(value));
}

function isBannerVariant(
	value: string,
	variant: "desktop" | "mobile",
): boolean {
	return decodeURIComponent(value).includes(`/banner/${variant}/`);
}

async function waitForBannerState(
	page: import("@playwright/test").Page,
	visible: boolean,
) {
	await page.waitForFunction(
		(expected) => document.body.dataset.bannerVisible === String(expected),
		visible,
	);
}

async function expectSubtitleTyping(page: import("@playwright/test").Page) {
	const subtitle = page.locator("#banner-wrapper [data-banner-home-copy] p");
	const expected = "不因虚度年华而悔恨，不因碌碌无为而羞愧";
	await expect(subtitle).toHaveAttribute("data-subtitle-state", "typing");
	const typingText = await subtitle.textContent();
	expect(typingText).toBeTruthy();
	expect(expected.startsWith(typingText ?? "")).toBe(true);
	await expect(subtitle).toHaveAttribute("data-subtitle-state", "complete", {
		timeout: 7_500,
	});
	await expect(subtitle).toHaveText(expected);
}

const HOME_SUBTITLES = [
	"不因虚度年华而悔恨，不因碌碌无为而羞愧",
	"人不能同时拥有青春和对青春的感受",
	"清醒是痛苦的，但糊涂是需要天赋的",
	"我们都在阴沟里，但仍有人仰望星空",
	"人生是旷野，不是轨道",
	"凡是过往，皆为序章",
];

async function expectBannerOverlap(page: import("@playwright/test").Page) {
	const geometry = await page.evaluate(() => {
		const banner = document.getElementById("banner-wrapper");
		const categoryBar = document.getElementById("category-bar-region");
		if (!banner || !categoryBar) return null;

		const rootStyle = getComputedStyle(document.documentElement);
		const resolveLength = (property: string): number => {
			let value = rootStyle.getPropertyValue(property).trim();
			const variable = value.match(/^var\((--[^,)]+)/);
			if (variable) value = rootStyle.getPropertyValue(variable[1]).trim();
			const numericValue = Number.parseFloat(value);
			return value.endsWith("rem")
				? numericValue * Number.parseFloat(rootStyle.fontSize)
				: numericValue;
		};

		return {
			actual:
				banner.getBoundingClientRect().bottom -
				categoryBar.getBoundingClientRect().top,
			expected: resolveLength("--banner-panel-overlap"),
		};
	});

	expect(geometry).not.toBeNull();
	expect(geometry?.actual).toBeCloseTo(geometry?.expected ?? 0, 0);
}

async function expectWaveGeometry(
	page: import("@playwright/test").Page,
	expectedScale: string,
) {
	const geometry = await page.locator(".banner-waves").evaluate((waves) => {
		const rootStyle = getComputedStyle(document.documentElement);
		const layer = waves.querySelector<HTMLElement>(".banner-waves__layer");
		if (!layer) return null;
		const overlapProperty = rootStyle
			.getPropertyValue("--banner-panel-overlap")
			.trim();
		const overlapVariable = overlapProperty.match(/^var\((--[^,)]+)/);
		const overlapValue = overlapVariable
			? rootStyle.getPropertyValue(overlapVariable[1]).trim()
			: overlapProperty;
		const overlap = Number.parseFloat(overlapValue);
		return {
			height: waves.getBoundingClientRect().height,
			overlap: overlapValue.endsWith("rem")
				? overlap * Number.parseFloat(rootStyle.fontSize)
				: overlap,
			scale: getComputedStyle(layer)
				.getPropertyValue("--banner-wave-scale-y")
				.trim(),
		};
	});

	expect(geometry).not.toBeNull();
	expect(geometry?.height).toBeGreaterThan(geometry?.overlap ?? 0);
	expect(Number(geometry?.scale)).toBe(Number(expectedScale));
}

async function expectWavesAnimated(
	page: import("@playwright/test").Page,
	animated: boolean,
) {
	await expect(page.locator(".banner-waves")).toBeVisible();
	const animationCount = await page
		.locator(".banner-waves")
		.evaluate((waves) => waves.getAnimations({ subtree: true }).length);
	expect(animationCount > 0).toBe(animated);
}

async function expectRouteProgressAtAppBarBottom(
	page: import("@playwright/test").Page,
) {
	const rootSize = await page.evaluate(() =>
		Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
	);
	await expect(page.locator(".route-progress")).toHaveCSS(
		"top",
		`${rootSize * 4}px`,
	);
}

async function expectCompactTop(page: import("@playwright/test").Page) {
	const rootSize = await page.evaluate(() =>
		Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
	);
	await expect(page.locator("#main-layout")).toHaveCSS(
		"top",
		`${rootSize * 5.5}px`,
	);
}

test.describe("banner wallpaper", () => {
	test("uses mutually exclusive home and contextual copy modes", () => {
		const base = {
			mode: "banner" as const,
			viewport: "desktop" as const,
			imageCount: 1,
			carouselEnabled: false,
			reducedMotion: false,
		};
		expect(resolveBannerState({ ...base, page: "home" }).copyMode).toBe("home");
		expect(resolveBannerState({ ...base, page: "post" }).copyMode).toBe(
			"context",
		);
		expect(
			resolveBannerState({ ...base, viewport: "mobile", page: "post" })
				.copyMode,
		).toBeNull();
		// 全屏壁纸模式：仅首页显示 home 文案，非首页与 overlay 一致不显示
		expect(
			resolveBannerState({ ...base, mode: "fullscreen", page: "home" })
				.copyMode,
		).toBe("home");
		expect(
			resolveBannerState({ ...base, mode: "fullscreen", page: "post" })
				.copyMode,
		).toBeNull();
		expect(
			resolveBannerState({ ...base, mode: "overlay", page: "home" }).copyMode,
		).toBeNull();
	});

	test("server response includes article banner context", async ({
		request,
	}) => {
		const response = await request.get("/posts/tech/git-guide/");
		expect(response.ok()).toBe(true);
		const html = await response.text();
		expect(html).toContain("data-banner-context-title");
		expect(html).toContain("Git 详细使用方法：从第一次提交到团队协作");
		expect(html).toContain(
			"从安装配置到分支协作，把日常开发需要的 Git 命令一次讲清楚，附常见翻车现场的救援方法。",
		);
		expect(html).toContain('datetime="2026-08-10"');
	});

	test("centers article context in a bounded box with home-scale type", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto("/posts/tech/git-guide/", {
			waitUntil: "domcontentloaded",
		});
		await waitForBannerState(page, true);
		const stage = page.locator("#banner-wrapper");
		const context = stage.locator("[data-banner-context]");
		await expect(stage).toHaveAttribute("data-copy-mode", "context");
		await expect(context).toBeVisible();
		await expect(context.locator("[data-banner-context-title]")).toHaveText(
			"Git 详细使用方法：从第一次提交到团队协作",
		);
		await expect(
			context.locator("[data-banner-context-description]"),
		).toHaveText(
			"从安装配置到分支协作，把日常开发需要的 Git 命令一次讲清楚，附常见翻车现场的救援方法。",
		);
		await expect(context.locator("time")).toHaveAttribute(
			"datetime",
			"2026-08-10",
		);

		const layout = await context.evaluate((element) => {
			const stage = document.getElementById("banner-wrapper");
			const homeTitle = document.querySelector<HTMLElement>(
				"[data-banner-home-copy] h1",
			);
			const title = element.querySelector<HTMLElement>(
				"[data-banner-context-title]",
			);
			if (!stage || !homeTitle || !title) return null;
			const stageRect = stage.getBoundingClientRect();
			const boxRect = element.getBoundingClientRect();
			return {
				centerX: Math.abs(
					boxRect.left +
						boxRect.width / 2 -
						(stageRect.left + stageRect.width / 2),
				),
				centerY: Math.abs(
					boxRect.top +
						boxRect.height / 2 -
						(stageRect.top + stageRect.height / 2),
				),
				boxWidth: boxRect.width,
				maxWidth: Number.parseFloat(getComputedStyle(element).maxWidth),
				titleSize: getComputedStyle(title).fontSize,
				homeTitleSize: getComputedStyle(homeTitle).fontSize,
				textAlign: getComputedStyle(element).textAlign,
				overflows:
					element.scrollWidth > element.clientWidth ||
					element.scrollHeight > element.clientHeight,
			};
		});
		expect(layout).not.toBeNull();
		expect(layout?.centerX).toBeLessThan(1);
		expect(layout?.centerY).toBeLessThan(1);
		expect(layout?.boxWidth).toBeLessThanOrEqual(1024);
		// 标题能完整放下时与主页标题同字号；过长被缩放时字号介于最小值与满档之间
		const contextTitle = context.locator("[data-banner-context-title]");
		const titleFit = await contextTitle.getAttribute("data-title-fit");
		if (titleFit === "full") {
			expect(layout?.titleSize).toBe(layout?.homeTitleSize);
		} else if (titleFit === "scaled") {
			expect(Number.parseFloat(layout?.titleSize ?? "0")).toBeLessThan(
				Number.parseFloat(layout?.homeTitleSize ?? "0"),
			);
			expect(
				Number.parseFloat(layout?.titleSize ?? "0"),
			).toBeGreaterThanOrEqual(36);
		}
		expect(layout?.textAlign).toBe("center");
		expect(layout?.overflows).toBe(false);
	});

	test("fits long contextual titles onto one line at desktop widths", async ({
		page,
	}) => {
		for (const width of [1440, 1024]) {
			await page.setViewportSize({ width, height: 1000 });
			await page.goto("/posts/tech/git-guide/", {
				waitUntil: "domcontentloaded",
			});
			await waitForBannerState(page, true);
			const title = page.locator("[data-banner-context-title]");
			await expect(title).toHaveAttribute("data-title-fit", "scaled");
			const layout = await title.evaluate((element) => {
				const style = getComputedStyle(element);
				return {
					fontSize: Number.parseFloat(style.fontSize),
					lineHeight: Number.parseFloat(style.lineHeight),
					height: element.getBoundingClientRect().height,
					overflows: element.scrollWidth > element.clientWidth,
					whiteSpace: style.whiteSpace,
				};
			});
			expect(layout.overflows).toBe(false);
			expect(layout.whiteSpace).toBe("nowrap");
			expect(layout.height).toBeLessThanOrEqual(layout.lineHeight + 1);
			expect(layout.fontSize).toBeGreaterThanOrEqual(36);
			expect(layout.fontSize).toBeLessThan(80);
		}
	});

	test("shows localized context on a non-post page", async ({ page }) => {
		await page.goto("/friends/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		const context = page.locator("[data-banner-context]");
		await expect(context.locator("[data-banner-context-title]")).toHaveText(
			"友链",
		);
		await expect(
			context.locator("[data-banner-context-description]"),
		).toHaveText("欢迎交换友链，申请方式见「关于」页。");
		await expect(context.locator("[data-banner-context-meta]")).toBeHidden();
	});

	test("shows collection context and omits duplicate supporting text", async ({
		page,
	}) => {
		await page.goto("/archive/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(page.locator("[data-banner-context-title]")).toHaveText(
			"归档",
		);
		await expect(page.locator("[data-banner-context-description]")).toHaveText(
			/^\d+ 篇文章$/,
		);

		await page.goto("/about/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(page.locator("[data-banner-context-title]")).toHaveText(
			"关于",
		);
		await expect(page.locator("[data-banner-context-details]")).toBeHidden();
	});

	test("server response keeps the complete home subtitle", async ({
		request,
	}) => {
		const response = await request.get("/");
		expect(response.ok()).toBe(true);
		const html = await response.text();
		expect(html).toContain(HOME_SUBTITLES[0]);
		expect(html).toContain("<picture");
		expect(html).toContain('type="image/avif"');
		expect(html).toContain("srcset=");
		expect(html).toContain('fetchpriority="high"');
		expect(html).not.toContain("/assets/banner/desktop/1.webp");
	});

	test("desktop exposes subtitle typewriter controls", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-subtitle-typewriter-enabled",
			"true",
		);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-subtitle-typewriter-speed",
			"150",
		);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-subtitle-typewriter-delete-speed",
			"50",
		);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-subtitle-typewriter-pause-time",
			"2000",
		);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-subtitle-typewriter-loop",
			"true",
		);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-home-subtitles",
			JSON.stringify(HOME_SUBTITLES),
		);
	});

	test("desktop loads only desktop images and types home subtitle", async ({
		page,
	}) => {
		const requests: string[] = [];
		page.on("request", (request) => {
			if (isBannerAsset(request.url())) requests.push(request.url());
		});

		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(page.locator("#banner-wrapper h1")).toHaveText("Fqzlrのblog");
		await expectSubtitleTyping(page);
		await expect(page.locator("#navbar")).toHaveClass(
			/top-app-bar--transparent/,
		);
		await expect(page.locator(".route-progress")).toHaveCSS("top", "0px");
		await expect(page.locator(".banner-waves__layer")).toHaveCount(4);
		await expectWavesAnimated(page, true);
		await expectBannerOverlap(page);
		await expectWaveGeometry(page, "1");
		await expect(page.locator("#main-layout")).toHaveCSS(
			"top",
			/^[4-9]\d{2}(\.\d+)?px$/,
		);
		expect(
			requests.some((request) => isBannerVariant(request, "desktop")),
		).toBe(true);
		expect(requests.some((request) => isBannerVariant(request, "mobile"))).toBe(
			false,
		);
		expect(
			await page
				.locator(".banner-stage__image--front")
				.evaluate((image) => image.getAnimations().length),
		).toBe(0);
	});

	test("desktop progress moves below the app bar after leaving the Banner", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(page.locator(".route-progress")).toHaveCSS("top", "0px");

		await page.evaluate(() => window.scrollTo(0, window.innerHeight));
		await page.waitForFunction(
			() => document.body.dataset.bannerScrolled === "true",
		);
		await expect(page.locator("#navbar")).not.toHaveClass(
			/top-app-bar--transparent/,
		);
		await expectRouteProgressAtAppBarBottom(page);
	});

	test("mobile post hides wallpaper and keeps compact content geometry", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		const requests: string[] = [];
		page.on("request", (request) => {
			if (isBannerAsset(request.url())) requests.push(request.url());
		});

		await page.goto("/posts/tech/git-guide/", {
			waitUntil: "domcontentloaded",
		});
		await waitForBannerState(page, false);
		await expect(page.locator("#banner-wrapper")).toBeHidden();
		await expect(page.locator(".banner-waves")).toBeHidden();
		await expectCompactTop(page);
		await expect(page.locator("#navbar")).not.toHaveClass(
			/top-app-bar--transparent/,
		);
		await expectRouteProgressAtAppBarBottom(page);
		expect(requests).toEqual([]);
	});

	test("mobile home loads only mobile image resources", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		const requests: string[] = [];
		page.on("request", (request) => {
			if (isBannerAsset(request.url())) requests.push(request.url());
		});

		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expectWavesAnimated(page, true);
		await expectBannerOverlap(page);
		await expectWaveGeometry(page, "0.72");
		expect(requests.some((request) => isBannerVariant(request, "mobile"))).toBe(
			true,
		);
		expect(
			requests.some((request) => isBannerVariant(request, "desktop")),
		).toBe(false);
	});

	test("tablet home keeps the full wave geometry at the desktop breakpoint", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 768, height: 900 });
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expectWavesAnimated(page, true);
		await expectBannerOverlap(page);
		await expectWaveGeometry(page, "1");
	});

	test("solid preference persists after SSR banner discovery", async ({
		page,
	}) => {
		await page.addInitScript(() =>
			localStorage.setItem("wallpaper-mode", "none"),
		);
		const requests: string[] = [];
		page.on("request", (request) => {
			if (isBannerAsset(request.url())) requests.push(request.url());
		});

		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, false);
		await expect(page.locator("#banner-wrapper")).toBeHidden();
		await expect(page.locator(".banner-waves")).toBeHidden();
		await expectCompactTop(page);
		expect(requests).toHaveLength(1);
		expect(isBannerVariant(requests[0], "desktop")).toBe(true);
	});

	test("display settings switches modes immediately and persists", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await page.locator("#display-settings-switch").click();
		// 壁纸模式选项位于「壁纸」标签页，先切换标签再点击模式
		await page.getByRole("tab", { name: /Wallpaper|壁纸/ }).click();
		await page.getByText(/Solid|纯色/).click();
		await waitForBannerState(page, false);
		expect(
			await page.evaluate(() => localStorage.getItem("wallpaper-mode")),
		).toBe("none");
		await expectCompactTop(page);

		await page.reload({ waitUntil: "domcontentloaded" });
		await waitForBannerState(page, false);
		await page.locator("#display-settings-switch").click();
		await page.getByRole("tab", { name: /Wallpaper|壁纸/ }).click();
		await page.getByText(/Banner|横幅/).click();
		await waitForBannerState(page, true);
	});

	test("automatic carousel crossfades to the next desktop image", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		const desktopImageCount = await page
			.locator("#banner-wrapper")
			.evaluate((stage) => {
				const value = (stage as HTMLElement).dataset.desktopImages;
				return value ? JSON.parse(value).length : 0;
			});
		test.skip(
			desktopImageCount < 2,
			"carousel requires at least two desktop images",
		);
		const before = await page
			.locator(".banner-stage__image--active")
			.getAttribute("src");
		await page.waitForFunction(
			(initial) =>
				document
					.querySelector<HTMLImageElement>(".banner-stage__image--active")
					?.getAttribute("src") !== initial,
			before,
			{ timeout: 7500 },
		);
		const after = await page
			.locator(".banner-stage__image--active")
			.getAttribute("src");
		expect(after).not.toBe(before);
	});

	test("reduced motion keeps the initial slide static", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(
			page.locator("#banner-wrapper [data-banner-home-copy] p"),
		).toHaveText(HOME_SUBTITLES[0]);
		await expect(
			page.locator("#banner-wrapper [data-banner-home-copy] p"),
		).toHaveAttribute("data-subtitle-state", "complete");
		await expectWavesAnimated(page, false);
		const before = await page
			.locator(".banner-stage__image--active")
			.getAttribute("src");
		await page.waitForTimeout(6500);
		const after = await page
			.locator(".banner-stage__image--active")
			.getAttribute("src");
		expect(after).toBe(before);
	});

	test("manual reduced motion keeps the wave boundary static", async ({
		page,
	}) => {
		await page.addInitScript(() =>
			localStorage.setItem("mc-motion", "reduced"),
		);
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(
			page.locator("#banner-wrapper [data-banner-home-copy] p"),
		).toHaveText(HOME_SUBTITLES[0]);
		await expect(
			page.locator("#banner-wrapper [data-banner-home-copy] p"),
		).toHaveAttribute("data-subtitle-state", "complete");
		await expect(page.locator("html")).toHaveClass(/motion-reduced/);
		await expectWavesAnimated(page, false);
	});

	test("Swup replaces contextual copy without retaining the previous page", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await waitForBannerState(page, true);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"data-copy-mode",
			"home",
		);
		await page.waitForFunction(() => Boolean(window.swup?.hooks));

		await page.evaluate(() => {
			(
				window as typeof window & { __swupPersistenceProbe?: string }
			).__swupPersistenceProbe = "preserved";
		});
		await page
			.locator(
				'#swup-container a.m3-blog-postcard__title[href="/posts/philosophy/wittgenstein-language-limits/"]',
			)
			.click();
		await page.waitForFunction(
			() =>
				document.getElementById("swup-container")?.dataset.currentPage ===
				"post",
		);
		await expect(page.locator("[data-banner-context-title]")).toHaveText(
			"维特根斯坦：语言的边界就是世界的边界",
		);
		await expect(page.locator("#banner-wrapper")).toHaveAttribute(
			"aria-label",
			"维特根斯坦：语言的边界就是世界的边界",
		);
		expect(
			await page.evaluate(
				() =>
					(window as typeof window & { __swupPersistenceProbe?: string })
						.__swupPersistenceProbe,
			),
		).toBe("preserved");

		await page.locator('#navbar a[href="/friends/"]').click();
		await page.waitForFunction(
			() =>
				document.getElementById("swup-container")?.dataset.currentPage ===
				"friends",
		);
		await expect(page.locator("[data-banner-context-title]")).toHaveText(
			"友链",
		);
		await expect(page.locator("[data-banner-context-description]")).toHaveText(
			"欢迎交换友链，申请方式见「关于」页。",
		);
		await expect(page.locator("[data-banner-context-meta]")).toBeHidden();
		expect(
			await page.evaluate(
				() =>
					(window as typeof window & { __swupPersistenceProbe?: string })
						.__swupPersistenceProbe,
			),
		).toBe("preserved");
	});

	test("animates contextual copy only on motion-enabled desktop navigation", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto("/posts/tech/git-guide/", {
			waitUntil: "domcontentloaded",
		});
		await waitForBannerState(page, true);
		await page.waitForFunction(() => Boolean(window.swup?.hooks));
		await page.evaluate(() => {
			const stage = document.getElementById("banner-wrapper");
			if (!stage) return;
			const states: string[] = [];
			new MutationObserver(() => {
				states.push(stage.dataset.contextMotion || "");
			}).observe(stage, {
				attributes: true,
				attributeFilter: ["data-context-motion"],
			});
			(
				window as typeof window & { __bannerMotionStates?: string[] }
			).__bannerMotionStates = states;
		});

		await page.locator('#navbar a[href="/friends/"]').click();
		await page.waitForFunction(
			() =>
				document.getElementById("swup-container")?.dataset.currentPage ===
				"friends",
		);
		await page.waitForFunction(() => {
			const states =
				(window as typeof window & { __bannerMotionStates?: string[] })
					.__bannerMotionStates || [];
			return (
				states.includes("in") &&
				document.getElementById("banner-wrapper")?.dataset.contextMotion ===
					"idle"
			);
		});
		const states = await page.evaluate(
			() =>
				(window as typeof window & { __bannerMotionStates?: string[] })
					.__bannerMotionStates || [],
		);
		expect(states).toContain("out");
		expect(states).toContain("in");
		expect(states.at(-1)).toBe("idle");
	});

	test("skips contextual copy animation on mobile and reduced motion", async ({
		page,
	}) => {
		for (const setup of [
			async () => page.setViewportSize({ width: 390, height: 844 }),
			async () => {
				await page.setViewportSize({ width: 1440, height: 1000 });
				await page.emulateMedia({ reducedMotion: "reduce" });
			},
		]) {
			await setup();
			await page.goto("/posts/tech/git-guide/", {
				waitUntil: "domcontentloaded",
			});
			await page.waitForFunction(() => Boolean(window.swup?.hooks));
			await page.evaluate(() => {
				(
					window.swup as typeof window.swup & {
						navigate: (url: string) => void;
					}
				).navigate("/friends/");
			});
			await page.waitForFunction(
				() =>
					document.getElementById("swup-container")?.dataset.currentPage ===
					"friends",
			);
			await expect(page.locator("#banner-wrapper")).toHaveAttribute(
				"data-context-motion",
				"idle",
			);
		}
	});

	test("Swup home to post removes mobile wallpaper without leaving a gap", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/", { waitUntil: "networkidle" });
		await waitForBannerState(page, true);
		await expect(page.locator(".banner-waves")).toHaveCount(1);

		await page.evaluate(() => {
			(
				document.querySelector(
					'#swup-container a[href^="/posts/"]',
				) as HTMLAnchorElement
			)?.click();
		});
		await page.waitForFunction(
			() =>
				document.getElementById("swup-container")?.dataset.currentPage ===
				"post",
		);
		await waitForBannerState(page, false);
		await expect(page.locator(".banner-waves")).toHaveCount(1);
		await expect(page.locator(".banner-waves")).toBeHidden();
		await expectCompactTop(page);
	});
});
