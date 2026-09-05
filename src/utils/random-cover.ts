/**
 * 为随机封面端点追加唯一 seed，确保每张卡片/文章请求不同 URL，
 * 避免浏览器/图床缓存把同一 endpoint 返回的同一张图复用到所有文章。
 *
 * - 如果 endpoint 已经包含 `seed` 查询参数，保持原 URL 不变；
 * - 使用 `seed` 作为查询键（兼容 CloudFlare ImgBed /random 等忽略未知参数的 API）。
 */
export function randomCoverUrlWithSeed(url: string, seed: string): string {
	if (!url || !seed) {
		return url;
	}

	try {
		const u = new URL(url);
		if (u.searchParams.has("seed")) {
			return url;
		}
		u.searchParams.set("seed", seed);
		return u.href;
	} catch {
		// 兼容相对路径：手动拼接查询字符串
		const sep = url.includes("?") ? "&" : "?";
		return `${url}${sep}seed=${encodeURIComponent(seed)}`;
	}
}
