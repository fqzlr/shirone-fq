<script lang="ts">
/**
 * 归档面板：分组切换（SegmentedButton，按年 / 按分类 / 按标签）+ 时间轴列表（组折叠见 ArchiveList 原子）。
 * URL 参数（?category= / ?tag= / ?uncategorized）是定向浏览视图：隐藏分组切换，
 * 顶部显示筛选头（面包屑）——索引页链接 › 当前筛选值，一键回溯到分类/标签索引页；
 * 无筛选时显示分组切换，可按年 / 按分类 / 按标签切换全量归档的分组。
 */
import ArchiveList, {
	type ArchiveGroup,
	type ArchiveItem,
} from "@components/atoms/blog/ArchiveList.svelte";
import Card from "@components/atoms/display/Card.svelte";
import SegmentedButton from "@components/atoms/selection/SegmentedButton.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { formatCalendarDate } from "@utils/content-date";
import { getPostUrlBySlug, url } from "@utils/url-utils";
import { onMount } from "svelte";

interface Post {
	slug: string;
	url?: string;
	data: {
		title: string;
		tags: string[];
		category: string | null;
		published: Date;
	};
}

let { sortedPosts = [] as Post[] }: { sortedPosts?: Post[] } = $props();

let category = $state("");
let tag = $state("");
let uncategorized = $state(false);
/** 分组维度（SegmentedButton 驱动）：year / category / tag，string 以匹配 bind:value */
let groupBy = $state<string>("year");
let restoredCollapsed = $state<Record<string, boolean> | undefined>(undefined);

const COLLAPSED_STORAGE_KEY = "shirone:archive-collapsed";

function collapsedViewKey() {
	if (uncategorized) return `${groupBy}:uncategorized`;
	if (category) return `${groupBy}:category:${category}`;
	if (tag) return `${groupBy}:tag:${tag}`;
	return groupBy;
}

function readCollapsedState() {
	try {
		const stored = JSON.parse(
			localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? "{}",
		) as Record<string, Record<string, boolean>>;
		restoredCollapsed = stored[collapsedViewKey()];
	} catch {
		restoredCollapsed = undefined;
	}
}

function persistCollapsedState(next: Record<string, boolean>) {
	try {
		const stored = JSON.parse(
			localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? "{}",
		) as Record<string, Record<string, boolean>>;
		stored[collapsedViewKey()] = next;
		localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(stored));
	} catch {
		// Storage can be unavailable in privacy-restricted contexts.
	}
}

/** 筛选头数据：类别（决定索引链接）+ 展示值；无筛选为 null */
const filterCrumb = $derived.by(() => {
	if (uncategorized) {
		return {
			href: url("/categories/"),
			label: i18n(I18nKey.categories),
			value: i18n(I18nKey.uncategorized),
		};
	}
	if (category) {
		return {
			href: url("/categories/"),
			label: i18n(I18nKey.categories),
			value: category,
		};
	}
	if (tag) {
		return {
			href: url("/tags/"),
			label: i18n(I18nKey.tags),
			value: `#${tag}`,
		};
	}
	return null;
});

const groupOptions = [
	{ value: "year", label: i18n(I18nKey.archiveGroupYear) },
	{ value: "category", label: i18n(I18nKey.archiveGroupCategory) },
	{ value: "tag", label: i18n(I18nKey.archiveGroupTag) },
];

/** 筛选后的文章（分组维度与之正交，均在下方消费） */
const filtered = $derived(
	sortedPosts.filter((p) => {
		if (uncategorized && p.data.category) return false;
		if (category && p.data.category !== category) return false;
		if (tag && !p.data.tags.includes(tag)) return false;
		return true;
	}),
);

function formatDate(date: Date) {
	return formatCalendarDate(date).slice(5);
}

function toItem(post: Post): ArchiveItem {
	return {
		title: post.data.title,
		href: post.url ?? getPostUrlBySlug(post.slug),
		date: formatDate(post.data.published),
		category: post.data.category ?? undefined,
		tags: post.data.tags,
	};
}

