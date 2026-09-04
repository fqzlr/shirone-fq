import { expect, test } from "@playwright/test";

/**
 * 友链页功能锁定（pages/friends.astro -> organisms/FriendSection.svelte，client:visible）。
 * 视觉约束对齐站点设计语言：PageHeader 页内大标题（装饰图标）、胶囊搜索条、
 * 官方 Chips 筛选原子、FriendCard 卡片（hover 箭头 + tag 弱文本标签 + 站长/推荐特效）、
 * 筛选状态 URL 同步（?q= / ?tag=）。
 * 数据来自 src/data/friends.ts（getFriendsList 稳定顺序，由内容仓 data/friends.ts 同步），
 * 断言基于默认数据集（70 条、全 "Blog" 标签、id 1 = 站长卡片、6 张推荐卡片）；
 * 站点默认语言为 zh_CN，文案断言用中文。
 * 友链检测（friendPageConfig.check）默认 enable: false：徽标/分区/悬浮预览零 DOM，
 * 开启态行为由 tests/friend-check.test.mjs 覆盖纯函数层。
 */

const FRIEND_COUNT = 70;
const FEATURED_COUNT = 6;

test.describe("友链页", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/friends/");
		await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
	});

	test("渲染友链卡片（整卡可点，标题 / 描述 / 标签）", async ({ page }) => {
		const first = page.locator(".friend-card").first();
		await expect(first).toHaveAttribute("href", "https://blog.fqzlr.top/");
		await expect(first).toHaveAttribute("target", "_blank");
		await expect(first).toContainText("番茄主理人");
		await expect(first.locator(".friend-card__tag").first()).toHaveText(
			"Blog",
		);
	});

	test("使用站点统一的友链视觉结构", async ({ page }) => {
		// PageHeader 封装的大标题（带装饰图标）
		await expect(page.locator(".page-header")).toHaveCount(1);
		await expect(page.locator(".page-header__title")).toHaveText("友链");
		await expect(page.locator(".page-header__icon svg")).toHaveCount(1);
		// PostCard 式箭头（chevron，hover 右滑）；检测关闭时无状态徽标抢占位置
		await expect(page.locator(".friend-card__arrow")).toHaveCount(
			FRIEND_COUNT,
		);
		// 官方 Chips 原子（filter 形态）承担标签筛选；当前数据只有 Blog 一个标签
		await expect(
			page.locator(".friend-section__chips .m3-chip--filter"),
		).toHaveCount(1);
		// 换链说明为 PageHeader 副标题
		await expect(page.locator(".page-header__subtitle")).toBeVisible();
		await expect(page.locator(".page-header__subtitle")).toContainText(
			"交换友链",
		);
	});

	test("站长卡片与推荐卡片特效标记（数据字段驱动，构建期渲染）", async ({
		page,
	}) => {
		await expect(page.locator(".friend-card--owner")).toHaveCount(1);
		await expect(page.locator(".friend-card--owner").first()).toContainText(
			"番茄主理人",
		);
		await expect(page.locator(".friend-card--featured")).toHaveCount(
			FEATURED_COUNT,
		);
		// 站长 = 紫色星芒特效，推荐 = 金色流星特效
		await expect(
			page.locator(".friend-card--owner .friend-card__fx--aurora"),
		).toHaveCount(1);
		await expect(
			page.locator(".friend-card--featured .friend-card__fx--star").first(),
		).toBeVisible();
	});

	test("检测默认关闭时零额外负担（无徽标 / 无分区 / 无预览浮层）", async ({
		page,
	}) => {
		await expect(page.locator(".friend-card__status")).toHaveCount(0);
		await expect(page.locator(".friend-section__zone")).toHaveCount(0);
		await expect(page.locator(".friend-preview")).toHaveCount(0);
	});

	test("筛选状态同步到 URL（?q= / ?tag=）", async ({ page }) => {
		await page.locator(".friend-section__search input").fill("Olinl");
		await expect(page).toHaveURL(/[?&]q=Olinl/);
		await page.getByRole("button", { name: "Blog", exact: true }).click();
		await expect(page).toHaveURL(/[?&]tag=Blog/);
		await page.locator(".friend-section__search input").fill("");
		await expect(page).toHaveURL(/[?&]tag=Blog/);
	});

	test("单选标签筛选（再点取消恢复全部，aria-pressed 同步）", async ({
		page,
	}) => {
		const blogFilter = page.getByRole("button", { name: "Blog", exact: true });
		await blogFilter.click();
		await expect(blogFilter).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
		await blogFilter.click();
		await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
		await expect(blogFilter).toHaveAttribute("aria-pressed", "false");
	});

	test("搜索过滤 + 空态", async ({ page }) => {
		await page.locator(".friend-section__search input").fill("Olinl");
		await expect(page.locator(".friend-card")).toHaveCount(1);
		await page.locator(".friend-section__search input").fill("no such site");
		await expect(page.locator(".friend-section__empty")).toBeVisible();
	});
});

