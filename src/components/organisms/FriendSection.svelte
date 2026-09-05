<script lang="ts">
import Chips from "@components/atoms/action/Chips.svelte";
import Avatar from "@components/atoms/display/Avatar.svelte";
import Card from "@components/atoms/display/Card.svelte";
import LoadingIndicator from "@components/atoms/feedback/LoadingIndicator.svelte";
import TextField from "@components/atoms/input/TextField.svelte";
import FriendCard from "@components/molecules/FriendCard.svelte";
import PageHeader from "@components/molecules/PageHeader.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import type { FriendCheckResult, FriendStatusInfo } from "@utils/friend-check";
import {
	buildStatusMap,
	FRIEND_CHECK_TIMEOUT_MS,
	groupByFailCount,
	normalizeSiteUrl,
} from "@utils/friend-check";
import { onMount } from "svelte";
import type { FriendItem } from "../../data/friends";
import type { FriendCheckOptions } from "../../types/friendPageConfig";

let {
	friends = [],
	check = undefined,
}: {
	friends?: FriendItem[];
	/** 友链检测运行时契约（SSR 由 resolveFriendCheckOptions() 传入；未配置时为 undefined） */
	check?: FriendCheckOptions;
} = $props();

let query = $state("");
let selectedTag = $state("");
let initialized = false;
/** 标签筛选过渡三段态：loading 展示指示器 → out 指示器淡出 → idle 列表揭幕（与动态页同语言） */
type FilterPhase = "idle" | "loading" | "out";
let phase = $state<FilterPhase>("idle");
let phaseTimers: ReturnType<typeof setTimeout>[] = [];

/** 检测状态表：归一化站点链接 → 清洗后的状态（未启用/未就绪时为空对象） */
let statusMap = $state<Record<string, FriendStatusInfo>>({});
/** 悬浮截图预览（仅桌面 hover 指针，检测启用且有截图数据时出现） */
let preview = $state<{ visible: boolean; src: string; x: number; y: number }>({
	visible: false,
	src: "",
	x: 0,
	y: 0,
});

const checkEnabled = $derived(check?.enable === true);

const tagItems = $derived(
	Array.from(new Set(friends.flatMap((friend) => friend.tags)))
		.sort((a, b) => a.localeCompare(b))
		.map((tag) => ({ value: tag, label: tag })),
);

/** 检测启用时落入暂存区/墓碑的友链集合（归一化链接），从主网格隐藏，保证三区互斥 */
const zonedKeys = $derived.by(() => {
	if (!checkEnabled) return null;
	const keys = new Set<string>();
	const { pending, graveyard } = groupByFailCount(
		friends,
		statusMap,
		check?.pendingZone ?? [1, 6],
		check?.graveyardZone ?? [7, 9999],
	);
	for (const { friend } of pending) keys.add(normalizeSiteUrl(friend.siteurl));
	for (const { friend } of graveyard)
		keys.add(normalizeSiteUrl(friend.siteurl));
	return keys;
});

/** 暂存区与墓碑分组（fail_count 降序）；检测关闭时恒为空，零 DOM */
const zones = $derived.by(() => {
	if (!checkEnabled) return { pending: [], graveyard: [] };
	return groupByFailCount(
		friends,
		statusMap,
		check?.pendingZone ?? [1, 6],
		check?.graveyardZone ?? [7, 9999],
	);
});

const filtered = $derived.by(() => {
	const normalizedQuery = query.trim().toLowerCase();

	return friends.filter((friend) => {
		if (zonedKeys?.has(normalizeSiteUrl(friend.siteurl))) return false;
		if (selectedTag && !friend.tags.includes(selectedTag)) return false;
		if (!normalizedQuery) return true;

		let searchableHost = friend.siteurl;
		try {
			searchableHost = new URL(friend.siteurl).hostname;
		} catch {
			/* Keep the original URL when it cannot be parsed. */
		}

		return [friend.title, friend.desc, searchableHost, ...friend.tags].some(
			(value) => value.toLowerCase().includes(normalizedQuery),
		);
	});
});