function countLabel(count: number) {
	return `${count} ${i18n(count === 1 ? I18nKey.postCount : I18nKey.postsCount)}`;
}

/** 按当前分组维度构建组；组内保持筛选后顺序（时间倒序）。 */
const groups = $derived.by((): ArchiveGroup[] => {
	if (filtered.length === 0) return [];
	const buckets = new Map<string, ArchiveItem[]>();
	const add = (key: string, item: ArchiveItem) => {
		const list = buckets.get(key);
		if (list) list.push(item);
		else buckets.set(key, [item]);
	};
	if (groupBy === "category") {
		for (const p of filtered) {
			add(p.data.category ?? i18n(I18nKey.uncategorized), toItem(p));
		}
	} else if (groupBy === "tag") {
		for (const p of filtered) {
			for (const t of p.data.tags) add(`#${t}`, toItem(p));
		}
	} else {
		for (const p of filtered) {
			add(formatCalendarDate(p.data.published).slice(0, 4), toItem(p));
		}
	}
	const list = [...buckets.entries()].map(([id, items]) => ({
		id,
		title: id,
		items,
	}));
	if (groupBy === "year") {
		return list.sort((a, b) => Number(b.title) - Number(a.title));
	}
	return list.sort((a, b) =>
		a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
	);
});

/** 按标签视图（Firefly /tags/ 同款）：标签云 + Top 10 排行，点击应用站内标签筛选 */
const tagStats = $derived.by(() => {
	if (groupBy !== "tag") return [];
	const counts = new Map<string, number>();
	for (const p of filtered) {
		for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
});

/** Top 10：按篇数降序取前十 */
const topTags = $derived([...tagStats].sort((a, b) => b.count - a.count).slice(0, 10));
/** 进度条基准：第一名篇数（相对百分比，与 Firefly 一致） */
const topMaxCount = $derived(topTags.length > 0 ? topTags[0].count : 1);

/** 点击标签云 / 排行项：应用标签筛选并同步到 URL（?tag=），切回按年时间轴 */
function selectTag(name: string) {
	tag = name;
	groupBy = "year";
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		params.set("tag", name);
		history.replaceState(null, "", `?${params.toString()}`);
	}
}

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	category = params.get("category") || "";
	tag = params.get("tag") || "";
	uncategorized = params.has("uncategorized");
	readCollapsedState();
});

$effect(() => {
	groupBy;
	category;
	tag;
	uncategorized;
	if (typeof window !== "undefined") readCollapsedState();
});
</script>

