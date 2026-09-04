import { expect, test } from "@playwright/test";
import {
	commentConfig,
	resolveCommentOptions,
} from "../../src/config/commentConfig";
import I18nKey from "../../src/i18n/i18nKey";
import { en } from "../../src/i18n/languages/en";
import { es } from "../../src/i18n/languages/es";
import { id } from "../../src/i18n/languages/id";
import { ja } from "../../src/i18n/languages/ja";
import { ko } from "../../src/i18n/languages/ko";
import { th } from "../../src/i18n/languages/th";
import { tr } from "../../src/i18n/languages/tr";
import { vi } from "../../src/i18n/languages/vi";
import { zh_CN } from "../../src/i18n/languages/zh_CN";
import { zh_TW } from "../../src/i18n/languages/zh_TW";
import type { CommentConfig } from "../../src/types/commentConfig";

const translations = [en, es, id, ja, ko, th, tr, vi, zh_CN, zh_TW];
const commentKeys = [
	I18nKey.comments,
	I18nKey.commentsLoading,
	I18nKey.commentsLoadFailed,
	I18nKey.commentsRequiresJavaScript,
];

const twikooScriptUrl =
	"https://cdn.jsdelivr.net/npm/twikoo@1.7.19/dist/twikoo.min.js";

async function mockTwikoo(page: import("@playwright/test").Page) {
	await page.route(twikooScriptUrl, async (route) => {
		await route.fulfill({
			contentType: "application/javascript",
			body:
				`
				window.twikoo = {
					init: async ({ el }) => {
						const mount = document.createElement('div');
						mount.id = 'twikoo';
						el.replaceWith(mount);
						el = mount;
						el.innerHTML = ` +
				"`" +
				`
							<div class="tk-comments">
								<div class="tk-submit">
									<div class="tk-row">
										<div class="tk-avatar"></div>
										<div class="tk-col">
											<div class="tk-meta-input">
												<div class="el-input el-input-group el-input-group--prepend"><div class="el-input-group__prepend">Nickname</div><input name="nick" placeholder="Required" class="el-input__inner"></div>
												<div class="el-input el-input-group el-input-group--prepend"><div class="el-input-group__prepend">Email</div><input name="mail" type="email" placeholder="Required" class="el-input__inner"></div>
												<div class="el-input el-input-group el-input-group--prepend"><div class="el-input-group__prepend">Website</div><input name="link" placeholder="Optional" class="el-input__inner"></div>
											</div>
											<div class="tk-input el-textarea"><textarea class="el-textarea__inner" placeholder="" style="min-height:97px;height:97px"></textarea><span class="el-input__count">0/500</span></div>
										</div>
									</div>
									<div class="tk-row actions"><div class="tk-row-actions-start"><div class="tk-submit-action-icon"><svg></svg></div></div><button class="el-button tk-preview">Preview</button><button class="el-button tk-send" disabled>Send</button></div>
								</div>
								<a href="#" class="tk-action-link tk-like-action" style="display:block;width:48px;height:48px">Like</a>
								<div class="tk-comments-container">
									<div class="tk-comments-title"><span></span><span><span class="tk-icon __comments"><svg></svg></span><span class="tk-icon __comments tk-admin-entry" style="display:inline-block;width:24px;height:24px"><svg></svg></span></span></div>
									<div class="tk-comments-no">No comment</div>
									<div class="el-loading-mask" style="display:none"><div class="el-loading-spinner">Native spinner</div></div>
								</div>
								<div class="tk-admin-container"><div class="tk-admin" style="display:none;position:fixed;inset:0;z-index:1000;color:rgb(255,255,255);background:rgba(0,0,0,.85)"><a href="#" class="tk-admin-close" style="display:block;width:48px;height:48px">Close</a><div class="tk-admin-comment"><div class="tk-content">User comment</div></div></div></div>
							</div>
						` +
				"`" +
				`;
						const admin = el.querySelector('.tk-admin');
						el.querySelector('.tk-like-action').addEventListener('click', (event) => {
							event.preventDefault();
							event.currentTarget.classList.toggle('tk-liked');
						});
						el.querySelector('.tk-admin-entry').addEventListener('click', () => {
							admin.classList.add('__show');
							admin.style.display = 'block';
						});
						el.querySelector('.tk-admin-close').addEventListener('click', (event) => {
							event.preventDefault();
							admin.classList.remove('__show');
							admin.style.display = 'none';
						});
					}
				};
			`,
		});
	});
}

