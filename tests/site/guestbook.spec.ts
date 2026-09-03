import { expect, test } from "@playwright/test";
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

/**
 * 留言板页功能锁定（pages/guestbook.astro -> organisms/comment/CommentSection.astro）。
 * 页面可用性由 siteConfig.pages.guestbook 统一开关驱动（false 时路由 404、
 * 导航 Guestbook 预设自动隐藏，见 src/utils/page-availability.ts）。
 * 评论区内容与挂载行为由 comments.spec.ts 覆盖，此处锁定页面骨架与 i18n 完整性。
 */

test.describe("留言板页", () => {
	test("页面可用且渲染 PageHeader 骨架", async ({ page }) => {
		const response = await page.goto("/guestbook/");
		expect(response?.status()).toBe(200);

		await expect(page.locator(".page-header")).toHaveCount(1);
		const title = page.locator(".page-header__title");
		await expect(title).toBeVisible();
		// 标题来自 i18n guestbook 词条，非空即可（具体文案随站点语言变化）
		await expect(title).not.toHaveText("");

		// data-current-page 标记（侧栏过滤与 Swup 同步依赖）
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"guestbook",
		);
	});

	test("导航包含留言板入口（预设随页面可用性过滤）", async ({ page }) => {
		await page.goto("/");
		// Guestbook 预设渲染在顶栏「更多」下拉分组中，DOM 常驻（折叠只是视觉隐藏）
		await expect(page.locator('a[href="/guestbook/"]').first()).toBeAttached();
	});

	test("guestbook i18n 词条在十种语言中完整", () => {
		const locales = [
			["en", en],
			["es", es],
			["id", id],
			["ja", ja],
			["ko", ko],
			["th", th],
			["tr", tr],
			["vi", vi],
			["zh_CN", zh_CN],
			["zh_TW", zh_TW],
		] as const;
		for (const [code, locale] of locales) {
			expect(locale[I18nKey.guestbook], `${code}.guestbook`).toBeTruthy();
			expect(
				locale[I18nKey.guestbookBanner],
				`${code}.guestbookBanner`,
			).toBeTruthy();
		}
		expect(en[I18nKey.guestbook]).toBe("Guestbook");
	});
});
