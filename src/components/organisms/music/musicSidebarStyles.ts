export const musicSidebarStylus = `
.music-player
	min-width: 0
	display: flex
	flex-direction: column
	gap: 0.75rem
	color: var(--on-surface)

	&__track
		display: grid
		grid-template-columns: 3.25rem minmax(0, 1fr)
		align-items: center
		gap: 0.75rem
		min-width: 0

	&__cover
		position: relative
		width: 3.25rem
		height: 3.25rem
		display: grid
		place-items: center
		border-radius: var(--shape-corner-full)
		background: var(--secondary-container)
		color: var(--on-secondary-container)
		box-shadow: 0 0 0 1.5px var(--surface-container-lowest), unquote("0 0 0 2.5px color-mix(in oklab, var(--primary) 20%, var(--outline-variant) 80%)"), unquote("0 2px 6px color-mix(in oklab, var(--on-surface) 6%, transparent)")
		transition: box-shadow var(--m3e-duration-medium) var(--m3e-easing-standard)
		animation: music-cover-playing var(--m3e-duration-ambient-extra-long) linear infinite
		animation-play-state: paused

		&::before
			content: ""
			position: absolute
			inset: -2px
			border-radius: var(--shape-corner-full)
			border: 1.5px solid var(--primary)
			opacity: 0
			pointer-events: none
			z-index: 1

		> svg
			width: 1.5rem
			height: 1.5rem

		img
			width: 100%
			height: 100%
			object-fit: cover
			border-radius: var(--shape-corner-full)

		&--playing
			animation-play-state: running
			box-shadow: 0 0 0 1.5px var(--surface-container-lowest), 0 0 0 2.5px var(--primary), unquote("0 3px 10px color-mix(in oklab, var(--primary) 22%, transparent)")

			&::before
				animation: music-cover-ripple 3.2s cubic-bezier(0.1, 0.8, 0.2, 1) infinite

			img
				animation: music-cover-bounce 3.2s ease-in-out infinite

	&__metadata
		min-width: 0
		display: flex
		flex-direction: column
		gap: 0.125rem

		strong,
		span
			overflow: hidden
			text-overflow: ellipsis
			white-space: nowrap

		strong
			font: var(--m3e-type-title-small)

		span
			font: var(--m3e-type-body-small)
			color: var(--on-surface-variant)

	&__submeta
		display: flex
		justify-content: space-between
		align-items: center
		gap: 0.375rem
		margin-top: 0.125rem
		min-height: 1.5rem

	&__time-cap
		flex-shrink: 0
		font: var(--m3e-type-label-small)
		font-variant-numeric: tabular-nums
		color: var(--on-surface-variant)

	&__volume-inline
		display: flex
		align-items: center
		gap: 0.25rem

	&__lyrics-actions
		display: flex
		align-items: center
		gap: 0.375rem
		flex-shrink: 0

		.m3-icon-button
			color: var(--on-surface-variant)

			&:hover:not(:disabled)
				color: var(--primary)

		.m3-icon-button
			position: relative
			width: 1.25rem
			height: 1.25rem
			padding: 0
			color: var(--on-surface-variant)

			&::after
				content: ""
				position: absolute
				inset: -0.5rem
				z-index: 1

			&:hover
				color: var(--primary)

			&__icon
				font-size: 1rem

	&__volume-slider-wrap
		position: relative
		width: 4.25rem
		height: 1.25rem
		display: flex
		align-items: center

	&__volume-slider
		appearance: none
		-webkit-appearance: none
		width: 100%
		height: 0.25rem
		margin: 0
		padding: 0
		border: none
		border-radius: var(--shape-corner-full)
		background: linear-gradient(to right, var(--primary) 0%, var(--primary) var(--vol-pct, 70%), var(--surface-container-highest) var(--vol-pct, 70%), var(--surface-container-highest) 100%)
		cursor: pointer
		outline: none

		&::-webkit-slider-runnable-track
			appearance: none
			-webkit-appearance: none
			height: 0.25rem
			border-radius: var(--shape-corner-full)
			background: transparent
			border: none

		&::-webkit-slider-thumb
			appearance: none
			-webkit-appearance: none
			width: 0.5rem
			height: 0.5rem
			margin-top: -0.125rem
			border: none
			border-radius: var(--shape-corner-full)
			background: var(--primary)
			box-shadow: 0 0 0 1px var(--surface-container-lowest)
			transition: transform var(--m3e-duration-short) var(--m3e-easing-standard)

			&:hover
				transform: scale(1.3)

		&::-moz-range-track
			height: 0.25rem
			border-radius: var(--shape-corner-full)
			background: transparent
			border: none

		&::-moz-range-progress
			height: 0.25rem
			border-radius: var(--shape-corner-full)
			background: var(--primary)

		&::-moz-range-thumb
			width: 0.5rem
			height: 0.5rem
			border: none
			border-radius: var(--shape-corner-full)
			background: var(--primary)
			box-shadow: 0 0 0 1px var(--surface-container-lowest)
			transition: transform var(--m3e-duration-short) var(--m3e-easing-standard)

			&:hover
				transform: scale(1.3)

		&:focus-visible
			outline: 2px solid var(--primary)
			outline-offset: 2px

		&:disabled
			cursor: default
			opacity: 0.38

	&__playlist-item time
		font: var(--m3e-type-label-small)
		font-variant-numeric: tabular-nums
		color: var(--on-surface-variant)

	&__progress
		display: flex
		align-items: center
		gap: 0.375rem

	&__progress-control
		position: relative
		flex: 1
		min-width: 0
		height: 1.25rem
		display: flex
		align-items: center
		touch-action: pan-y

		.m3-progress
			position: relative
			z-index: 0
			width: 100%
			max-width: none
			pointer-events: none

		.m3-progress--wavy
			height: 10px
			overflow: visible

			.m3-progress__wavy-track,
			.m3-progress__wavy-active,
			.m3-progress__wavy-wave
				width: 100%

		input
			appearance: none
			-webkit-appearance: none
			position: absolute
			inset: -0.625rem 0
			z-index: 2
			width: 100%
			height: calc(100% + 1.25rem)
			margin: 0
			padding: 0
			border: none
			background: transparent !important
			opacity: 0
			cursor: pointer
			accent-color: transparent

			&::-webkit-slider-runnable-track
				appearance: none
				-webkit-appearance: none
				background: transparent !important
				border: none
				height: 100%

			&::-webkit-slider-thumb
				appearance: none
				-webkit-appearance: none
				opacity: 0
				width: 1.25rem
				height: 1.25rem
				background: transparent !important
				border: none
				box-shadow: none

			&::-moz-range-track
				background: transparent !important
				border: none
				height: 100%

			&::-moz-range-thumb
				opacity: 0
				width: 1.25rem
				height: 1.25rem
				background: transparent !important
				border: none
				box-shadow: none

			&:disabled
				cursor: default

			&:focus-visible
				outline: 2px solid var(--primary)
				outline-offset: 2px
				border-radius: var(--shape-corner-s)

	&__controls
		display: flex
		justify-content: space-between
		align-items: center
		padding: 0 0.25rem

		.m3-icon-button
			color: var(--on-surface-variant)

			&:hover:not(:disabled)
				color: var(--primary)

			&--filled
				color: var(--on-primary)

				&:hover:not(:disabled)
					color: var(--on-primary)

	&__playlist-panel
		overflow: hidden

	/* 歌词面板：控制行下方抽屉（collapse 展开收起），列表居中列 + 当前行高亮 */
	&__lyrics-panel
		overflow: hidden

	&__lyrics-empty
		margin: 0
		padding: 1rem
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		text-align: center

	&__lyrics-list
		display: flex
		flex-direction: column
		align-items: center
		gap: 0.375rem
		max-height: 11rem
		margin-top: 0.25rem
		padding: 5.5rem 0.5rem
		overflow-y: auto
		overscroll-behavior: contain
		scrollbar-width: none
		-webkit-mask-image: linear-gradient(to bottom, transparent 0, black 2.5rem, black calc(100% - 2.5rem), transparent 100%)
		mask-image: linear-gradient(to bottom, transparent 0, black 2.5rem, black calc(100% - 2.5rem), transparent 100%)

		&::-webkit-scrollbar
			display: none

	&__lyric-line
		width: 100%
		padding: 0.25rem 0.5rem
		border: none
		border-radius: var(--shape-corner-s)
		background: transparent
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.55
		text-align: center
		text-wrap: balance
		cursor: pointer
		opacity: 0.72
		transform-origin: 50% 50%
		/* 只动颜色/透明度/transform：字号字重变化会引起整列回流，造成滚动闪跳 */
		transition:
			color var(--m3e-duration-short) var(--m3e-easing-standard),
			opacity var(--m3e-duration-short) var(--m3e-easing-standard),
			transform var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			color: var(--primary)

		&:focus-visible
			outline: 2px solid var(--primary)
			outline-offset: 1px

		&--active
			color: var(--primary)
			font-weight: 700
			opacity: 1
			transform: scale(1.06)

	&__playlist
		list-style: none
		max-height: 12rem
		display: flex
		flex-direction: column
		gap: 0.125rem
		margin: 0
		padding: 0.25rem 0 0
		overflow-y: auto
		overscroll-behavior: contain
		scrollbar-width: none
		-webkit-mask-image: linear-gradient(to bottom, black calc(100% - 1.5rem), transparent 100%)
		mask-image: linear-gradient(to bottom, black calc(100% - 1.5rem), transparent 100%)

		&::-webkit-scrollbar
			display: none

	&__playlist-item
		width: 100%
		min-height: 2.75rem
		display: grid
		grid-template-columns: 1.5rem minmax(0, 1fr) auto
		align-items: center
		gap: 0.5rem
		padding: 0.375rem 0.5rem
		border: none
		border-radius: var(--shape-corner-s)
		background: transparent
		color: var(--on-surface)
		text-align: left
		cursor: pointer
		--m3e-state-color: var(--on-surface)

		&--current
			background: var(--secondary-container)
			color: var(--on-secondary-container)
			--m3e-state-color: var(--on-secondary-container)

	&__playlist-index
		display: grid
		place-items: center
		font: var(--m3e-type-label-medium)
		font-variant-numeric: tabular-nums
		text-align: center

		> svg
			width: 1.125rem
			height: 1.125rem

	&__playlist-copy
		min-width: 0
		display: flex
		flex-direction: column

		strong,
		span
			overflow: hidden
			text-overflow: ellipsis
			white-space: nowrap

		strong
			font: var(--m3e-type-body-medium)

		span
			font: var(--m3e-type-body-small)
			opacity: 0.75

	&__empty,
	&__error
		margin: 0
		padding: 0.75rem
		border-radius: var(--shape-corner-s)
		font: var(--m3e-type-body-medium)

	&__empty
		background: var(--surface-container)
		color: var(--on-surface-variant)
		text-align: center

	&__error
		background: var(--error-container)
		color: var(--on-error-container)

@media (pointer: coarse)
	.music-player
		&__volume-slider-wrap
			height: 2rem

		&__progress-control
			height: 2.5rem

			input
				inset: 0

		&__controls
			max-width: 22rem
			width: 100%
			margin: 0 auto

@keyframes music-cover-playing
	to
		transform: rotate(360deg)

@keyframes music-cover-ripple
	0%
		transform: scale(1)
		opacity: 0.65
	28%
		transform: scale(1.18)
		opacity: 0
	100%
		transform: scale(1.18)
		opacity: 0

@keyframes music-cover-bounce
	0%, 100%
		transform: scale(1)
	14%
		transform: scale(1.035)
	28%
		transform: scale(1)

html.motion-reduced .music-player__cover,
html.motion-reduced .music-player__cover::before,
html.motion-reduced .music-player__cover img
	animation: none

@media (prefers-reduced-motion: reduce)
	.music-player__cover,
	.music-player__cover::before,
	.music-player__cover img
		animation: none

/* ─────────────────────────────────────────────────────────────
   浮动歌词：fixed 底部歌词条（portal 到 body，跨页常驻）
   复刻旧博客 FloatingLyrics：上一行 / 当前行（点击跳播）/ 下一行
   ───────────────────────────────────────────────────────────── */
.music-floating-lyrics
	position: fixed
	left: 0
	right: 0
	bottom: 0
	z-index: 60
	display: flex
	align-items: center
	justify-content: center
	padding: 0.5rem 3rem
	min-height: 3.25rem
	pointer-events: none
	background: transparent
	transform: translateY(110%)
	transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1)

	&--shown
		transform: translateY(0)
		pointer-events: auto

	&__close
		position: absolute
		top: 50%
		left: 0.75rem
		display: inline-flex
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		padding: 0
		border: none
		border-radius: var(--shape-corner-full)
		background: transparent
		color: var(--on-surface-variant)
		cursor: pointer
		opacity: 0.6
		transition: opacity var(--m3e-duration-short) var(--m3e-easing-standard), color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			opacity: 1
			color: var(--primary)

		> svg
			width: 1.125rem
			height: 1.125rem

	&__lines
		display: flex
		min-width: 0
		flex-direction: column
		align-items: center
		gap: 0.125rem

	&__adjacent
		max-width: 70vw
		margin: 0
		overflow: hidden
		color: var(--on-surface-variant)
		font-size: 0.8125rem
		font-weight: 400
		line-height: 1.4
		text-overflow: ellipsis
		white-space: nowrap
		opacity: 0.75
		text-shadow: unquote("0 1px 6px color-mix(in oklab, var(--page-bg) 85%, transparent)")

	&__current
		max-width: 70vw
		margin: 0
		padding: 0
		overflow: hidden
		border: none
		background: transparent
		color: var(--primary)
		font-size: 1.125rem
		font-weight: 700
		line-height: 1.4
		text-overflow: ellipsis
		white-space: nowrap
		text-shadow: unquote("0 1px 8px color-mix(in oklab, var(--page-bg) 90%, transparent)")
		cursor: pointer
		transition: opacity var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover:not(:disabled)
			opacity: 0.8

		&:disabled
			cursor: default

@media (max-width: 767.98px)
	.music-floating-lyrics
		padding-bottom: unquote("max(0.5rem, env(safe-area-inset-bottom, 0))")

	.music-floating-lyrics__adjacent
		display: none

	body.music-has-floating-lyrics
		padding-bottom: 3.25rem

body.music-has-floating-lyrics
	@media (min-width: 768px)
		padding-bottom: 4.5rem

html.motion-reduced .music-floating-lyrics
	transition: none

/* ─────────────────────────────────────────────────────────────
   悬浮音乐唱片：播放时出现（复刻 zzwork/my-blog），可拖动、
   点击/回车切换播放暂停；封面随播放旋转，位置 localStorage 持久化
   ───────────────────────────────────────────────────────────── */
.music-float-disc
	position: relative
	width: 4rem
	height: 4rem
	flex-shrink: 0

	&--paused
		.music-float-disc__spin
			animation-play-state: paused

	&--dragging
		.music-float-disc__hit
			cursor: grabbing

		.music-float-disc__spin
			animation-play-state: paused

	&__hit
		pointer-events: auto
		position: relative
		display: block
		width: 100%
		height: 100%
		padding: 0
		border: none
		border-radius: var(--shape-corner-full)
		background: transparent
		cursor: grab
		touch-action: none
		-webkit-user-select: none
		user-select: none
		outline: none

		&:focus-visible
			box-shadow: 0 0 0 2px var(--page-bg), 0 0 0 4px var(--primary)

	&__spin
		position: absolute
		inset: 0
		display: grid
		place-items: center
		overflow: hidden
		border-radius: var(--shape-corner-full)
		background: var(--secondary-container)
		color: var(--on-secondary-container)
		box-shadow:
			0 0 0 1.5px var(--surface-container-lowest),
			unquote("0 0 0 2.5px color-mix(in oklab, var(--primary) 35%, var(--outline-variant) 65%)"),
			0 0.35rem 1rem unquote("color-mix(in oklab, var(--on-surface) 18%, transparent)")
		animation: music-cover-playing 8s linear infinite

		img
			width: 100%
			height: 100%
			object-fit: cover
			border-radius: var(--shape-corner-full)

		> svg
			width: 1.75rem
			height: 1.75rem

	&__toggle
		position: absolute
		top: 50%
		left: 50%
		display: grid
		place-items: center
		width: 1.5rem
		height: 1.5rem
		border-radius: var(--shape-corner-full)
		background: unquote("color-mix(in oklab, var(--surface-container-lowest) 82%, transparent)")
		color: var(--on-surface)
		box-shadow: 0 0.125rem 0.375rem unquote("color-mix(in oklab, var(--on-surface) 20%, transparent)")
		transform: translate(-50%, -50%)

		> svg
			width: 0.875rem
			height: 0.875rem

html.motion-reduced .music-float-disc__spin
	animation: none

/* ─────────────────────────────────────────────────────────────
   悬浮音乐 dock（复刻 zzwork/my-blog 三态一体布局）：
   收起 = 左下角唱片；展开 = 唱片骑在信息层（标题/进度）与
   工具栏胶囊的接缝上，上方再展一层歌单/歌词面板。
   容器以唱片左上角为原点（transform 定位），面板与舞台
   绝对定位向上生长，展开/收起全程不改变唱片位置。
   ───────────────────────────────────────────────────────────── */
.music-float-player
	--fp-disc: 4rem
	--fp-bar-h: 3.5rem
	--fp-slot-pad: 5rem
	--fp-width: 21.25rem
	--fp-surface: unquote("color-mix(in oklab, var(--card-bg) 94%, transparent)")
	--fp-shadow: 0 0.5rem 1.5rem unquote("color-mix(in oklab, var(--on-surface) 14%, transparent)")
	position: fixed
	left: 0
	top: 0
	z-index: 61
	width: var(--fp-disc)
	height: var(--fp-bar-h)
	pointer-events: none
	will-change: transform
	transition: width 420ms var(--m3e-easing-standard)

	&--bar
	&--pill
		width: var(--fp-width)

	&--dragging
		.music-float-disc__hit
			cursor: grabbing

		.music-float-disc__spin
			animation-play-state: paused

	/* ── 上展面板：舞台文档流内（不与信息层重叠），由歌单按钮开合 ── */
	&__panel
		display: grid
		grid-template-rows: 0fr
		width: 100%
		margin-bottom: 0.5rem
		pointer-events: none
		transition: grid-template-rows 420ms var(--m3e-easing-standard)

	&--bar&--panel-open &__panel
		grid-template-rows: 1fr
		pointer-events: auto

	&__panel-clip
		overflow: hidden
		min-height: 0

	&__panel-body
		display: flex
		flex-direction: column
		height: min(16rem, 40vh)
		overflow: hidden
		border: 1px solid var(--outline-variant)
		border-radius: var(--shape-corner-l)
		background: var(--fp-surface)
		-webkit-backdrop-filter: blur(12px)
		backdrop-filter: blur(12px)
		box-shadow: var(--fp-shadow)
		opacity: 0
		transform: translate3d(0, 0.5rem, 0)
		transition: opacity 200ms ease, transform 280ms var(--m3e-easing-standard)

	&--bar&--panel-open &__panel-body
		opacity: 1
		transform: none
		transition-delay: 120ms

	&__tabs
		display: flex
		gap: 0.25rem
		padding: 0.5rem 0.75rem 0
		border-bottom: 1px solid var(--outline-variant)
		flex-shrink: 0

	&__tab
		padding: 0.375rem 0.75rem 0.5rem
		border: none
		border-bottom: 2px solid transparent
		background: transparent
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-medium)
		font-weight: 600
		cursor: pointer
		transition:
			color var(--m3e-duration-short) var(--m3e-easing-standard),
			border-color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			color: var(--on-surface)

		&--active
			color: var(--primary)
			border-bottom-color: var(--primary)

	&__views
		flex: 1
		min-height: 0
		overflow-y: auto
		overscroll-behavior: contain
		padding: 0.5rem

	/* 面板播放列表：封面缩略图 + 当前项高亮（参考博客样式） */
	&__views .music-player__playlist-item
		gap: 0.5rem

	&__item-cover
		display: grid
		place-items: center
		flex-shrink: 0
		width: 2.5rem
		height: 2.5rem
		overflow: hidden
		border-radius: var(--shape-corner-s)
		background: var(--secondary-container)
		color: var(--on-secondary-container)

		img
			width: 100%
			height: 100%
			object-fit: cover

		svg
			width: 1rem
			height: 1rem

	&__empty
		margin: 0
		padding: 1rem
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		text-align: center

	/* ── 舞台：面板 + 信息层 + 工具栏 + 唱片，文档流自底向上生长 ── */
	&__stage
		position: absolute
		left: 0
		bottom: 0
		width: 100%
		display: flex
		flex-direction: column

	/* 信息层：bar 态显示标题 / 艺术家 / 进度 */
	&__info
		display: grid
		grid-template-rows: 0fr
		transition: grid-template-rows 420ms var(--m3e-easing-standard)

	&--bar &__info
		grid-template-rows: 1fr

	&__info-clip
		overflow: hidden
		min-height: 0

	&__info-surface
		margin-inline: 1.25rem
		/* 底部 padding 需大于工具栏上叠高度，否则进度条会被遮住 */
		padding: 0.875rem 1.25rem 1.625rem unquote("calc(var(--fp-slot-pad) - 1.25rem)")
		border-radius: var(--shape-corner-l)
		background: var(--fp-surface)
		-webkit-backdrop-filter: blur(12px)
		backdrop-filter: blur(12px)
		box-shadow: var(--fp-shadow)
		display: flex
		flex-direction: column
		gap: 0.125rem
		opacity: 0
		transform: translate3d(0, 0.5rem, 0)
		transition: opacity 200ms ease, transform 280ms var(--m3e-easing-standard)

	&--bar &__info-surface
		opacity: 1
		transform: none
		transition-delay: 80ms

	&__title
		margin: 0
		color: var(--on-surface)
		font: var(--m3e-type-title-small)
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap

	&__artist
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap

	/* 工具栏：胶囊 dock，bar 态上叠在信息层下缘；pill 态变为歌词胶囊 */
	&__bar
		position: relative
		z-index: 1
		height: var(--fp-bar-h)
		margin-top: 0
		border-radius: var(--shape-corner-full)
		background: var(--fp-surface)
		-webkit-backdrop-filter: blur(12px)
		backdrop-filter: blur(12px)
		box-shadow: var(--fp-shadow)
		opacity: 0
		transform: scale(0.72)
		pointer-events: none
		transition:
			height 420ms var(--m3e-easing-standard),
			margin-top 420ms var(--m3e-easing-standard),
			opacity 200ms ease,
			transform 200ms ease

	&--pill &__bar
	&--bar &__bar
		opacity: 1
		transform: none

	&--bar &__bar
		margin-top: -1.375rem
		pointer-events: auto

	&--pill &__bar
		height: 4.5rem

	/* 胶囊歌词槽：pill 态显示当前歌词行 */
	&__pill-text
		position: absolute
		top: 0
		bottom: 0
		left: unquote("calc(var(--fp-disc) + 0.875rem)")
		right: 1.25rem
		display: flex
		align-items: center
		overflow: hidden
		opacity: 0
		transform: translate3d(-0.5rem, 0, 0)
		pointer-events: none
		transition: opacity 200ms ease, transform 260ms var(--m3e-easing-standard)

	&--pill &__pill-text
		opacity: 1
		transform: none

	&__pill-label
		display: inline-block
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis
		color: var(--on-surface)
		font: var(--m3e-type-body-medium)
		font-weight: 600

	&__toolbar
		position: absolute
		top: 0
		bottom: 0
		left: var(--fp-slot-pad)
		right: 0.625rem
		display: flex
		align-items: center
		justify-content: center
		gap: 0.125rem
		opacity: 0
		transform: translate3d(0, 0.375rem, 0)
		pointer-events: none
		transition: opacity 200ms ease, transform 260ms var(--m3e-easing-standard)

	&--bar &__toolbar
		opacity: 1
		transform: none
		pointer-events: auto
		transition-delay: 100ms

	/* 音量：悬停弹出垂直滑条，点击按钮切换静音（复刻参考博客） */
	&__volume
		position: relative
		display: flex

		/* 按钮与弹出层间隙的悬停桥接，防止移入途中弹层消失 */
		&::before
			content: ""
			position: absolute
			left: 0
			right: 0
			bottom: 100%
			height: 0.5rem

	&__volume-pop
		position: absolute
		bottom: unquote("calc(100% + 0.375rem)")
		right: -0.25rem
		display: flex
		flex-direction: column
		align-items: center
		gap: 0.5rem
		width: 2.75rem
		padding: 0.75rem 0.5rem 0.875rem
		border: 1px solid var(--outline-variant)
		border-radius: var(--shape-corner-full)
		background: var(--fp-surface)
		-webkit-backdrop-filter: blur(12px)
		backdrop-filter: blur(12px)
		box-shadow: var(--fp-shadow)
		opacity: 0
		transform: translate3d(0, 0.25rem, 0) scale(0.94)
		transform-origin: 100% 100%
		pointer-events: none
		transition: opacity 180ms ease, transform 240ms var(--m3e-easing-standard)

	&__volume:hover &__volume-pop
	&__volume:focus-within &__volume-pop
		opacity: 1
		transform: none
		pointer-events: auto

	&__volume-value
		color: var(--on-surface)
		font: var(--m3e-type-label-small)
		font-variant-numeric: tabular-nums
		line-height: 1

	&__volume-track
		position: relative
		width: 0.25rem
		height: 6.5rem
		border-radius: var(--shape-corner-full)
		background: unquote("color-mix(in oklab, var(--on-surface) 14%, transparent)")
		cursor: pointer
		touch-action: none

	&__volume-bar
		position: absolute
		left: 0
		right: 0
		bottom: 0
		border-radius: inherit
		background: var(--primary)

	&__volume-thumb
		position: absolute
		left: 50%
		width: 0.625rem
		height: 0.625rem
		transform: translate(-50%, 50%)
		border-radius: var(--shape-corner-full)
		background: var(--primary)

	/* 唱片：disc 态贴容器左下；pill 态居中胶囊内；bar 态骑在信息层与工具栏接缝 */
	&__disc
		position: absolute
		left: 0
		bottom: -0.25rem
		z-index: 2
		width: var(--fp-disc)
		height: var(--fp-disc)
		transition:
			left 420ms var(--m3e-easing-standard),
			bottom 420ms var(--m3e-easing-standard)

	&--bar &__disc
		left: 0.75rem
		bottom: unquote("calc(var(--fp-bar-h) - var(--fp-disc) / 2)")

	&--pill &__disc
		left: 0.375rem
		bottom: 0.25rem

	/* 唱片内封面禁止原生拖拽，保证指针拖动不被 pointercancel 打断 */
	&__disc img
		-webkit-user-drag: none
		user-select: none
`;
