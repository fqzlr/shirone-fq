import { expect, test } from "@playwright/test";

test.describe("top app bar content alignment", () => {
	test("centers navigation while keeping the blog title on the left", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });

		const content = page.locator("#navbar > div").first();
		const title = content.locator(":scope > a");
		const nav = content.locator(":scope > nav");

		await expect(title).toHaveText("Shirone");
		await expect(title).not.toHaveClass(/lg:absolute/);
		await expect(nav).toBeVisible();
		await expect(nav).toHaveClass(/lg:absolute/);

		const geometry = await Promise.all([
			content.boundingBox(),
			nav.boundingBox(),
		]);
		expect(geometry[0]).not.toBeNull();
		expect(geometry[1]).not.toBeNull();
		const [contentBox, navBox] = geometry as [
			{ x: number; width: number },
			{ x: number; width: number },
		];
		expect(navBox.x + navBox.width / 2).toBeCloseTo(
			contentBox.x + contentBox.width / 2,
			0,
		);
	});
});