const visibleCount = $derived(filtered.length);

function countLabel(count: number) {
	return `${count} ${i18n(count === 1 ? I18nKey.friendsCount : I18nKey.friendsCounts)}`;
}

/** 标签筛选：指示器展示 → 淡出 → 列表重新揭幕（与动态页同语言） */
function onTagChange() {
	phaseTimers.forEach(clearTimeout);
	phase = "loading";
	phaseTimers = [
		setTimeout(() => (phase = "out"), 300),
		setTimeout(() => (phase = "idle"), 300 + 150),
	];
}

// ===== check-flink 检测数据（运行时按需平面：缓存优先 → 后台刷新，静默降级） =====

const CHECK_CACHE_KEY = "shirone:friend-check-result";

function readCheckCache(ttlMs: number): FriendCheckResult | null {
	try {
		const raw = localStorage.getItem(CHECK_CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { data?: FriendCheckResult; ts?: number };
		if (!parsed?.data || typeof parsed.ts !== "number") return null;
		if (Date.now() - parsed.ts > ttlMs) return null;
		return parsed.data;
	} catch {
		return null;
	}
}

function writeCheckCache(data: FriendCheckResult) {
	try {
		localStorage.setItem(
			CHECK_CACHE_KEY,
			JSON.stringify({ data, ts: Date.now() }),
		);
	} catch {
		/* localStorage 不可用时静默跳过，检测本身不受影响 */
	}
}

function applyCheckResult(data: FriendCheckResult) {
	statusMap = buildStatusMap(data, {
		timeout: i18n(I18nKey.friendStatusTimeout),
		latencyMs: i18n(I18nKey.friendLatency),
	});
}

// ===== 悬浮截图预览（事件委托在卡片区；仅 hover + 精确指针设备） =====

const PREVIEW_GAP = 16;

function canHoverPreview(): boolean {
	return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * 把预览浮层传送到 document.body：
 * 页面根部的 #content-wrapper 带 onload-animation（fill-mode: forwards + translateY 关键帧），
 * 动画结束后仍残留填充 transform，会使内部 position:fixed 退化为"相对该祖先定位"，
 * 导致浮层整体偏移；挂载到 body 后始终相对视口定位（与参考站 body 级浮层同策略）。
 */
function portalToBody(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		},
	};
}

function placePreview(x: number, y: number) {
	const width = 320;
	const height = 200;
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	let left = x + PREVIEW_GAP;
	let top = y + PREVIEW_GAP;
	if (left + width > vw - 8) left = x - width - PREVIEW_GAP;
	if (top + height > vh - 8) top = Math.max(8, vh - height - 8);
	preview.x = Math.max(8, left);
	preview.y = Math.max(8, top);
}

function onCardOver(event: MouseEvent) {
	if (!canHoverPreview()) return;
	const target = event.target instanceof Element ? event.target : null;
	const card = target?.closest("a.friend-card");
	if (!card) return;
	const src = card.getAttribute("data-siteshot") || "";
	if (!src) {
		preview.visible = false;
		return;
	}
	if (preview.src !== src) preview.src = src;
	preview.visible = true;
	placePreview(event.clientX, event.clientY);
}

function onCardMove(event: MouseEvent) {
	if (preview.visible) placePreview(event.clientX, event.clientY);
}

function onCardOut(event: MouseEvent) {
	const card =
		event.target instanceof Element
			? event.target.closest("a.friend-card")
			: null;
	if (!card) return;
	const to =
		event.relatedTarget instanceof Element ? event.relatedTarget : null;
	if (to?.closest("a.friend-card") === card) return;
	preview.visible = false;
}

