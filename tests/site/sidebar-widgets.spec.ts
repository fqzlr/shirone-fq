import { expect, test } from "@playwright/test";

/**
 * 侧栏新 widget：最新动态（moments）与广告位（advertisement）。
 * - 最新动态默认启用（副栏 top，全页面显示），构建期直出摘要；
 * - 广告位默认关闭且无载荷：断言零 DOM（零额外负担契约）。
 */

test.describe("Sidebar latest moments widget", () => {
	test("renders recent moments with date, excerpt and more link on direct load", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "networkidle" });

		const widget = page.locator('widget-layout[data-id="latest-moments"]');
		await expect(widget).toBeVisible();

		const items = widget.locator(".latest-moments > li");
		const count = await items.count();
		expect(count).toBeGreaterThan(0);
		expect(count).toBeLessThanOrEqual(3);

		const first = items.first();
		// 条目链接到瞬间页对应锚点
		await expect(first.locator("a")).toHaveAttribute(
			"href",
			/\/moments\/#moment-/,
		);
		// 日期与摘要非空
		await expect(first.locator("time")).toBeVisible();
		const excerpt = await first
			.locator(".latest-moments__excerpt")
			.textContent();
		expect(excerpt?.trim().length ?? 0).toBeGreaterThan(0);

		// 「查看更多动态」入口指向瞬间页
		await expect(widget.locator(".widget-index-link a")).toHaveAttribute(
			"href",
			/\/moments\//,
		);
	});

	test("persists across Swup client-side navigation (no pages filter)", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "networkidle" });
		const widget = page.locator('widget-layout[data-id="latest-moments"]');
		await expect(widget).toBeVisible();

		// 站内导航到归档页（Swup 替换 #swup-container，侧栏壳不重渲染）
		await page.locator('a[href="/archive/"]').first().click();
		await page.waitForURL("**/archive/");
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"archive",
		);
		await expect(widget).toBeVisible();
	});
});

test.describe("Sidebar advertisement widget", () => {
	test("renders zero DOM when disabled or payload absent (zero burden)", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "networkidle" });
		// 默认 enable: false，且无 ad 载荷：不应出现任何广告位 DOM
		await expect(page.locator('widget-layout[data-id^="ad-"]')).toHaveCount(0);
		await expect(page.locator(".advertisement-wrapper")).toHaveCount(0);
	});
});