<Card color="var(--card-bg)" radius="l" class="archive-panel px-8 py-6">
	<!-- 带筛选参数（?category= / ?tag= / ?uncategorized）是定向浏览视图：
	    隐藏分组切换，只留面包屑 + 筛选后时间轴；无筛选才显示分组切换。 -->
	{#if !filterCrumb}
		<div class="archive-panel__group-switch">
			<SegmentedButton
				options={groupOptions}
				bind:value={groupBy}
				label={i18n(I18nKey.archiveGroup)}
			/>
		</div>
	{/if}
	{#if filterCrumb}
		<nav class="archive-panel__crumb" aria-label="Breadcrumb">
			<ol class="archive-panel__crumb-list">
				<li class="archive-panel__crumb-item">
					<a class="archive-panel__crumb-link m3-state-layer" href={filterCrumb.href}>
						{filterCrumb.label}
					</a>
				</li>
				<li class="archive-panel__crumb-separator" aria-hidden="true">
					<Icon icon="material-symbols:chevron-right-rounded" />
				</li>
				<li class="archive-panel__crumb-current">
					<span
						class="archive-panel__crumb-value"
						aria-current="page"
						title={filterCrumb.value}
					>{filterCrumb.value}</span>
				</li>
			</ol>
		</nav>
	{/if}
	{#if !filterCrumb && groupBy === "tag"}
		<!-- 按标签视图：标签云 + Top 10 排行（Firefly /tags/ 同款布局，M3E token 实现） -->
		{#if tagStats.length > 0}
			<div class="archive-panel__tags-cloud">
				{#each tagStats as t (t.name)}
					<button
						type="button"
						class="archive-tags__pill"
						onclick={() => selectTag(t.name)}
					>
						<span class="archive-tags__pill-name">{t.name}</span>
						<span class="archive-tags__pill-count">{t.count}</span>
					</button>
				{/each}
			</div>
			{#if topTags.length > 0}
				<section class="archive-panel__tags-top">
					<h2 class="archive-panel__tags-top-title">Top 10</h2>
					<ol class="archive-tags__top-list">
						{#each topTags as t, i (t.name)}
							<li>
								<button
									type="button"
									class="archive-tags__row"
									onclick={() => selectTag(t.name)}
								>
									<span class="archive-tags__rank">{i + 1}</span>
									<span class="archive-tags__row-main">
										<span class="archive-tags__row-head">
											<span class="archive-tags__row-name">#{t.name}</span>
											<span class="archive-tags__row-count">{countLabel(t.count)}</span>
										</span>
										<span class="archive-tags__bar" aria-hidden="true">
											<span
												class="archive-tags__bar-fill"
												style={`width: ${(t.count / topMaxCount) * 100}%`}
											></span>
										</span>
									</span>
								</button>
							</li>
						{/each}
					</ol>
				</section>
			{/if}
		{:else}
			<div class="archive-panel__empty">
				<span>{i18n(I18nKey.noData)}</span>
			</div>
		{/if}
	{:else if groups.length > 0}
		<ArchiveList
			{groups}
			{countLabel}
			{restoredCollapsed}
			onCollapsedChange={persistCollapsedState}
		/>
	{:else}
		<div class="archive-panel__empty">
			<span>{i18n(I18nKey.noData)}</span>
		</div>
	{/if}
</Card>

<style lang="stylus">
@import "../../styles/breakpoints.styl"

:global(.archive-panel)
	@media (max-width: bp-sm - 1px)
		padding: 1rem

.archive-panel
	/* 分组切换（SegmentedButton，站内 pill 语言）与下方时间轴之间的节奏 */
	:global(&__group-switch)
		margin-bottom: 1rem

	:global(&__empty)
		display: flex
		align-items: center
		justify-content: center
		min-height: 11rem
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-large)

	:global(&__crumb)
		min-width: 0
		padding: 0 0.25rem 0.875rem
		margin-bottom: 1.25rem
		border-bottom: 1px solid var(--outline-variant)

	:global(&__crumb-list)
		display: flex
		align-items: center
		min-width: 0
		margin: 0
		padding: 0
		list-style: none

	:global(&__crumb-item)
		flex-shrink: 0

	:global(&__crumb-link)
		display: inline-flex
		align-items: center
		min-height: 2rem
		padding: 0 0.5rem
		margin-left: -0.5rem
		border-radius: var(--shape-corner-m)
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-medium)
		font-weight: 600
		text-decoration: none
		--m3e-state-color: var(--primary)
		> :global(svg)
			width: 1.125rem
			height: 1.125rem
		&:hover
			color: var(--primary)

	:global(&__crumb-separator)
		display: inline-flex
		align-items: center
		justify-content: center
		flex-shrink: 0
		width: 1.5rem
		color: var(--outline)
		> :global(svg)
			width: 1rem
			height: 1rem

	:global(&__crumb-current)
		display: block
		min-width: 0

	:global(&__crumb-value)
		display: block
		min-width: 0
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
		color: var(--primary)
		font: var(--m3e-type-body-medium)
		font-weight: 600

	@media (max-width: bp-sm - 1px)
		:global(&__crumb)
			padding-inline: 0
			padding-bottom: 0.75rem
			margin-bottom: 1rem

/* —— 按标签视图：标签云 + Top 10 排行（Firefly /tags/ 同款布局，M3E token 实现） —— */
:global(.archive-panel__tags-cloud)
	display: flex
	flex-wrap: wrap
	gap: 0.75rem
	padding-top: 0.25rem

:global(.archive-tags__pill)
	display: inline-flex
	align-items: center
	gap: 0.5rem
	padding: 0.375rem 0.75rem
	border: 1px solid var(--outline-variant)
	border-radius: var(--shape-corner-full)
	background: var(--card-bg)
	color: var(--on-surface)
	font: var(--m3e-type-body-medium)
	font-weight: 500
	cursor: pointer
	transition:
		border-color var(--m3e-duration-short) var(--m3e-easing-standard),
		background-color var(--m3e-duration-short) var(--m3e-easing-standard)

:global(.archive-tags__pill:hover)
	border-color: var(--primary)
	background: unquote("color-mix(in oklab, var(--primary) 6%, var(--card-bg))")

:global(.archive-tags__pill:hover .archive-tags__pill-count)
	background: var(--primary)
	color: var(--card-bg)

:global(.archive-tags__pill-count)
	display: inline-flex
	align-items: center
	justify-content: center
	min-width: 1.5rem
	padding: 0 0.375rem
	border-radius: var(--shape-corner-full)
	background: unquote("color-mix(in oklab, var(--primary) 12%, transparent)")
	color: var(--primary)
	font: var(--m3e-type-label-small)
	font-weight: 700
	transition:
		background-color var(--m3e-duration-short) var(--m3e-easing-standard),
		color var(--m3e-duration-short) var(--m3e-easing-standard)

:global(.archive-panel__tags-top)
	margin-top: 2.5rem
	padding-top: 1.75rem
	border-top: 1px solid var(--outline-variant)

:global(.archive-panel__tags-top-title)
	margin: 0 0 1.25rem
	color: var(--on-surface)
	font: var(--m3e-type-title-medium)
	font-weight: 700

:global(.archive-tags__top-list)
	display: flex
	flex-direction: column
	gap: 0.75rem
	margin: 0
	padding: 0
	list-style: none

:global(.archive-tags__row)
	display: flex
	align-items: flex-start
	gap: 0.75rem
	width: 100%
	padding: 0.5rem 0.75rem
	border: none
	border-radius: var(--shape-corner-m)
	background: none
	text-align: left
	cursor: pointer
	transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard)

:global(.archive-tags__row:hover)
	background: unquote("color-mix(in oklab, var(--primary) 6%, transparent)")

:global(.archive-tags__row:hover .archive-tags__row-name)
	color: var(--primary)

:global(.archive-tags__rank)
	flex-shrink: 0
	width: 1.5rem
	color: var(--primary)
	font: var(--m3e-type-label-large)
	font-weight: 700
	text-align: right

:global(.archive-tags__row-main)
	flex: 1
	min-width: 0

:global(.archive-tags__row-head)
	display: flex
	align-items: baseline
	justify-content: space-between
	gap: 0.5rem
	margin-bottom: 0.375rem

:global(.archive-tags__row-name)
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap
	color: var(--on-surface)
	font: var(--m3e-type-body-medium)
	font-weight: 500
	transition: color var(--m3e-duration-short) var(--m3e-easing-standard)

:global(.archive-tags__row-count)
	flex-shrink: 0
	color: var(--primary)
	font: var(--m3e-type-label-small)
	font-weight: 600

:global(.archive-tags__bar)
	display: block
	height: 0.5rem
	overflow: hidden
	border-radius: var(--shape-corner-full)
	background: unquote("color-mix(in oklab, var(--primary) 10%, transparent)")

:global(.archive-tags__bar-fill)
	display: block
	height: 100%
	border-radius: inherit
	background: var(--primary)
	transition: width var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate)
</style>