// 筛选状态同步到 URL（?q= / ?tag=），刷新/分享/回退保留
$effect(() => {
	// 先读依赖（无论是否初始化都注册），避免首次 return 后不再追踪
	const q = query;
	const t = selectedTag;
	if (!initialized) return;
	const params = new URLSearchParams(window.location.search);
	params.delete("q");
	params.delete("tag");
	if (q) params.set("q", q);
	if (t) params.set("tag", t);
	const qs = params.toString();
	history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
});

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	query = params.get("q") || "";
	selectedTag = params.get("tag") || "";
	initialized = true;

	// 检测未启用时短路：不发请求、不注册定时器（零外部网络请求）
	if (!check?.enable || !check.resultUrl) {
		return () => phaseTimers.forEach(clearTimeout);
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(
		() => controller.abort(),
		FRIEND_CHECK_TIMEOUT_MS,
	);

	void (async () => {
		// 1. 缓存优先快速渲染（避免闪烁）
		const cached = readCheckCache(check.cacheTtlMs);
		if (cached) applyCheckResult(cached);

		// 2. 后台刷新最新结果；失败时静默保留缓存（Swup 代际由组件销毁时 abort 保证）
		try {
			const res = await fetch(check.resultUrl, {
				cache: "no-store",
				signal: controller.signal,
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as FriendCheckResult;
			writeCheckCache(data);
			applyCheckResult(data);
		} catch {
			/* 请求失败/超时/组件已卸载：保留缓存渲染结果，不提示 */
		}
	})();

	return () => {
		controller.abort();
		clearTimeout(timeoutId);
		phaseTimers.forEach(clearTimeout);
	};
});
</script>

<!-- 内边距用 Tailwind 响应式类：自定义 class 写在 Card（子组件）上，scoped 规则会被 Svelte unused-CSS 剥离（pitfalls.md §1.6）；
     mb-4 = --m3e-space-4，与下方友链信息模块保持主题卡片间距 -->
<Card
	color="var(--card-bg)"
	radius="l"
	class="friend-section px-3 py-4 sm:px-8 sm:py-6 mb-4"
>
	<!-- 事件委托层：Card 原子不转发 DOM 事件，悬浮截图预览监听挂在内部容器上 -->
	<div
		class="friend-section__body"
		onmouseover={onCardOver}
		onmousemove={onCardMove}
		onmouseout={onCardOut}
	>
	<PageHeader
		icon="material-symbols:handshake-outline-rounded"
		title={i18n(I18nKey.friends)}
		subtitle={i18n(I18nKey.friendsBanner)}
	/>

	{#if friends.length > 0}
		<div class="friend-section__tools">
			<div class="friend-section__search">
				<TextField
					type="search"
					bind:value={query}
					placeholder={i18n(I18nKey.search)}
					label={i18n(I18nKey.search)}
					hideLabel
					variant="outlined"
					class="!rounded-(--shape-corner-l)"
				>
					<Icon slot="leading" icon="material-symbols:search-rounded" aria-hidden="true" />
				</TextField>
				{#if query}
					<button
						type="button"
						class="friend-section__search-clear"
						aria-label={i18n(I18nKey.clear)}
						onclick={() => (query = "")}
					>
						<Icon icon="material-symbols:close-rounded" aria-hidden="true" />
					</button>
				{/if}
			</div>

			{#if tagItems.length > 0}
				<div class="friend-section__chips">
					<Chips
						items={tagItems}
						variant="filter"
						bind:value={selectedTag}
						onchange={onTagChange}
					/>
				</div>
			{/if}
			<p class="friend-section__count">{countLabel(visibleCount)}</p>
		</div>
	{/if}

	{#if phase !== "idle"}
		<!-- 标签筛选过渡：contained 指示器展示后淡出，再由列表揭幕（与动态页同语言） -->
		<div
			class="friend-section__loading"
			class:friend-section__loading--out={phase === "out"}
		>
			<LoadingIndicator contained size={64} />
		</div>
	{:else if filtered.length > 0}
		{#key `${query}|${selectedTag}`}
			<div class="friend-section__list">
				{#each filtered as friend (friend.id)}
					<FriendCard
						{friend}
						status={statusMap[normalizeSiteUrl(friend.siteurl)]}
						{checkEnabled}
					/>
				{/each}
			</div>
		{/key}
	{:else}
		<div class="friend-section__empty">
			<Icon icon="material-symbols:search-off-outline-rounded" aria-hidden="true" />
			<span>{i18n(I18nKey.friendsNoResults)}</span>
		</div>
	{/if}

	{#if checkEnabled && zones.pending.length > 0}
		<!-- 友链暂存区：连续检测少量失败，站点仍在恢复窗口内 -->
		<section class="friend-section__zone" aria-label={i18n(I18nKey.friendPendingZone)}>
			<header class="friend-section__zone-head">
				<div class="friend-section__zone-titles">
					<h3 class="friend-section__zone-title">{i18n(I18nKey.friendPendingZone)}</h3>
					<p class="friend-section__zone-sub">{i18n(I18nKey.friendPendingZoneDesc)}</p>
				</div>
				<span class="friend-section__zone-badge">
					{i18n(I18nKey.friendZoneSites).replace("{count}", String(zones.pending.length))}
				</span>
			</header>
			<div class="friend-section__zone-grid friend-section__list">
				{#each zones.pending as entry (entry.friend.id)}
					<FriendCard
						friend={entry.friend}
						status={statusMap[normalizeSiteUrl(entry.friend.siteurl)]}
						{checkEnabled}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if checkEnabled && zones.graveyard.length > 0}
		<!-- 友链墓碑：长期失联的友链（fail_count 落入墓碑区间） -->
		<section class="friend-section__zone" aria-label={i18n(I18nKey.friendGraveyardZone)}>
			<header class="friend-section__zone-head">
				<div class="friend-section__zone-titles">
					<h3 class="friend-section__zone-title">{i18n(I18nKey.friendGraveyardZone)}</h3>
				</div>
				<span class="friend-section__zone-badge">
					{i18n(I18nKey.friendZoneSites).replace("{count}", String(zones.graveyard.length))}
				</span>
			</header>
			<p class="friend-section__graveyard-note">{i18n(I18nKey.friendGraveyardNote)}</p>
			<div class="friend-section__graveyard-wall">
				{#each zones.graveyard as entry (entry.friend.id)}
					<span class="friend-tomb-chip" title={entry.friend.title}>
						<Avatar src={entry.friend.imgurl} alt={entry.friend.title} size={24} shape="circle" />
						<span class="friend-tomb-chip__name">{entry.friend.title}</span>
					</span>
				{/each}
			</div>
		</section>
	{/if}
	</div>
</Card>

{#if checkEnabled}
	<!-- 悬浮截图预览：fixed 浮层随鼠标移动（组件随 Swup 销毁，无跨页残留） -->
	<div
		class="friend-preview"
		class:is-visible={preview.visible}
		aria-hidden="true"
		style:left="{preview.x}px"
		style:top="{preview.y}px"
		use:portalToBody
	>
		{#if preview.visible && preview.src}
			<img src={preview.src} alt="" decoding="async" loading="lazy" />
		{/if}
	</div>
{/if}

<style lang="stylus">
@import "../../styles/breakpoints.styl"

.friend-section
	display: block

	&__tools
		display: flex
		flex-direction: column
		gap: 0.875rem
		padding-bottom: 1.5rem
		border-bottom: 1px solid var(--outline-variant)

	&__search
		position: relative
		width: 100%
		max-width: 32rem

		:global(.m3-text-field)
			width: 100%

	&__search-clear
		position: absolute
		right: 0.5rem
		top: 50%
		transform: translateY(-50%)
		display: inline-flex
		flex-shrink: 0
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		padding: 0.25rem
		border: none
		background: none
		color: var(--on-surface-variant)
		cursor: pointer
		border-radius: var(--shape-corner-full)
		> :global(svg)
			width: 1.25rem
			height: 1.25rem
		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface-variant) 8%, transparent)")

	&__chips
		width: 100%

	&__count
		margin: 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)

	/* 标签筛选过渡：区块位置的大号 contained LoadingIndicator（out = 淡出退场，与动态页同语言） */
	&__loading
		display: flex
		align-items: center
		justify-content: center
		min-height: 11rem
		padding-top: 1.5rem

		&--out
			animation: friend-loading-out var(--m3e-duration-short) var(--m3e-easing-emphasized-accelerate) both

	&__list
		display: grid
		/* 15rem 门槛保证窄视口（~1024px）下也能稳定排出三列，280px 会压线掉回两列 */
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr))
		gap: 0.875rem
		padding-top: 1.5rem
		animation: friend-fade-in var(--m3e-duration-medium) var(--m3e-easing-standard)

	&__empty
		display: flex
		flex-direction: column
		align-items: center
		justify-content: center
		gap: 0.75rem
		min-height: 11rem
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-large)
		> :global(svg)
			width: 2.5rem
			height: 2.5rem

	/* —— 友链暂存区 / 友链墓碑（检测启用且有落入分区时才渲染） —— */
	&__zone
		margin-top: 2rem
		padding-top: 1.5rem
		border-top: 1px solid var(--outline-variant)

	&__zone-head
		display: flex
		align-items: flex-start
		justify-content: space-between
		flex-wrap: wrap
		gap: 0.75rem

	&__zone-titles
		min-width: 0

	&__zone-title
		margin: 0
		color: var(--on-surface)
		font: var(--m3e-type-title-medium)
		font-weight: 700

	&__zone-sub
		margin: 0.25rem 0 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)

	&__zone-badge
		display: inline-flex
		align-items: center
		flex-shrink: 0
		padding: 0.25rem 0.7rem
		border-radius: var(--shape-corner-full)
		border: 1px solid unquote("color-mix(in oklab, var(--primary) 35%, var(--outline-variant))")
		background: unquote("color-mix(in oklab, var(--primary) 8%, var(--card-bg))")
		color: var(--primary)
		font: var(--m3e-type-label-small)
		font-weight: 700

	&__graveyard-note
		margin: 0.875rem 0 0
		padding: 0.875rem 1rem
		border: 1px dashed unquote("color-mix(in oklab, var(--primary) 30%, var(--outline-variant))")
		border-radius: var(--shape-corner-m)
		background: unquote("color-mix(in oklab, var(--primary) 5%, var(--card-bg))")
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.7

	&__graveyard-wall
		display: flex
		flex-wrap: wrap
		gap: 0.5rem 0.85rem
		padding-top: 0.875rem

	@media (max-width: bp-sm - 1px)
		&__list
			padding-top: 1.25rem

/* 墓碑头像墙 chip */
.friend-tomb-chip
	display: inline-flex
	align-items: center
	gap: 0.4rem
	padding: 0.2rem 0.5rem 0.2rem 0.2rem
	border-radius: var(--shape-corner-full)
	transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard)

	&:hover
		background: unquote("color-mix(in oklab, var(--on-surface-variant) 8%, transparent)")

.friend-tomb-chip__name
	color: var(--on-surface-variant)
	font: var(--m3e-type-label-medium)

/* 悬浮截图预览浮层：fixed 定位、不接收指针事件，随 data-siteshot 显隐 */
.friend-preview
	position: fixed
	z-index: 60
	width: 20rem
	height: 12.5rem
	overflow: hidden
	border-radius: var(--shape-corner-m)
	border: 1px solid var(--outline-variant)
	background: var(--card-bg)
	box-shadow: var(--m3e-elevation-3)
	pointer-events: none
	opacity: 0
	visibility: hidden
	transform: scale(0.96)
	transition:
		opacity var(--m3e-duration-medium) var(--m3e-easing-standard),
		transform var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate)

	&.is-visible
		opacity: 1
		visibility: visible
		transform: none

	> img
		width: 100%
		height: 100%
		object-fit: cover

/* 筛选结果淡入（reduced-motion 由全局 motion-reduced 规则禁用动画） */
@keyframes friend-fade-in
	from
		opacity: 0
		transform: translateY(0.25rem)
	to
		opacity: 1
		transform: translateY(0)

/* 指示器退场：淡出 + 轻微收拢（reduced-motion 由全局规则压至终态） */
@keyframes friend-loading-out
	from
		opacity: 1
		transform: none
	to
		opacity: 0
		transform: scale(0.96)
</style>
