<script lang="ts">
import IconButton from "@components/atoms/action/IconButton.svelte";
import ProgressIndicator from "@components/atoms/feedback/ProgressIndicator.svelte";
import Tooltip from "@components/atoms/overlay/Tooltip.svelte";
import Icon from "@iconify/svelte";
import { collapse } from "@utils/motion";
import {
	currentLrcIndexAt,
	type LrcLine,
	loadLrcLines,
} from "@utils/music/lyrics";
import { onMount } from "svelte";
import type { ResolvedMusicOptions } from "@/config/musicConfig";
import type {
	MusicErrorCode,
	MusicRuntime,
	MusicSnapshot,
	PlaybackMode,
} from "@/types/musicConfig";

interface Labels {
	previous: string;
	play: string;
	pause: string;
	next: string;
	mute: string;
	unmute: string;
	playbackMode: string;
	modeSequence: string;
	modeRepeatOne: string;
	modeShuffle: string;
	progress: string;
	volume: string;
	showPlaylist: string;
	hidePlaylist: string;
	empty: string;
	loading: string;
	nowPlaying: string;
	lyrics: string;
	floatingLyrics: string;
	noLyrics: string;
	loadingLyrics: string;
	failedLyrics: string;
	close: string;
	errors: Record<MusicErrorCode, string>;
}

interface Props {
	options: ResolvedMusicOptions;
	labels: Labels;
}

let { options, labels }: Props = $props();
let runtime = $state<MusicRuntime | null>(null);
let snapshot = $state<MusicSnapshot>({
	playlist: options.playlist,
	currentIndex: options.playlist.length > 0 ? 0 : -1,
	currentTrack: options.playlist[0] ?? null,
	status: options.provider === "meting" ? "loading" : "idle",
	currentTime: 0,
	duration: options.playlist[0]?.duration ?? 0,
	volume: options.defaultVolume,
	muted: false,
	mode: options.defaultMode,
	error:
		options.playlist.length > 0 || options.provider === "meting"
			? null
			: "empty-playlist",
});
let playlistOpen = $state(false);
const playlistId = "sidebar-music-playlist";

// ── 歌词（面板 + 浮动歌词）：纯 UI 层状态，播放引擎保持解耦 ──
type LyricsStatus = "idle" | "loading" | "loaded" | "none" | "failed";
const FLOATING_LYRICS_KEY = "shirone:music:floating-lyrics";
/** 用户手动滚动歌词后，暂停自动跟随的时长（毫秒） */
const LYRICS_USER_SCROLL_HOLD_MS = 3000;

let lyricsOpen = $state(false);
let lyricsListEl: HTMLElement | null = $state(null);
let lyrics = $state<{ status: LyricsStatus; lines: LrcLine[] }>({
	status: "idle",
	lines: [],
});
const initialFloatingOn = (() => {
	try {
		return localStorage.getItem(FLOATING_LYRICS_KEY) !== "false";
	} catch {
		return false;
	}
})();
let floatingOn = $state(initialFloatingOn);
let lyricsGeneration = 0;
let lyricsScrolling = false;
let lyricsScrollTimer: ReturnType<typeof setTimeout> | null = null;

const modeLabels: Record<PlaybackMode, string> = {
	sequence: labels.modeSequence,
	"repeat-one": labels.modeRepeatOne,
	shuffle: labels.modeShuffle,
};
const modeIcons: Record<PlaybackMode, string> = {
	sequence: "material-symbols:repeat-rounded",
	"repeat-one": "material-symbols:repeat-one-rounded",
	shuffle: "material-symbols:shuffle-rounded",
};

const playing = $derived(snapshot.status === "playing");
const loading = $derived(snapshot.status === "loading");
const hasTracks = $derived(snapshot.playlist.length > 0);
const currentTitle = $derived(
	snapshot.currentTrack?.title ?? (loading ? labels.loading : labels.empty),
);
const currentArtist = $derived(
	snapshot.currentTrack?.artist ?? (loading ? "..." : "—"),
);

