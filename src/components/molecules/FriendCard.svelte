<script lang="ts">
import Avatar from "@components/atoms/display/Avatar.svelte";
import Icon from "@iconify/svelte";
import type { FriendItem } from "../../data/friends";

let { friend }: { friend: FriendItem } = $props();
</script>

<a
	class="friend-card"
	href={friend.siteurl}
	target="_blank"
	rel="noopener noreferrer"
	aria-label={friend.title}
>
	<span class="friend-card__arrow" aria-hidden="true">
		<Icon icon="material-symbols:arrow-outward-rounded" />
	</span>

	<Avatar
		src={friend.imgurl}
		alt={friend.title}
		size={56}
		shape="rounded"
	/>

	<div class="friend-card__info">
		<span class="friend-card__title">{friend.title}</span>

		{#if friend.desc}
			<p class="friend-card__desc">{friend.desc}</p>
		{/if}

		{#if friend.tags.length > 0}
			<div class="friend-card__tags">
				{#each friend.tags as tag (tag)}
					<span class="friend-card__tag">{tag}</span>
				{/each}
			</div>
		{/if}
	</div>
</a>

<style lang="stylus">
.friend-card
	position: relative
	display: flex
	align-items: center
	gap: 0.875rem
	box-sizing: border-box
	width: 100%
	overflow: hidden
	padding: 0.875rem
	border-radius: var(--shape-corner-l)
	background: var(--card-bg)
	color: var(--on-surface)
	border: 1px solid var(--outline-variant)
	text-decoration: none
	transition:
		border-color var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate),
		box-shadow var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate),
		background-color var(--m3e-duration-medium) var(--m3e-easing-standard)

	/* hover：边框/标题/背景转向 primary，右上角浮现外链箭头，头像轻微放大 */
	&:hover
		border-color: var(--primary)
		background: unquote("color-mix(in oklab, var(--primary) 5%, var(--card-bg))")
		box-shadow: var(--m3e-elevation-1)

		.friend-card__title
			color: var(--primary)

		.friend-card__arrow
			opacity: 1
			transform: none

		:global(.m3-avatar)
			transform: scale(1.05)

	&__arrow
		position: absolute
		top: 0.625rem
		right: 0.625rem
		display: inline-flex
		flex-shrink: 0
		color: var(--primary)
		opacity: 0
		transform: translate(-0.25rem, 0.25rem)
		transition:
			opacity var(--m3e-duration-medium) var(--m3e-easing-standard),
			transform var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate)
		> :global(svg)
			width: 1.125rem
			height: 1.125rem

	:global(.m3-avatar)
		transition: transform var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate)

	&__info
		min-width: 0
		flex: 1
		display: flex
		flex-direction: column
		gap: 0.25rem

	&__title
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
		padding-right: 1.25rem
		color: var(--on-surface)
		font: var(--m3e-type-title-small)
		font-weight: 700
		line-height: 1.3
		text-decoration: none
		transition: color var(--m3e-duration-short) var(--m3e-easing-standard)

	&__desc
		margin: 0
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.5

	&__tags
		display: flex
		flex-wrap: wrap
		gap: 0.25rem

	&__tag
		padding: 0.0625rem 0.5rem
		border-radius: var(--shape-corner-full)
		background: unquote("color-mix(in oklab, var(--on-surface-variant) 8%, transparent)")
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
</style>