test.describe("Comment System - Configuration & Architecture", () => {
	test.use({ viewport: { width: 1280, height: 900 } });

	test("all 10 locales have complete comment i18n keys", () => {
		for (const dict of translations) {
			for (const key of commentKeys) {
				expect(dict[key]).toBeDefined();
				expect(typeof dict[key]).toBe("string");
				expect((dict[key] as string).trim().length).toBeGreaterThan(0);
			}
		}
	});

	test("resolveCommentOptions returns null when disabled or misconfigured", () => {
		const disabledConfig: CommentConfig = {
			enable: false,
			provider: "twikoo",
			lazy: true,
			twikoo: {
				envId: "https://twikoo.mysqil.com",
				scriptUrl:
					"https://cdn.jsdelivr.net/npm/twikoo@1.6.41/dist/twikoo.all.min.js",
				lang: "auto",
			},
			waline: {
				serverURL: "",
				scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
				cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
				lang: "auto",
			},
		};
		expect(resolveCommentOptions(disabledConfig)).toBeNull();

		const noneProviderConfig: CommentConfig = {
			enable: true,
			provider: "none",
			lazy: true,
			twikoo: {
				envId: "https://twikoo.mysqil.com",
				scriptUrl:
					"https://cdn.jsdelivr.net/npm/twikoo@1.6.41/dist/twikoo.all.min.js",
				lang: "auto",
			},
			waline: {
				serverURL: "",
				scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
				cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
				lang: "auto",
			},
		};
		expect(resolveCommentOptions(noneProviderConfig)).toBeNull();

		const missingEnvIdConfig: CommentConfig = {
			enable: true,
			provider: "twikoo",
			lazy: true,
			twikoo: {
				envId: "",
				scriptUrl:
					"https://cdn.jsdelivr.net/npm/twikoo@1.6.41/dist/twikoo.all.min.js",
				lang: "auto",
			},
			waline: {
				serverURL: "",
				scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
				cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
				lang: "auto",
			},
		};
		expect(resolveCommentOptions(missingEnvIdConfig)).toBeNull();
	});

	test("resolveCommentOptions returns resolved options when valid", () => {
		const validConfig: CommentConfig = {
			enable: true,
			provider: "twikoo",
			lazy: true,
			twikoo: {
				envId: "https://twikoo.mysqil.com",
				scriptUrl:
					"https://cdn.jsdelivr.net/npm/twikoo@1.6.41/dist/twikoo.all.min.js",
				lang: "auto",
				placeholder: "Comment guidance",
			},
			waline: {
				serverURL: "",
				scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
				cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
				lang: "auto",
			},
		};

		const resolved = resolveCommentOptions(validConfig);
		expect(resolved).not.toBeNull();
		expect(resolved?.provider).toBe("twikoo");
		expect(resolved?.lazy).toBe(true);
		// provider 已断言为 twikoo，类型安全访问 twikoo 字段
		const twikooOpts = (
			resolved as { twikoo: { envId: string; placeholder: string } }
		).twikoo;
		expect(twikooOpts.envId).toBe("https://twikoo.mysqil.com");
		expect(twikooOpts.placeholder).toBe("Comment guidance");
	});

	test("resolveCommentOptions validates waline provider", () => {
		const missingServerURLConfig: CommentConfig = {
			enable: true,
			provider: "waline",
			lazy: false,
			twikoo: {
				envId: "",
				scriptUrl: "",
				lang: "auto",
			},
			waline: {
				serverURL: "",
				scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
				cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
				lang: "auto",
			},
		};
		expect(resolveCommentOptions(missingServerURLConfig)).toBeNull();

		const validConfig: CommentConfig = {
			enable: true,
			provider: "waline",
			lazy: false,
			twikoo: {
				envId: "",
				scriptUrl: "",
				lang: "auto",
			},
			waline: {
				serverURL: "https://waline.example.com",
				scriptUrl: "https://unpkg.com/@waline/client@v3/dist/waline.js",
				cssUrl: "https://unpkg.com/@waline/client@v3/dist/waline.css",
				lang: "auto",
				pageview: true,
				wordLimit: [2, 300],
			},
		};

		const resolved = resolveCommentOptions(validConfig);
		expect(resolved).not.toBeNull();
		expect(resolved?.provider).toBe("waline");
		expect(resolved?.lazy).toBe(false);
		expect(resolved?.provider === "waline" && resolved.waline.serverURL).toBe(
			"https://waline.example.com",
		);
		expect(
			resolved?.provider === "waline" && resolved.waline.wordLimit,
		).toEqual([2, 300]);
	});

	// 评论 UI 测试依赖真实渲染的评论区；默认模板关闭评论时跳过，本机开启后自动运行
	const commentsUiEnabled = resolveCommentOptions(commentConfig) !== null;

	test("enabled comment section renders DOM structure with test data", async ({
		page,
	}) => {
		test.skip(
			!commentsUiEnabled,
			"评论默认关闭，请在 src/config/commentConfig.ts 开启后运行 UI 测试",
		);
		await mockTwikoo(page);
		await page.goto("/posts/guide/", { waitUntil: "networkidle" });

		// 1. 评论区容器存在且包含标题
		const commentSection = page.locator("#comments");
		await expect(commentSection).toHaveCount(1);
		await expect(page.locator("#comments-title")).toBeVisible();

		// 2. Twikoo 挂载容器与 test envId 数据属性正确
		const wrapper = page.locator(".shirone-twikoo-wrapper");
		await expect(wrapper).toHaveCount(1);
		await expect(wrapper).toHaveAttribute(
			"data-twikoo-env-id",
			"https://twikoo.mysqil.com",
		);
		await expect(wrapper).toHaveAttribute("data-twikoo-lazy", "true");

		// 3. 懒加载前保留挂载容器，进入视口后由 Vue 根节点替换
		await expect(page.locator("#tcomment, #twikoo")).toHaveCount(1);
	});

	test("pages without comments load no Twikoo DOM or CSS", async ({ page }) => {
		const twikooCssRequests: string[] = [];
		page.on("request", (request) => {
			const url = request.url();
			// dev 模式下 Astro 通过 ?astro&type=style 内部端点注入组件样式，
			// 不是真实 CSS 资产请求；仅统计构建产物中的独立样式文件。
			if (
				url.includes("Twikoo.") &&
				url.endsWith(".css") &&
				!url.includes("?astro")
			) {
				twikooCssRequests.push(url);
			}
		});

		await page.goto("/");
		await expect(page.locator("#comments")).toHaveCount(0);
		await expect(page.locator(".shirone-twikoo-wrapper")).toHaveCount(0);
		await expect(page.locator("#tcomment")).toHaveCount(0);
		expect(twikooCssRequests).toHaveLength(0);
	});

	test("comment editor keeps fields aligned on desktop and mobile", async ({
		page,
	}) => {
		test.skip(
			!commentsUiEnabled,
			"评论默认关闭，请在 src/config/commentConfig.ts 开启后运行 UI 测试",
		);
		await mockTwikoo(page);
		await page.goto("/posts/guide/");
		await page.locator("#comments").scrollIntoViewIfNeeded();
		await expect(page.locator(".tk-meta-input")).toBeVisible();
		await page.locator(".tk-input textarea").fill("Draft comment");

		const assertFieldGeometry = async (stacked: boolean) => {
			const rem = await page.evaluate(() =>
				Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
			);
			const metaBox = await page.locator(".tk-meta-input").boundingBox();
			const fields = page.locator(".tk-meta-input > .el-input");
			const fieldBoxes = await fields.evaluateAll((elements) =>
				elements.map((element) => {
					const field = element.getBoundingClientRect();
					const label = element.firstElementChild?.getBoundingClientRect();
					const input = element.querySelector("input")?.getBoundingClientRect();
					return {
						x: field.x,
						y: field.y,
						width: field.width,
						height: field.height,
						labelY: label?.y,
						labelHeight: label?.height,
						inputY: input?.y,
						inputHeight: input?.height,
					};
				}),
			);

			expect(metaBox).not.toBeNull();
			expect(fieldBoxes).toHaveLength(3);
			for (const field of fieldBoxes) {
				expect(field.height).toBeCloseTo(rem * 3, 0);
				expect(field.labelY).toBe(field.inputY);
				expect(field.labelHeight).toBe(field.inputHeight);
			}

			if (stacked) {
				expect(fieldBoxes[1].y).toBeGreaterThan(fieldBoxes[0].y);
				expect(fieldBoxes[2].y).toBeGreaterThan(fieldBoxes[1].y);
				for (const field of fieldBoxes) {
					expect(field.width).toBeCloseTo(metaBox?.width ?? 0, 0);
				}
			} else {
				expect(new Set(fieldBoxes.map((field) => field.y)).size).toBe(1);
			}

			const textareaBox = await page
				.locator(".tk-input textarea")
				.boundingBox();
			const previewBox = await page.locator(".tk-preview").boundingBox();
			expect(textareaBox?.height).toBeCloseTo(rem * 7, 0);
			expect(previewBox?.height).toBeCloseTo(rem * 2.75, 0);
		};

		await assertFieldGeometry(false);

		await page.setViewportSize({ width: 390, height: 844 });
		await page.locator("#comments").scrollIntoViewIfNeeded();
		await assertFieldGeometry(true);
	});

	test("preview appears only for comment content with tonal colors", async ({
		page,
	}) => {
		test.skip(
			!commentsUiEnabled,
			"评论默认关闭，请在 src/config/commentConfig.ts 开启后运行 UI 测试",
		);
		await mockTwikoo(page);
		await page.goto("/posts/guide/");
		await page.locator("#comments").scrollIntoViewIfNeeded();

		const textarea = page.locator(".tk-input textarea");
		const preview = page.locator(".tk-preview");
		await expect(textarea).toBeVisible();
		await expect(preview).toBeHidden();

		await textarea.fill("Draft comment");
		await expect(preview).toBeVisible();

		const colors = await preview.evaluate((element) => {
			const resolveColor = (token: string) => {
				const probe = document.createElement("span");
				probe.style.color = `var(${token})`;
				element.append(probe);
				const color = getComputedStyle(probe).color;
				probe.remove();
				return color;
			};

			const styles = getComputedStyle(element);
			return {
				background: styles.backgroundColor,
				color: styles.color,
				expectedBackground: resolveColor("--secondary-container"),
				expectedColor: resolveColor("--on-secondary-container"),
			};
		});
		expect(colors.background).toBe(colors.expectedBackground);
		expect(colors.color).toBe(colors.expectedColor);

		await textarea.fill("");
		await expect(preview).toBeHidden();
	});

	test("configured guidance appears as semantic placeholder text", async ({
		page,
	}) => {
		test.skip(
			!commentsUiEnabled,
			"评论默认关闭，请在 src/config/commentConfig.ts 开启后运行 UI 测试",
		);
		await mockTwikoo(page);
		await page.goto("/posts/guide/");
		await page.locator("#comments").scrollIntoViewIfNeeded();

		const textarea = page.locator(".tk-input textarea");
		await expect(textarea).toHaveAttribute(
			"placeholder",
			"Share your thoughts...",
		);
		const placeholderStyle = await textarea.evaluate((element) => {
			const styles = getComputedStyle(element, "::placeholder");
			return { color: styles.color, opacity: styles.opacity };
		});
		expect(placeholderStyle.color).not.toBe("rgba(0, 0, 0, 0)");
		expect(Number(placeholderStyle.opacity)).toBeLessThan(1);
	});

	test("comment loading uses the centered M3E indicator", async ({ page }) => {
		test.skip(
			!commentsUiEnabled,
			"评论默认关闭，请在 src/config/commentConfig.ts 开启后运行 UI 测试",
		);
		await mockTwikoo(page);
		await page.goto("/posts/guide/");
		await page.locator("#comments").scrollIntoViewIfNeeded();
		const commentsContainer = page.locator(".tk-comments-container");
		const skeleton = commentsContainer.locator(":scope > .twikoo-skeleton");
		await expect(skeleton).toBeAttached();

		await commentsContainer.evaluate((element) => {
			const mask = element.querySelector<HTMLElement>(".el-loading-mask");
			mask?.style.removeProperty("display");
		});

		await expect(skeleton).toBeVisible();
		await expect(skeleton.locator(".m3-loading")).toBeVisible();
		await expect(skeleton.locator(".m3-loading path")).not.toHaveAttribute(
			"d",
			"",
		);
		await expect(page.locator(".el-loading-spinner")).toBeHidden();

		const [containerBox, indicatorBox] = await Promise.all([
			commentsContainer.boundingBox(),
			skeleton.locator(".m3-loading").boundingBox(),
		]);
		expect(containerBox).not.toBeNull();
		expect(indicatorBox).not.toBeNull();
		expect((indicatorBox?.x ?? 0) + (indicatorBox?.width ?? 0) / 2).toBeCloseTo(
			(containerBox?.x ?? 0) + (containerBox?.width ?? 0) / 2,
			0,
		);
		expect(
			(indicatorBox?.y ?? 0) + (indicatorBox?.height ?? 0) / 2,
		).toBeCloseTo((containerBox?.y ?? 0) + (containerBox?.height ?? 0) / 2, 0);
	});

	test("Twikoo hash actions preserve page scroll", async ({ page }) => {
		test.skip(
			!commentsUiEnabled,
			"评论默认关闭，请在 src/config/commentConfig.ts 开启后运行 UI 测试",
		);
		await mockTwikoo(page);
		await page.goto("/posts/guide/");
		await page.locator("#comments").scrollIntoViewIfNeeded();
		await expect(page.locator(".tk-admin-entry")).toBeVisible();
		const scrollBeforeLike = await page.evaluate(() => window.scrollY);
		const like = await page.locator(".tk-like-action").boundingBox();
		expect(like).not.toBeNull();
		await page.mouse.click(
			(like?.x ?? 0) + (like?.width ?? 0) / 2,
			(like?.y ?? 0) + (like?.height ?? 0) / 2,
		);
		await expect(page.locator(".tk-like-action")).toHaveClass(/tk-liked/);
		expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(
			scrollBeforeLike,
			0,
		);

		const adminEntry = await page.locator(".tk-admin-entry").boundingBox();
		expect(adminEntry).not.toBeNull();
		await page.mouse.click(
			(adminEntry?.x ?? 0) + (adminEntry?.width ?? 0) / 2,
			(adminEntry?.y ?? 0) + (adminEntry?.height ?? 0) / 2,
		);
		await expect(page.locator(".tk-admin")).toHaveClass(/__show/);
		await expect(page.locator(".tk-admin-comment .tk-content")).toHaveCSS(
			"color",
			"rgb(255, 255, 255)",
		);

		const scrollBeforeClose = await page.evaluate(() => window.scrollY);
		const close = await page.locator(".tk-admin-close").boundingBox();
		expect(close).not.toBeNull();
		await page.mouse.click(
			(close?.x ?? 0) + (close?.width ?? 0) / 2,
			(close?.y ?? 0) + (close?.height ?? 0) / 2,
		);

		await expect(page.locator(".tk-admin")).not.toHaveClass(/__show/);
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeCloseTo(scrollBeforeClose, 0);
	});

	test("loadScriptOnce deduplicates script injection in browser", async ({
		page,
	}) => {
		await page.goto("/posts/guide/", { waitUntil: "networkidle" });

		const result = await page.evaluate(async () => {
			// 动态引入 script-loader 模块
			const { loadScriptOnce } = await import("/src/utils/script-loader.ts");

			// Mock 创建一个测试用的 inline blob script URL
			const blob = new Blob(
				["window.__mockScriptLoaded = (window.__mockScriptLoaded || 0) + 1;"],
				{ type: "application/javascript" },
			);
			const blobUrl = URL.createObjectURL(blob);

			// 并发多次调用 loadScriptOnce
			await Promise.all([
				loadScriptOnce(blobUrl),
				loadScriptOnce(blobUrl),
				loadScriptOnce(blobUrl),
			]);

			const scripts = document.querySelectorAll(`script[src="${blobUrl}"]`);
			return {
				scriptTagCount: scripts.length,
				executionCount: (window as Window & { __mockScriptLoaded?: number })
					.__mockScriptLoaded,
			};
		});

		expect(result.scriptTagCount).toBe(1);
		expect(result.executionCount).toBe(1);
	});
});