const modeLabel = $derived(modeLabels[snapshot.mode]);
const modeIcon = $derived(modeIcons[snapshot.mode]);
const duration = $derived(Math.max(0, snapshot.duration));
let draggingSeek = $state(false);
let dragTime = $state<number | null>(null);

const currentEffectiveTime = $derived(
	draggingSeek && dragTime !== null ? dragTime : snapshot.currentTime,
);
const progressMax = $derived(duration > 0 ? duration : 1);
const progressRatio = $derived(
	duration > 0 ? Math.min(Math.max(currentEffectiveTime / duration, 0), 1) : 0,
);
const displayTime = $derived(formatTime(currentEffectiveTime));
const displayDuration = $derived(formatTime(duration));
const progressLabel = $derived(
	labels.progress
		.replace("{current}", displayTime)
		.replace("{duration}", displayDuration),
);
const volumeLabel = $derived(
	labels.volume.replace("{volume}", String(Math.round(snapshot.volume * 100))),
);
const liveMessage = $derived.by(() => {
	if (snapshot.error && snapshot.status === "error")
		return labels.errors[snapshot.error];
	if (snapshot.status === "loading") return labels.loading;
	if (snapshot.currentTrack && snapshot.status === "playing") {
		return labels.nowPlaying.replace("{title}", snapshot.currentTrack.title);
	}
	return "";
});

// ── 歌词派生状态 ──
const lyricsFeatureOn = $derived(options.showLyrics !== false && hasTracks);
const currentLrcIndex = $derived.by(() =>
	currentLrcIndexAt(lyrics.lines, snapshot.currentTime),
);
const floatingShown = $derived(floatingOn && lyrics.lines.length > 0);

onMount(() => {
	let unsubscribe = () => {};
	let active = true;
	void import("@utils/music").then(({ getMusicRuntime }) => {
		if (!active) return;
		runtime = getMusicRuntime(options);
		unsubscribe = runtime.subscribe((next) => {
			snapshot = next;
		});
	});
	return () => {
		active = false;
		unsubscribe();
	};
});

// 切歌（或曲目 lrc 变化）时重新加载歌词；代数守卫防竞态
$effect(() => {
	const track = snapshot.currentTrack;
	if (!track) {
		lyrics = { status: "idle", lines: [] };
		return;
	}
	const generation = ++lyricsGeneration;
	lyrics = { status: "loading", lines: [] };
	loadLrcLines(track)
		.then((lines) => {
			if (lyricsGeneration !== generation) return;
			lyrics = { status: lines.length > 0 ? "loaded" : "none", lines };
		})
		.catch(() => {
			if (lyricsGeneration !== generation) return;
			lyrics = { status: "failed", lines: [] };
		});
});

// 浮动歌词展示时为 body 预留底部空间，避免遮挡页脚
$effect(() => {
	if (typeof document === "undefined") return;
	document.body.classList.toggle("music-has-floating-lyrics", floatingShown);
	return () => document.body.classList.remove("music-has-floating-lyrics");
});

// 当前行变化且面板展开时自动居中滚动（用户手动滚动期间暂停）
$effect(() => {
	const index = currentLrcIndex;
	if (!lyricsOpen || index < 0 || lyricsScrolling || !lyricsListEl) return;
	const line = lyricsListEl.querySelector<HTMLElement>(
		`[data-lyric-index="${index}"]`,
	);
	if (!line) return;
	const target =
		line.offsetTop - lyricsListEl.clientHeight / 2 + line.offsetHeight / 2;
	lyricsListEl.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
});

