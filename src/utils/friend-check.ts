/**
 * 友链可达性检测（check-flink）纯函数层。
 * 数据来源：check-flink 部署产物的 result.json（客户端运行时按需拉取，
 * 见 docs/remote-data-system.md 的运行时按需平面契约）。
 *
 * 本模块无副作用、不触网，供 FriendSection（Svelte）与单元测试共用：
 * - normalizeSiteUrl：站点链接归一化（去尾斜杠 + trim），作为卡片与检测记录的匹配键；
 * - statusLevelFor / statusLabelFor：延迟 → 徽标等级与文案；
 * - buildStatusMap：result.json → 以归一化链接为键的状态表（白名单字段清洗）；
 * - groupByFailCount：按 fail_count 把友链拆入「友链暂存区 / 友链墓碑」（互斥、降序）。
 */

export type FriendStatusLevel = "success" | "slow" | "warn" | "timeout";

/** 客户端拉取 result.json 的显式超时（远程数据契约：AbortController + 超时兜底） */
export const FRIEND_CHECK_TIMEOUT_MS = 8_000;

/** result.json 中 link_status[] 单条记录的原始形状（仅取需要的字段） */
export interface FriendCheckStatusItem {
	link?: string;
	/** 延迟（秒）；< 0 表示超时/失败 */
	latency?: number;
	/** 连续检测失败次数 */
	fail_count?: number;
	/** 站点截图 URL（check-flink 截图任务产物） */
	siteshot?: string;
}

/** 清洗后的单条友链检测状态 */
export interface FriendStatusInfo {
	level: FriendStatusLevel;
	label: string;
	latency: number;
	failCount: number;
	siteshot: string;
}

/** result.json 顶层形状（仅取需要的字段） */
export interface FriendCheckResult {
	link_status?: FriendCheckStatusItem[];
}

/** 徽标文案的 i18n 注入点：{ms} 为毫秒数占位符 */
export interface FriendStatusLabelSet {
	/** 超时文案 */
	timeout: string;
	/** 延迟文案模板，{ms} 为毫秒数 */
	latencyMs: string;
}

/** 站点链接归一化：去尾斜杠与首尾空白，作为匹配键 */
export function normalizeSiteUrl(url: string): string {
	return (url || "").trim().replace(/\/+$/, "");
}

/** 判断 n 是否落在闭区间 [min, max] */
export function inZone(n: number, range: readonly [number, number]): boolean {
	return n >= range[0] && n <= range[1];
}

/** 延迟（秒）→ 徽标等级：<0 超时；<1s 正常；<2s 偏慢；其余警告 */
export function statusLevelFor(latency: number): FriendStatusLevel {
	if (!Number.isFinite(latency) || latency < 0) return "timeout";
	if (latency < 1) return "success";
	if (latency < 2) return "slow";
	return "warn";
}

/** 延迟（秒）→ 徽标文案（"980 MS" / 超时文案） */
export function statusLabelFor(
	latency: number,
	labels: FriendStatusLabelSet,
): string {
	if (!Number.isFinite(latency) || latency < 0) return labels.timeout;
	return labels.latencyMs.replace(
		"{ms}",
		String(Math.max(0, Math.round(latency * 1000))),
	);
}

/**
 * 把 result.json 清洗成以归一化链接为键的状态表。
 * 只保留白名单字段；非法条目（缺 link）跳过；fail_count 缺省按 0 处理。
 */
export function buildStatusMap(
	result: FriendCheckResult | null | undefined,
	labels: FriendStatusLabelSet,
): Record<string, FriendStatusInfo> {
	const map: Record<string, FriendStatusInfo> = {};
	const list =
		result && Array.isArray(result.link_status) ? result.link_status : [];
	for (const item of list) {
		if (!item || typeof item.link !== "string" || !item.link) continue;
		const latency = typeof item.latency === "number" ? item.latency : -1;
		const failCount =
			typeof item.fail_count === "number" && Number.isFinite(item.fail_count)
				? Math.max(0, Math.round(item.fail_count))
				: 0;
		map[normalizeSiteUrl(item.link)] = {
			level: statusLevelFor(latency),
			label: statusLabelFor(latency, labels),
			latency,
			failCount,
			siteshot: typeof item.siteshot === "string" ? item.siteshot.trim() : "",
		};
	}
	return map;
}

export interface FriendZoneEntry<T> {
	friend: T;
	failCount: number;
}

/**
 * 把友链列表按 fail_count 拆入「友链暂存区」与「友链墓碑」：
 * - 每条友链至多落入一个分区（两区间互斥，区间非法时调用方已在 config 层兜底）；
 * - 无检测记录的友链视为 fail_count = 0，不落入任何分区；
 * - 分区内按 fail_count 降序（最久失修的排前面）。
 */
export function groupByFailCount<T extends { siteurl: string }>(
	friends: T[],
	statusMap: Record<string, Pick<FriendStatusInfo, "failCount">>,
	pendingZone: readonly [number, number],
	graveyardZone: readonly [number, number],
): { pending: FriendZoneEntry<T>[]; graveyard: FriendZoneEntry<T>[] } {
	const pending: FriendZoneEntry<T>[] = [];
	const graveyard: FriendZoneEntry<T>[] = [];
	for (const friend of friends || []) {
		if (!friend?.siteurl) continue;
		const failCount =
			statusMap[normalizeSiteUrl(friend.siteurl)]?.failCount ?? 0;
		if (inZone(failCount, pendingZone)) {
			pending.push({ friend, failCount });
		} else if (inZone(failCount, graveyardZone)) {
			graveyard.push({ friend, failCount });
		}
	}
	const byFailDesc = (a: FriendZoneEntry<T>, b: FriendZoneEntry<T>) =>
		b.failCount - a.failCount;
	pending.sort(byFailDesc);
	graveyard.sort(byFailDesc);
	return { pending, graveyard };
}
