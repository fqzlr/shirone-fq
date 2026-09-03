<script lang="ts">
import Avatar from "@components/atoms/display/Avatar.svelte";
import Card from "@components/atoms/display/Card.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import type { FriendNoteItem, FriendSiteInfo } from "@/types/friendPageConfig";

let {
	site,
	template = "",
	notes = [] as FriendNoteItem[],
}: {
	/** 本站信息（avatar 已在 SSR 侧解析为可用 URL） */
	site: FriendSiteInfo;
	/** 申请友链模板（空串则跳过第 2 步的复制块） */
	template?: string;
	/** 注意事项列表 */
	notes?: FriendNoteItem[];
} = $props();

/** 复制状态：记录正在展示成功勾的键（字段名或 "template"），1.5s 后还原 */
let copiedKey = $state<string | null>(null);
let copyTimers: ReturnType<typeof setTimeout>[] = [];

const fields = $derived(
	[
		{ key: "name", label: i18n(I18nKey.friendFieldSiteName), value: site.name },
		{ key: "desc", label: i18n(I18nKey.friendFieldSiteDesc), value: site.desc },
		{ key: "url", label: i18n(I18nKey.friendFieldSiteUrl), value: site.url },
		{
			key: "avatar",
			label: i18n(I18nKey.friendFieldAvatar),
			value: site.avatar,
		},
	].filter((field) => Boolean(field.value)),
);

const steps = $derived([
	{
		title: i18n(I18nKey.friendStep1Title),
		desc: i18n(I18nKey.friendStep1Desc),
	},
	{
		title: i18n(I18nKey.friendStep2Title),
		desc: i18n(I18nKey.friendStep2Desc),
	},
	{
		title: i18n(I18nKey.friendStep3Title),
		desc: i18n(I18nKey.friendStep3Desc),
	},
]);

async function copyText(key: string, value: string) {
	try {
		await navigator.clipboard.writeText(value);
	} catch {
		// 剪贴板不可用（非 HTTPS / 权限拒绝）时静默失败，保持图标不切换
		return;
	}
	copyTimers.forEach(clearTimeout);
	copiedKey = key;
	copyTimers = [setTimeout(() => (copiedKey = null), 1500)];
}
</script>