function formatTime(value: number): string {
	if (!Number.isFinite(value) || value < 0) return "0:00";
	const seconds = Math.floor(value);
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function cycleMode(): void {
	const modes: PlaybackMode[] = ["sequence", "repeat-one", "shuffle"];
	const index = modes.indexOf(snapshot.mode);
	runtime?.setMode(modes[(index + 1) % modes.length]);
}

function togglePlaylist(): void {
	playlistOpen = !playlistOpen;
	if (playlistOpen) void runtime?.initialize();
}

function toggleLyrics(): void {
	lyricsOpen = !lyricsOpen;
}

function toggleFloatingLyrics(): void {
	floatingOn = !floatingOn;
	try {
		localStorage.setItem(FLOATING_LYRICS_KEY, floatingOn ? "true" : "false");
	} catch {
		// localStorage 不可用（隐私模式）时仅本次会话生效
	}
}

function seekToLine(index: number): void {
	const line = lyrics.lines[index];
	if (line) runtime?.seek(Math.max(0, line.time));
}

function onLyricsUserScroll(): void {
	lyricsScrolling = true;
	if (lyricsScrollTimer) clearTimeout(lyricsScrollTimer);
	lyricsScrollTimer = setTimeout(() => {
		lyricsScrolling = false;
	}, LYRICS_USER_SCROLL_HOLD_MS);
}

/** 浮动歌词传送门：挂到 body 下，规避侧栏容器可能的 transform/blur 包含块 */
function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		},
	};
}

function onProgressPointerDown(): void {
	draggingSeek = true;
}

function onProgressInput(event: Event): void {
	const val = Number((event.currentTarget as HTMLInputElement).value);
	dragTime = Number.isFinite(val) ? Math.max(0, val) : null;
}

function onProgressChange(event: Event): void {
	const val = Number((event.currentTarget as HTMLInputElement).value);
	draggingSeek = false;
	dragTime = null;
	if (Number.isFinite(val)) {
		runtime?.seek(Math.max(0, val));
	}
}

function onProgressPointerUp(event: PointerEvent): void {
	draggingSeek = false;
	const input = event.currentTarget as HTMLInputElement;
	const val = Number(input.value);
	dragTime = null;
	if (Number.isFinite(val)) {
		runtime?.seek(Math.max(0, val));
	}
}

