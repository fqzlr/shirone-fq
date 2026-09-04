import { expect, test } from "@playwright/test";

test.describe("archive filter breadcrumb", () => {
	test("uses concise breadcrumb semantics", async ({ page }) => {
		await page.goto("/archive/?category=Examples");
		const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
		await expect(crumb.locator("ol > li")).toHaveCount(3);
		await expect(
			crumb.getByRole("link", { name: "Categories" }),
		).toHaveAttribute("href", "/categories/");
		await expect(crumb.locator('[aria-current="page"]')).toHaveText("Examples");
		await expect(crumb.locator(".archive-panel__crumb-count")).toHaveCount(0);
	});

	test("server-renders archive content before hydration", async ({
		request,
		page,
	}) => {
		const response = await request.get("/archive/?category=Examples");
		expect(response.ok()).toBe(true);
		const html = await response.text();
		expect(html).toContain("archive-panel");
		expect(html).toContain("m3-blog-archive__group");

		await page.goto("/archive/?category=Examples");
		await expect(
			page.getByRole("navigation", { name: "Breadcrumb" }),
		).toBeVisible();
		await expect(page.locator(".m3-blog-archive__item")).toHaveCount(5);
	});

	test("keeps mobile insets and long values inside the archive card", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		const value = "A-category-name-that-is-intentionally-long-for-mobile";
		await page.goto(`/archive/?category=${encodeURIComponent(value)}`);

		const panel = page.locator(".archive-panel");
		const crumb = page.locator(".archive-panel__crumb");
		const current = page.locator(".archive-panel__crumb-current");
		const panelPadding = await panel.evaluate((element: HTMLElement) => {
			const style = getComputedStyle(element);
			return {
				left: Number.parseFloat(style.paddingLeft),
				right: Number.parseFloat(style.paddingRight),
			};
		});
		expect(panelPadding.left).toBeGreaterThanOrEqual(12);
		expect(panelPadding.right).toBeGreaterThanOrEqual(12);
		await expect(page.locator(".archive-panel__crumb-value")).toHaveAttribute(
			"title",
			value,
		);

		const [panelBox, crumbBox, currentBox] = await Promise.all([
			panel.boundingBox(),
			crumb.boundingBox(),
			current.boundingBox(),
		]);
		expect(panelBox).not.toBeNull();
		expect(crumbBox).not.toBeNull();
		expect(currentBox).not.toBeNull();
		const pb = panelBox as { x: number; width: number };
		const cb = crumbBox as { x: number };
		const cub = currentBox as { x: number; width: number };
		expect(cb.x).toBeGreaterThanOrEqual(pb.x + panelPadding.left);
		expect(cub.x + cub.width).toBeLessThanOrEqual(
			pb.x + pb.width - panelPadding.right,
		);
		expect(
			await page
				.locator(".archive-panel__crumb-list")
				.evaluate((element) => element.scrollWidth <= element.clientWidth),
		).toBe(true);
	});
});
