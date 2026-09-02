import type { NavBarLink } from "@/types/navBarConfig";

export type ResolvedNavBarLink = Omit<NavBarLink, "children"> & {
	children?: ResolvedNavBarLink[];
};

export function resolveNavBarLinks(links: NavBarLink[]): ResolvedNavBarLink[] {
	return links.map((link) => ({
		...link,
		children: link.children ? resolveNavBarLinks(link.children) : undefined,
	}));
}

/**
 * 当前 URL → 导航高亮标识（pageKey）。
 * 分类/标签筛选优先于归档页（与抽屉/分类栏的筛选优先语义一致）；
 * 文章页、自定义页等无匹配时返回空串（不点亮任何导航项）。
 */
export function resolvePageKey(
	url: Pick<URL, "pathname" | "searchParams">,
): string {
	const pathname = url.pathname.replace(/\/+$/, "") || "/";
	if (pathname === "/") return "home";
	if (url.searchParams.has("category")) return "categories";
	if (url.searchParams.has("tag")) return "tags";
	if (pathname === "/archive") return "archive";
	if (pathname === "/friends") return "friends";
	if (pathname === "/moments") return "moments";
	if (pathname === "/anime") return "anime";
	if (pathname === "/compass") return "compass";
	if (pathname === "/skills") return "skills";
	if (pathname === "/projects") return "projects";
	if (pathname === "/devices") return "devices";
	if (pathname === "/timeline") return "timeline";
	if (pathname === "/albums" || pathname.startsWith("/albums/"))
		return "albums";
	if (pathname === "/about") return "about";
	return "";
}

/**
 * 按 pageKey 过滤导航树中指向不可用页面的条目（构建期在 navBarConfig 输出上执行一次，
 * 谓词注入保持本模块零配置依赖，客户端可安全导入）。
 * - 叶子条目按 `isAllowed(pageKey)` 判定；未携带 pageKey 的自定义条目无法判定目标页，
 *   一律保留（自定义链接若指向被关闭的页面，应由作者自行不再书写）；
 * - 含 children 的分组递归过滤，children 全被过滤的分组整组隐藏（避免空下拉）。
 */
export function filterDisabledPageLinks(
	links: readonly NavBarLink[],
	isAllowed: (pageKey: string) => boolean = () => true,
): NavBarLink[] {
	return links
		.map((link) =>
			link.children
				? {
						...link,
						children: filterDisabledPageLinks(link.children, isAllowed),
					}
				: link,
		)
		.filter((link) =>
			link.children
				? link.children.length > 0
				: link.pageKey === undefined || isAllowed(link.pageKey),
		);
}