function setVolume(event: Event): void {
	runtime?.setVolume(Number((event.currentTarget as HTMLInputElement).value));
}
</script>

	<div class="music-player" data-music-player>
		<div class="music-player__track">
			<div class={`music-player__cover${playing ? " music-player__cover--playing" : ""}`}>
				{#if snapshot.currentTrack?.cover}
					<img
						src={snapshot.currentTrack.cover}
						srcset={snapshot.currentTrack.coverSrcset}
						sizes={snapshot.currentTrack.coverSizes}
						width={snapshot.currentTrack.coverWidth}
						height={snapshot.currentTrack.coverHeight}
						alt=""
						loading="lazy"
						decoding="async"
					/>
				{:else}
					<Icon icon="material-symbols:music-note-rounded" aria-hidden="true" />
				{/if}
			</div>
			<div class="music-player__metadata">
				<strong title={currentTitle}>{currentTitle}</strong>
				<span title={currentArtist}>{currentArtist}</span>
				<div class="music-player__submeta">
					<div class="music-player__volume-inline">
						<Tooltip label={snapshot.muted ? labels.unmute : labels.mute} placement="top">
							<IconButton
								icon="material-symbols:volume-up-rounded"
								checkedIcon="material-symbols:volume-off-rounded"
								label={snapshot.muted ? labels.unmute : labels.mute}
								size="xsmall"
								toggle
								checked={snapshot.muted}
								onclick={() => runtime?.setMuted(!snapshot.muted)}
							/>
						</Tooltip>
						<div class="music-player__volume-slider-wrap">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={snapshot.volume}
								aria-label={volumeLabel}
								oninput={setVolume}
								class="music-player__volume-slider"
								style={`--vol-pct: ${Math.round(snapshot.volume * 100)}%`}
							/>
						</div>
					</div>
					{#if lyricsFeatureOn}
						<div class="music-player__lyrics-actions">
							<Tooltip label={labels.lyrics} placement="top">
								<IconButton
									icon="material-symbols:subtitles-off-outline-rounded"
									checkedIcon="material-symbols:subtitles-outline-rounded"
									label={labels.lyrics}
									size="xsmall"
									toggle
									checked={lyricsOpen}
									ariaExpanded={lyricsOpen}
									ariaControls="sidebar-music-lyrics"
									onclick={toggleLyrics}
								/>
							</Tooltip>
							<Tooltip label={labels.floatingLyrics} placement="top">
								<IconButton
									icon="material-symbols:lyrics-outline-rounded"
									label={labels.floatingLyrics}
									size="xsmall"
									toggle
									checked={floatingOn}
									onclick={toggleFloatingLyrics}
								/>
							</Tooltip>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="music-player__progress">
			<span class="music-player__time-cap">{displayTime}</span>
			<div class="music-player__progress-control">
				<ProgressIndicator
					variant="linear"
					wavy
					progress={progressRatio}
					amplitude={playing ? 1 : 0}
					label={progressLabel}
					ariaHidden
					showStop={false}
					showThumb
					class="music-player__progress-visual"
				/>
				<input
					type="range"
					min="0"
					max={progressMax}
					step="0.1"
					value={Math.min(currentEffectiveTime, progressMax)}
					disabled={duration <= 0 || !hasTracks}
					aria-label={progressLabel}
					onpointerdown={onProgressPointerDown}
					onpointerup={onProgressPointerUp}
					oninput={onProgressInput}
					onchange={onProgressChange}
				/>
			</div>
			<span class="music-player__time-cap">{displayDuration}</span>
		</div>

		<div class="music-player__controls">
			<Tooltip label={modeLabel} placement="top">
				<IconButton
					icon={modeIcon}
					label={`${labels.playbackMode}: ${modeLabel}`}
					size="xsmall"
					disabled={!hasTracks}
					onclick={cycleMode}
				/>
			</Tooltip>
			<Tooltip label={labels.previous} placement="top">
				<IconButton
					icon="material-symbols:skip-previous-rounded"
					label={labels.previous}
					size="small"
					disabled={!hasTracks}
					onclick={() => void runtime?.previous()}
				/>
			</Tooltip>
			<Tooltip label={playing ? labels.pause : labels.play} placement="top">
				<IconButton
					icon="material-symbols:play-arrow-rounded"
					checkedIcon="material-symbols:pause-rounded"
					label={playing ? labels.pause : labels.play}
					variant="filled"
					size="medium"
					toggle
					checked={playing}
					disabled={!hasTracks && options.provider !== "meting"}
					onclick={() => void runtime?.toggle()}
				/>
			</Tooltip>
			<Tooltip label={labels.next} placement="top">
				<IconButton
					icon="material-symbols:skip-next-rounded"
					label={labels.next}
					size="small"
					disabled={!hasTracks}
					onclick={() => void runtime?.next()}
				/>
			</Tooltip>
			<Tooltip label={playlistOpen ? labels.hidePlaylist : labels.showPlaylist} placement="top">
				<IconButton
					icon="material-symbols:queue-music-rounded"
					label={playlistOpen ? labels.hidePlaylist : labels.showPlaylist}
					size="xsmall"
					class="music-player__playlist-toggle"
					ariaExpanded={playlistOpen}
					ariaControls={playlistId}
					disabled={!hasTracks && options.provider !== "meting"}
					onclick={togglePlaylist}
				/>
			</Tooltip>
		</div>

		{#if lyricsFeatureOn}
			<div
				id="sidebar-music-lyrics"
				class="music-player__lyrics-panel"
				inert={!lyricsOpen}
				aria-hidden={!lyricsOpen}
				use:collapse={{ open: lyricsOpen }}
			>
				{#if lyrics.status === "loading"}
					<p class="music-player__lyrics-empty">{labels.loadingLyrics}</p>
				{:else if lyrics.status === "none"}
					<p class="music-player__lyrics-empty">{labels.noLyrics}</p>
				{:else if lyrics.status === "failed"}
					<p class="music-player__lyrics-empty">{labels.failedLyrics}</p>
				{:else if lyrics.lines.length > 0}
					<div
						class="music-player__lyrics-list"
						bind:this={lyricsListEl}
						role="listbox"
						aria-label={labels.lyrics}
						onwheel={onLyricsUserScroll}
						ontouchstart={onLyricsUserScroll}
						onpointerdown={onLyricsUserScroll}
					>
						{#each lyrics.lines as line, index (index)}
							<button
								type="button"
								class={`music-player__lyric-line${index === currentLrcIndex ? " music-player__lyric-line--active" : ""}`}
								data-lyric-index={index}
								role="option"
								aria-selected={index === currentLrcIndex}
								onclick={() => seekToLine(index)}
							>
								{line.text || "♪"}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div
			id={playlistId}
			class="music-player__playlist-panel"
			inert={!playlistOpen}
			aria-hidden={!playlistOpen}
			use:collapse={{ open: playlistOpen }}
		>
		{#if hasTracks}
			<ol class="music-player__playlist">
				{#each snapshot.playlist as track, index (track.id)}
					<li>
						<button
							type="button"
							class={`music-player__playlist-item m3-state-layer${index === snapshot.currentIndex ? " music-player__playlist-item--current" : ""}`}
							aria-current={index === snapshot.currentIndex ? "true" : undefined}
							onclick={() => void runtime?.select(index)}
						>
							<span class="music-player__playlist-index" aria-hidden="true">
								{#if index === snapshot.currentIndex && playing}
									<Icon icon="material-symbols:play-arrow-rounded" />
								{:else}
									{index + 1}
								{/if}
							</span>
							<span class="music-player__playlist-copy">
								<strong>{track.title}</strong>
								{#if track.artist}<span>{track.artist}</span>{/if}
							</span>
							{#if track.duration}
								<time>{formatTime(track.duration)}</time>
							{/if}
						</button>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="music-player__empty">{labels.empty}</p>
		{/if}
	</div>

	{#if snapshot.error && snapshot.status === "error"}
		<p class="music-player__error">{labels.errors[snapshot.error]}</p>
	{/if}
	<p class="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</p>
</div>

{#if lyricsFeatureOn}
	<div
		use:portal
		class="music-floating-lyrics"
		class:music-floating-lyrics--shown={floatingShown}
		aria-hidden={!floatingShown}
		role="region"
		aria-label={labels.floatingLyrics}
	>
		<button
			type="button"
			class="music-floating-lyrics__close"
			aria-label={labels.close}
			title={labels.close}
			onclick={toggleFloatingLyrics}
		>
			<Icon icon="material-symbols:close-rounded" />
		</button>
		<div class="music-floating-lyrics__lines">
			<p class="music-floating-lyrics__adjacent" aria-hidden="true">
				{#if currentLrcIndex > 0}{lyrics.lines[currentLrcIndex - 1]?.text}{/if}
			</p>
			<button
				type="button"
				class="music-floating-lyrics__current"
				disabled={currentLrcIndex < 0}
				onclick={() => seekToLine(currentLrcIndex)}
			>
				{#if currentLrcIndex >= 0}{lyrics.lines[currentLrcIndex]?.text}{/if}
			</button>
			<p class="music-floating-lyrics__adjacent" aria-hidden="true">
				{#if currentLrcIndex >= 0 && currentLrcIndex < lyrics.lines.length - 1}{lyrics.lines[currentLrcIndex + 1]?.text}{/if}
			</p>
		</div>
	</div>
{/if}