test.describe("友链页 Swup 导航", () => {
	test.use({ viewport: { width: 1280, height: 900 } });

	test("重复进入后保持组件样式和加载指示器居中", async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });

		for (let visit = 0; visit < 3; visit++) {
			await page.locator('#top-row a[href="/friends/"]').click();
			await expect(page).toHaveURL(/\/friends\/$/);
			const list = page.locator(".friend-section__list");
			await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
			await expect(list).toHaveCSS("display", "grid");
			await expect(list).toHaveCSS("gap", "14px");
			await expect(list).toHaveCSS(
				"grid-template-columns",
				/\d+(\.\d+)?px \d+(\.\d+)?px/,
			);

			const blogFilter = page.getByRole("button", {
				name: "Blog",
				exact: true,
			});
			await blogFilter.click();
			const loading = page.locator(".friend-section__loading");
			const indicator = loading.locator(".m3-loading");
			await expect(loading).toBeVisible();
			await expect(indicator).toHaveCSS("width", "64px");
			await expect(indicator).toHaveCSS("height", "64px");
			const centers = await Promise.all([
				loading.boundingBox(),
				indicator.boundingBox(),
			]);
			expect(centers[0]).not.toBeNull();
			expect(centers[1]).not.toBeNull();
			const [left, right] = centers as [
				{ x: number; width: number },
				{ x: number; width: number },
			];
			expect(
				Math.abs(left.x + left.width / 2 - (right.x + right.width / 2)),
			).toBeLessThanOrEqual(1);

			await page.locator('#top-row a[data-nav-key="home"]').click();
			await expect(page).toHaveURL(/\/$/);
			}
			});
			});

			test("friends.json 端点按 check-flink 契约输出（含 linkpage 字段）", async ({
			request,
			}) => {
			const resp = await request.get("/friends.json");
			expect(resp.status()).toBe(200);
			const body = (await resp.json()) as {
			link_list: Array<Record<string, unknown>>;
			length: number;
			};
			expect(Array.isArray(body.link_list)).toBe(true);
			expect(body.link_list).toHaveLength(FRIEND_COUNT);
			expect(body.length).toBe(FRIEND_COUNT);
			const sample = body.link_list[0];
			for (const key of [
			"name",
			"link",
			"avatar",
			"descr",
			"siteshot",
			"linkpage",
			]) {
			expect(sample, `端点缺失字段 ${key}`).toHaveProperty(key);
			}
			// linkpage 为可选字符串（缺省空串，由数据驱动），供 check-flink 反链检测
			expect(typeof sample.linkpage).toBe("string");
			// 端点透传数据原样：至少包含本站站长卡片
			const owner = (body.link_list as Array<{ link: string }>).find(
			(f) => f.link === "https://blog.fqzlr.top/",
			);
			expect(owner).toBeDefined();
			});
