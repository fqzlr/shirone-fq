<script lang="ts">
import Avatar from "@components/atoms/display/Avatar.svelte";
import Icon from "@iconify/svelte";
import type { FriendStatusInfo } from "@utils/friend-check";
import type { FriendItem } from "../../data/friends";
import { auroraFlow, starFlow } from "./friend-effects";

let {
	friend,
	status = undefined,
	checkEnabled = false,
}: {
	friend: FriendItem;
	/** 检测状态（由 FriendSection 传入；未匹配到检测记录时为 undefined） */
	status?: FriendStatusInfo;
	/** 友链检测是否启用（决定是否输出状态徽标 DOM；关闭时零 DOM） */
	checkEnabled?: boolean;
} = $props();
</script>

<a
	class="friend-card"
	class:friend-card--owner={friend.owner}
	class:friend-card--featured={friend.featured}
	href={friend.siteurl}
	target="_blank"
	rel="noopener noreferrer"
	aria-label={friend.title}
	data-siteshot={status?.siteshot ?? ""}
>
	{#if checkEnabled}
		<!-- 可达性徽标：SSR 输出但默认隐藏，检测数据就绪后按 data-status 点亮 -->
		<span class="friend-card__status" data-status={status?.level ?? ""}>
			{status?.label ?? ""}
		</span>
	{/if}

	{#if !status}
		<span class="friend-card__arrow" aria-hidden="true">
			<Icon icon="material-symbols:arrow-outward-rounded" />
		</span>
	{/if}

	<span class="friend-card__avatar-wrap">
		<Avatar
			src={friend.imgurl}
			alt={friend.title}
			size={56}
			shape="rounded"
		/>
	</span>

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

	{#if friend.featured}
		<!-- 推荐友链：右上角大星星背景装饰（mask SVG，位于内容层之下） -->
		<span
			class="friend-card__deco friend-card__deco--star"
			aria-hidden="true"
		></span>
		<!-- 推荐友链：金色流星（canvas 粒子 + CSS 扫带，reduced-motion 时仅静态光感） -->
		<span
			class="friend-card__fx friend-card__fx--star"
			use:starFlow
			aria-hidden="true"
		></span>
	{/if}
	{#if friend.owner}
		<!-- 站长卡片：右上角小房子背景装饰（mask SVG） -->
		<span
			class="friend-card__deco friend-card__deco--house"
			aria-hidden="true"
		></span>
		<!-- 站长卡片：紫色上升星芒 -->
		<span
			class="friend-card__fx friend-card__fx--aurora"
			use:auroraFlow
			aria-hidden="true"
		></span>
	{/if}
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

		.friend-card__deco--star
			opacity: 0.6
			transform: rotate(-12deg) scale(1.05)

		.friend-card__deco--house
			opacity: 0.5
			transform: rotate(-10deg) scale(1.05)

	/* —— 可达性状态徽标（右上角；检测关闭时模板层短路，零 DOM） —— */
	&__status
		position: absolute
		top: 0.5rem
		right: 0.5rem
		z-index: 3
		display: none
		align-items: center
		gap: 0.3rem
		padding: 0.2rem 0.5rem 0.2rem 0.4rem
		border-radius: var(--shape-corner-full)
		color: #fff
		font: var(--m3e-type-label-small)
		font-weight: 700
		line-height: 1.2
		letter-spacing: 0.02em
		backdrop-filter: blur(6px)
		box-shadow: 0 0.125rem 0.375rem rgba(0, 0, 0, 0.16)

		/* 徽标白点：呼吸脉冲（reduced-motion 由全局规则禁用动画） */
		&::before
			content: ""
			width: 0.375rem
			height: 0.375rem
			border-radius: var(--shape-corner-full)
			background: #fff
			animation: friend-status-pulse 2.4s var(--m3e-easing-standard) infinite

		&[data-status="success"]
			display: inline-flex
			background: rgba(34, 197, 94, 0.92)
		&[data-status="slow"]
			display: inline-flex
			background: rgba(245, 158, 11, 0.92)
		&[data-status="warn"]
			display: inline-flex
			background: rgba(249, 115, 22, 0.92)
		&[data-status="timeout"]
			display: inline-flex
			background: var(--error)

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
		position: relative
		z-index: 2

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

	/* —— 特效宿主：绝对定位光感层，canvas 粒子由 friend-effects action 注入 —— */
	&__fx
		position: absolute
		inset: 0
		z-index: 1
		display: block
		overflow: hidden
		border-radius: inherit
		pointer-events: none
		contain: paint

		> canvas
			position: absolute
			inset: 0
			width: 100%
			height: 100%
			display: block
			background: transparent

		/* 扫带：周期掠过的光带（reduced-motion 由全局规则禁用动画，保留静态光感） */
		&::before
			content: ""
			position: absolute
			top: -88%
			bottom: -88%
			left: -64%
			width: 54%
			filter: blur(0.18rem)
			transform: translate3d(-8%, 0, 0) skewX(-9deg)
			will-change: transform, opacity

	&__fx--star
		&::before
			background: unquote("linear-gradient(104deg, transparent 0 30%, color-mix(in oklab, oklch(0.78 0.13 85) 28%, transparent) 40%, color-mix(in oklab, white 72%, oklch(0.78 0.13 85)) 49%, color-mix(in oklab, oklch(0.78 0.13 85) 22%, transparent) 58%, transparent 74%)")
			animation: friend-fx-sweep-star 3.8s var(--m3e-easing-standard) infinite

	&__fx--aurora
		&::before
			background: unquote("linear-gradient(100deg, transparent 0 30%, color-mix(in oklab, oklch(0.66 0.15 290) 30%, transparent) 40%, color-mix(in oklab, white 70%, oklch(0.66 0.15 290)) 49%, color-mix(in oklab, oklch(0.66 0.15 290) 24%, transparent) 58%, transparent 74%)")
			animation: friend-fx-sweep-aurora 5.2s var(--m3e-easing-standard) infinite

	/* —— 头像容器：抬到特效层之上（星星/粒子不会盖住头像） —— */
	&__avatar-wrap
		position: relative
		z-index: 2
		display: inline-flex
		flex-shrink: 0

	/* —— 背景装饰：推荐卡大星星 / 站长卡小房子（mask SVG，内容层之下、hover 增强） —— */
	&__deco
		position: absolute
		top: 0.4rem
		right: 0.4rem
		z-index: 1
		display: block
		width: 4.6rem
		height: 4.6rem
		pointer-events: none
		-webkit-mask-position: center
		mask-position: center
		-webkit-mask-repeat: no-repeat
		mask-repeat: no-repeat
		-webkit-mask-size: contain
		mask-size: contain
		transition: opacity 300ms ease, transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)

	&__deco--star
		background: unquote("linear-gradient(138deg, #f7c73f, #ffdc70 70%, #eea915)")
		-webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M60 14c4 0 7 3 9 7l10 21 24 4c4 1 7 3 8 7 1 3 0 7-3 10L90 80l4 24c1 4-1 8-4 10-3 2-7 2-11 0L60 102l-19 12c-4 2-8 2-11 0-3-2-5-6-4-10l4-24-18-17c-3-3-4-7-3-10 1-4 4-6 8-7l24-4 10-21c2-4 5-7 9-7Z' stroke-width='4'/%3E%3Cpath d='m23 26 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Zm79 65 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5-4Z' stroke-width='2.5'/%3E%3C/g%3E%3C/svg%3E")
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M60 14c4 0 7 3 9 7l10 21 24 4c4 1 7 3 8 7 1 3 0 7-3 10L90 80l4 24c1 4-1 8-4 10-3 2-7 2-11 0L60 102l-19 12c-4 2-8 2-11 0-3-2-5-6-4-10l4-24-18-17c-3-3-4-7-3-10 1-4 4-6 8-7l24-4 10-21c2-4 5-7 9-7Z' stroke-width='4'/%3E%3Cpath d='m23 26 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Zm79 65 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5-4Z' stroke-width='2.5'/%3E%3C/g%3E%3C/svg%3E")
		opacity: 0.42
		transform: rotate(-8deg)
		animation: friend-star-pulse 4s ease-in-out infinite

	&__deco--house
		background: unquote("linear-gradient(135deg, #a594ff, #8d7cff 70%, #6c5bd9)")
		-webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 130 120'%3E%3Cg fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 58 62 23c4-3 8-3 12 0l38 35' stroke-width='5'/%3E%3Cpath d='M31 54v43c0 6 4 10 10 10h51c6 0 10-4 10-10V54M78 31V19h17v27' stroke-width='4.5'/%3E%3Cpath d='M57 107V78c0-5 4-9 9-9h3c5 0 9 4 9 9v29M42 65h11v12H42zM86 65h8v12h-8z' stroke-width='4'/%3E%3Cpath d='M58 51c0-5 7-7 10-2 3-5 10-3 10 2 0 6-10 12-10 12S58 57 58 51Z' stroke-width='3'/%3E%3C/g%3E%3C/svg%3E")
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 130 120'%3E%3Cg fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 58 62 23c4-3 8-3 12 0l38 35' stroke-width='5'/%3E%3Cpath d='M31 54v43c0 6 4 10 10 10h51c6 0 10-4 10-10V54M78 31V19h17v27' stroke-width='4.5'/%3E%3Cpath d='M57 107V78c0-5 4-9 9-9h3c5 0 9 4 9 9v29M42 65h11v12H42zM86 65h8v12h-8z' stroke-width='4'/%3E%3Cpath d='M58 51c0-5 7-7 10-2 3-5 10-3 10 2 0 6-10 12-10 12S58 57 58 51Z' stroke-width='3'/%3E%3C/g%3E%3C/svg%3E")
		opacity: 0.3
		transform: rotate(-6deg)

	/* —— 推荐友链（金）：Waline 同源色板 #f4bb2e / #fff0a2 / #956100，48% 强混合与参考站一致 —— */
	&.friend-card--featured
		border-color: unquote("color-mix(in srgb, #f4bb2e 42%, var(--outline-variant))")
		background: unquote("color-mix(in srgb, #fff0a2 48%, var(--card-bg))")
		box-shadow: unquote("0 0.28rem 0.9rem color-mix(in srgb, #f4bb2e 18%, transparent)")

		.friend-card__title
			display: inline-block
			width: fit-content
			max-width: 100%
			padding: 0.1rem 0.5rem
			border: 1px solid unquote("color-mix(in srgb, #f4bb2e 45%, transparent)")
			border-radius: var(--shape-corner-m)
			background: unquote("color-mix(in srgb, #f4bb2e 15%, var(--card-bg))")
			color: #7a5000
			text-shadow: none

		.friend-card__desc
			color: #7a5000

		:global(.m3-avatar)
			box-shadow: unquote("0 0 0 2px color-mix(in srgb, #f4bb2e 60%, white), 0 0 0 3.5px color-mix(in srgb, #f4bb2e 24%, transparent)")

	&.friend-card--featured:hover
		border-color: #f4bb2e
		background: unquote("color-mix(in srgb, #fff0a2 62%, var(--card-bg))")

		.friend-card__title
			color: #956100

	/* —— 站长卡片（紫）：Waline 同源色板 #8d7cff / #ebe8ff / #5c49c7 —— */
	&.friend-card--owner
		border-color: unquote("color-mix(in srgb, #8d7cff 38%, var(--outline-variant))")
		background: unquote("color-mix(in srgb, #ebe8ff 48%, var(--card-bg))")
		box-shadow: unquote("0 0.28rem 0.9rem color-mix(in srgb, #8d7cff 16%, transparent)")

		.friend-card__title
			display: inline-block
			width: fit-content
			max-width: 100%
			padding: 0.1rem 0.5rem
			border: 1px solid unquote("color-mix(in srgb, #8d7cff 45%, transparent)")
			border-radius: var(--shape-corner-m)
			background: unquote("color-mix(in srgb, #8d7cff 14%, var(--card-bg))")
			color: #5c49c7
			text-shadow: none

		.friend-card__desc
			color: #4a3d99

		:global(.m3-avatar)
			box-shadow: unquote("0 0 0 2px color-mix(in srgb, #8d7cff 60%, white), 0 0 0 3.5px color-mix(in srgb, #8d7cff 24%, transparent)")

	&.friend-card--owner:hover
		border-color: #8d7cff
		background: unquote("color-mix(in srgb, #ebe8ff 62%, var(--card-bg))")
		box-shadow: unquote("0 0.3rem 1rem color-mix(in srgb, #8d7cff 24%, transparent)")

		.friend-card__title
			color: #5c49c7

/* —— 暗色模式：参考站暗色板（金 #e9bd51/#7a5714、紫 #a594ff/#3a2e7a） —— */
:global(:root.dark) .friend-card--featured
	border-color: unquote("color-mix(in srgb, #e9bd51 32%, var(--outline-variant))")
	background: unquote("color-mix(in srgb, #7a5714 18%, var(--card-bg))")

	& .friend-card__title
		border-color: unquote("color-mix(in srgb, #e9bd51 40%, transparent)")
		background: unquote("color-mix(in srgb, #e9bd51 16%, var(--card-bg))")
		color: #f3d17c
		text-shadow: none

	& .friend-card__desc
		color: #d9b35a

	& :global(.m3-avatar)
		box-shadow: unquote("0 0 0 2px color-mix(in srgb, #e9bd51 60%, white), 0 0 0 3.5px color-mix(in srgb, #e9bd51 24%, transparent)")

:global(:root.dark) .friend-card--owner
	border-color: unquote("color-mix(in srgb, #a594ff 36%, var(--outline-variant))")
	background: unquote("color-mix(in srgb, #3a2e7a 32%, var(--card-bg))")

	& .friend-card__title
		border-color: unquote("color-mix(in srgb, #a594ff 42%, transparent)")
		background: unquote("color-mix(in srgb, #a594ff 16%, var(--card-bg))")
		color: #c4b8ff
		text-shadow: none

	& .friend-card__desc
		color: #b0a4e8

	& :global(.m3-avatar)
		box-shadow: unquote("0 0 0 2px color-mix(in srgb, #a594ff 60%, white), 0 0 0 3.5px color-mix(in srgb, #a594ff 24%, transparent)")

/* 装饰星星呼吸（动画优先级高于 hover transform，与参考站一致） */
@keyframes friend-star-pulse
	0%, 100%
		transform: rotate(-8deg) scale(1)
	50%
		transform: rotate(-6deg) scale(1.04)

/* 徽标白点脉冲 */
@keyframes friend-status-pulse
	0%
		box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55)
	70%
		box-shadow: 0 0 0 0.3rem rgba(255, 255, 255, 0)
	100%
		box-shadow: 0 0 0 0 rgba(255, 255, 255, 0)

/* 金色扫带：左入右出 */
@keyframes friend-fx-sweep-star
	0%
		transform: translate3d(-8%, 0, 0) skewX(-9deg)
		opacity: 0
	10%
		opacity: 0.7
	50%
		opacity: 0.95
	90%
		opacity: 0.5
	100%
		transform: translate3d(360%, 0, 0) skewX(-9deg)
		opacity: 0

/* 紫色扫带：更缓的周期 */
@keyframes friend-fx-sweep-aurora
	0%
		transform: translate3d(-8%, 0, 0) skewX(-9deg)
		opacity: 0
	12%
		opacity: 0.6
	50%
		opacity: 0.9
	88%
		opacity: 0.45
	100%
		transform: translate3d(340%, 0, 0) skewX(-9deg)
		opacity: 0
</style>