<div class="friend-guide">
	<div class="friend-guide__grid">
		<!-- padding 用 Tailwind p-6：自定义 class 写在 Card（子组件）上会被 Svelte unused-CSS 剥离（pitfalls.md §1.6） -->
		<!-- filled --card-bg 与 MomentSection/CommentSection 包裹卡同方案，保证主题视觉统一 -->
		<Card color="var(--card-bg)" radius="l" class="p-6">
			<div class="friend-guide__site">
				<div class="friend-guide__site-avatar">
					<Avatar
						src={site.avatar}
						alt={site.name ?? ""}
						size={64}
						shape="rounded"
					/>
					<span class="friend-guide__site-badge" aria-hidden="true">
						<Icon icon="material-symbols:check-rounded" />
					</span>
				</div>
				<div class="friend-guide__site-meta">
					<span class="friend-guide__site-name">{site.name}</span>
					{#if site.desc}
						<p class="friend-guide__site-desc">{site.desc}</p>
					{/if}
				</div>
			</div>

			<div class="friend-guide__fields">
				{#each fields as field (field.key)}
					<div class="friend-guide__field">
						<div class="friend-guide__field-text">
							<span class="friend-guide__field-label">{field.label}</span>
							<span class="friend-guide__field-value">{field.value}</span>
						</div>
						<button
							type="button"
							class="friend-guide__copy"
							class:friend-guide__copy--done={copiedKey === field.key}
							aria-label={i18n(I18nKey.friendCopyField).replace("{name}", field.label)}
							onclick={() => field.value && copyText(field.key, field.value)}
						>
							<Icon
								icon="material-symbols:content-copy-outline-rounded"
								aria-hidden="true"
							/>
							<Icon
								icon="material-symbols:check-rounded"
								aria-hidden="true"
								class="friend-guide__copy-done-icon"
							/>
						</button>
					</div>
				{/each}
			</div>
		</Card>

		<Card color="var(--card-bg)" radius="l" class="p-6">
			<h2 class="friend-guide__heading">
				<span class="friend-guide__heading-icon" aria-hidden="true">
					<Icon icon="material-symbols:assignment-outline-rounded" />
				</span>
				{i18n(I18nKey.friendGuideApply)}
			</h2>

			<ol class="friend-guide__steps">
				{#each steps as step, index (step.title)}
					<li class="friend-guide__step">
						<div class="friend-guide__step-rail" aria-hidden="true">
							<span class="friend-guide__step-index">{index + 1}</span>
							{#if index < steps.length - 1}
								<span class="friend-guide__step-line"></span>
							{/if}
						</div>
						<div class="friend-guide__step-body">
							<p class="friend-guide__step-title">
								{step.title}
								{#if index === 1 && site.email}
									<code class="friend-guide__email">{site.email}</code>
								{/if}
							</p>
							<p class="friend-guide__step-desc">{step.desc}</p>
							{#if index === 1 && template}
								<div class="friend-guide__template">
									<button
										type="button"
										class="friend-guide__copy friend-guide__copy--template"
										class:friend-guide__copy--done={copiedKey === "template"}
										aria-label={i18n(I18nKey.friendCopyTemplate)}
										onclick={() => copyText("template", template)}
									>
										<Icon
											icon="material-symbols:content-copy-outline-rounded"
											aria-hidden="true"
										/>
										<Icon
											icon="material-symbols:check-rounded"
											aria-hidden="true"
											class="friend-guide__copy-done-icon"
										/>
									</button>
									<pre class="friend-guide__template-text">{template}</pre>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		</Card>
	</div>

	{#if notes.length > 0}
		<Card color="var(--card-bg)" radius="l" class="p-6">
			<h3 class="friend-guide__heading friend-guide__heading--notes">
				<Icon
					icon="material-symbols:info-outline-rounded"
					class="friend-guide__heading-bare-icon"
					aria-hidden="true"
				/>
				{i18n(I18nKey.friendGuideNotes)}
			</h3>
			<ul class="friend-guide__notes">
				{#each notes as note (note.title)}
					<li class="friend-guide__note">
						<span class="friend-guide__note-dot" aria-hidden="true"></span>
						<p class="friend-guide__note-text">
							<strong>{note.title}</strong>
							{note.content}
						</p>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}
</div>

<style lang="stylus">
.friend-guide
	display: flex
	flex-direction: column
	gap: 1rem
	width: 100%

	&__grid
		display: grid
		grid-template-columns: 1fr
		gap: 1rem

		@media (min-width: 64rem)
			grid-template-columns: repeat(2, 1fr)

	/* 卡片内边距由模板里 Card 的 Tailwind p-6 提供：
	   自定义 class 写在子组件上，scoped 规则会被 Svelte unused-CSS 分析剥离（pitfalls.md §1.6） */

	&__heading
		display: flex
		align-items: center
		gap: 0.5rem
		margin: 0 0 1.25rem
		color: var(--on-surface)
		font: var(--m3e-type-title-medium)
		font-weight: 700

	/* 注意事项标题：裸图标（不带底色盒），间距收紧一档 */
	&__heading--notes
		margin: 0 0 1rem

	&__heading-bare-icon
		color: var(--primary)
		> :global(svg)
			width: 1.125rem
			height: 1.125rem

	&__heading-icon
		display: inline-flex
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		border-radius: var(--shape-corner-m)
		background: unquote("color-mix(in oklab, var(--primary) 12%, transparent)")
		color: var(--primary)
		> :global(svg)
			width: 1rem
			height: 1rem

	/* 左卡：站点头部（头像 + 名称 + 描述，含校验徽标） */
	&__site
		display: flex
		align-items: center
		gap: 1rem
		margin-bottom: 1.25rem

	&__site-avatar
		position: relative
		flex-shrink: 0
		width: fit-content

		:global(.m3-avatar)
			box-shadow: 0 0 0 2px unquote("color-mix(in oklab, var(--primary) 20%, transparent)")

	&__site-badge
		position: absolute
		right: -0.25rem
		bottom: -0.25rem
		display: flex
		align-items: center
		justify-content: center
		width: 1.25rem
		height: 1.25rem
		border-radius: var(--shape-corner-full)
		background: var(--primary)
		color: var(--on-primary)
		box-shadow: var(--m3e-elevation-1)
		> :global(svg)
			width: 0.75rem
			height: 0.75rem

	&__site-meta
		min-width: 0

	&__site-name
		display: block
		color: var(--on-surface)
		font: var(--m3e-type-title-medium)
		font-weight: 700

	&__site-desc
		margin: 0.25rem 0 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.5

	/* 可复制字段行 */
	&__fields
		display: flex
		flex-direction: column
		gap: 0.625rem

	&__field
		display: flex
		align-items: center
		justify-content: space-between
		gap: 0.5rem
		padding: 0.5rem 0.75rem
		border-radius: var(--shape-corner-m)
		background: unquote("color-mix(in oklab, var(--on-surface) 5%, transparent)")

	&__field-text
		min-width: 0
		display: flex
		flex-direction: column
		gap: 0.125rem

	&__field-label
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)

	&__field-value
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
		color: var(--on-surface)
		font: var(--m3e-type-body-small)
		font-weight: 500

	/* 复制按钮：默认拷贝图标，成功态变勾 */
	&__copy
		position: relative
		display: inline-flex
		align-items: center
		justify-content: center
		flex-shrink: 0
		width: 1.75rem
		height: 1.75rem
		padding: 0
		border: none
		border-radius: var(--shape-corner-m)
		background: unquote("color-mix(in oklab, var(--on-surface) 10%, transparent)")
		color: var(--on-surface)
		cursor: pointer
		transition:
			opacity var(--m3e-duration-short) var(--m3e-easing-standard),
			background-color var(--m3e-duration-short) var(--m3e-easing-standard)
		&:hover
			opacity: 0.8
		> :global(svg)
			width: 0.875rem
			height: 0.875rem
			transition: opacity var(--m3e-duration-short) var(--m3e-easing-standard)
		:global(.friend-guide__copy-done-icon)
			position: absolute
			opacity: 0

	&__copy--done
		background: unquote("color-mix(in oklab, var(--primary) 18%, transparent)")
		color: var(--primary)
		> :global(svg:first-child)
			opacity: 0
		:global(.friend-guide__copy-done-icon)
			opacity: 1

	/* 右卡：三步时间线 */
	&__steps
		display: flex
		flex-direction: column
		margin: 0
		padding: 0
		list-style: none

	&__step
		display: flex
		gap: 0.875rem

	&__step-rail
		display: flex
		flex-direction: column
		align-items: center
		flex-shrink: 0

	&__step-index
		display: flex
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		border-radius: var(--shape-corner-full)
		background: var(--primary)
		color: var(--on-primary)
		font: var(--m3e-type-label-large)
		font-weight: 700

	&__step-line
		flex: 1
		width: 2px
		margin: 0.375rem 0
		border-radius: var(--shape-corner-full)
		background: var(--outline-variant)

	&__step-body
		flex: 1
		min-width: 0
		padding-bottom: 1rem

		.friend-guide__step:last-child &
			padding-bottom: 0

	&__step-title
		display: flex
		align-items: center
		flex-wrap: wrap
		gap: 0.375rem
		margin: 0.25rem 0 0.25rem
		color: var(--on-surface)
		font: var(--m3e-type-title-small)
		font-weight: 600

	&__email
		padding: 0.0625rem 0.375rem
		border-radius: var(--shape-corner-m)
		background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-family: inherit

	&__step-desc
		margin: 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.6

	&__template
		position: relative
		margin-top: 0.625rem
		padding: 1rem 2.5rem 1rem 1rem
		border-radius: var(--shape-corner-m)
		background: unquote("color-mix(in oklab, var(--on-surface) 5%, transparent)")

	&__copy--template
		position: absolute
		top: 0.5rem
		right: 0.5rem

	&__template-text
		margin: 0
		overflow-x: auto
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		font-family: inherit
		line-height: 1.7
		white-space: pre

	/* 底卡：注意事项圆点列表 */
	&__notes
		display: flex
		flex-direction: column
		gap: 0.75rem
		margin: 0
		padding: 0
		list-style: none

	&__note
		display: flex
		align-items: baseline
		gap: 0.625rem

	&__note-dot
		flex-shrink: 0
		width: 0.375rem
		height: 0.375rem
		border-radius: var(--shape-corner-full)
		background: var(--primary)

	&__note-text
		margin: 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-medium)
		line-height: 1.6
		> strong
			color: var(--on-surface)
			font-weight: 600
</style>
