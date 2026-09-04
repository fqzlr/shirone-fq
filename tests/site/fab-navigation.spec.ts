import { expect, test } from "@playwright/test";

/**
 * FAB 悬浮导航体系测试：
 * - 桌面端 (>= 1024px)：悬浮 TOC 隐藏 (lg:hidden)，返回顶部滚动后显示
 * - 移动端 (< 768px)：悬浮 TOC 显示，点击展开 M3 目录卡片，ESC 键退出，点击标题平滑跳转并关闭
 * - 平板端 (768px ~ 1023px)：悬浮 TOC 正常显示
 * - 零额外负担：评论系统未启用时，页面中不输出评论 FAB 按钮 (#fab-comment-btn)
 */
test.describe("FAB Navigation System", () => {
	test("Desktop: Floating TOC is hidden on desktop, BackToTop behaves correctly on scroll", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/posts/tech/git-guide/", { waitUntil: "networkidle" });

		// 桌面端悬浮 TOC 必须处于隐藏状态 (lg:hidden)
		const tocBtn = page.locator("#fab-toc-btn");
		await expect(tocBtn).toBeHidden();

		// 默认 commentConfig.enable: false 时，根据零额外负担原则，不渲染评论按钮
		const commentBtn = page.locator("#fab-comment-btn");
		await expect(commentBtn).toHaveCount(0);

		// 初始状态下 BackToTop 不占据布局
		const topBtn = page.locator("#fab-top-btn");
		await expect(topBtn).toBeHidden();

		// 滚动越过 Banner 后 BackToTop 浮现
		await page.evaluate(() => window.scrollTo(0, 800));
		await page.waitForTimeout(300);
		await expect(topBtn).toBeVisible();

		// 点击 BackToTop 返回顶部
		await topBtn.click();
		await page.waitForTimeout(500);
		const scrollY = await page.evaluate(() => window.scrollY);
		expect(scrollY).toBeLessThanOrEqual(50);
	});

	test("Mobile: Floating TOC is visible, opens modal, supports ESC and heading jumps", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/posts/tech/git-guide/", { waitUntil: "networkidle" });

		const tocBtn = page.locator("#fab-toc-btn");
		await expect(tocBtn).toBeVisible();
		const homeBtn = page.locator("#fab-home-btn");
		await expect(homeBtn).toBeVisible();

		// 点击打开 TOC 弹窗
		await tocBtn.click();
		const panel = page.locator("#floating-toc-panel");
		await expect(panel).toHaveClass(/is-open/);

		// 按 Escape 键关闭
		await page.keyboard.press("Escape");
		await expect(panel).not.toHaveClass(/is-open/);

		// 再次打开并点击目录项跳转
		await tocBtn.click();
		await expect(panel).toHaveClass(/is-open/);

		const firstHeadingLink = page.locator("#floating-toc-tree a").first();
		await expect(firstHeadingLink).toBeVisible();
		await firstHeadingLink.click();

		// 点击后自动收起（slug 为 CJK，URL 中可能被百分号编码）
		await expect(panel).not.toHaveClass(/is-open/);
		await expect(page).toHaveURL(
			/#(安装与首次配置|%E5%AE%89%E8%A3%85%E4%B8%8E%E9%A6%96%E6%AC%A1%E9%85%8D%E7%BD%AE)/,
		);
	});

	test("Mobile: Home action stays hidden on the home page", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await expect(page.locator("#fab-home-btn")).toBeHidden();
	});

	test("Dark mode: FAB keeps tonal contrast over dark surfaces", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.addInitScript(() => localStorage.setItem("theme", "dark"));
		await page.goto("/posts/tech/git-guide/", { waitUntil: "networkidle" });
		await expect(page.locator("html")).toHaveClass(/dark/);

		const colors = await page
			.locator("#fab-toc-btn button")
			.evaluate((button) => {
				const style = getComputedStyle(button);
				const root = getComputedStyle(document.documentElement);
				return {
					background: style.backgroundColor,
					foreground: style.color,
					card: root.getPropertyValue("--card-bg").trim(),
					page: root.getPropertyValue("--page-bg").trim(),
				};
			});

		expect(colors.background).not.toBe(colors.card);
		expect(colors.background).not.toBe(colors.page);
		expect(colors.background).not.toBe(colors.foreground);
	});

	test("Tablet: Floating TOC is visible on tablet viewport", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 820, height: 1180 });
		await page.goto("/posts/tech/git-guide/", { waitUntil: "networkidle" });

		const tocBtn = page.locator("#fab-toc-btn");
		await expect(tocBtn).toBeVisible();
	});

	test("Mobile: Floating TOC follows Swup article navigation", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/posts/tech/git-guide/", { waitUntil: "networkidle" });
		await page.waitForFunction(() => Boolean(window.swup?.hooks));

		await page.evaluate(() =>
			window.swup?.navigate("/posts/tech/shirone-usage/"),
		);
		await page.waitForURL("**/posts/tech/shirone-usage/");
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"post",
		);
		await expect(page.locator("#floating-toc-tree a").first()).toHaveAttribute(
			"href",
			"#写一篇文章",
		);
	});
});
