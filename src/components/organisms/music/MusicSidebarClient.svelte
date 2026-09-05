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
	tabPlaylist: string;
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

// ── 歌词（侧栏抽屉 + 悬浮歌词条）：纯 UI 层状态，播放引擎保持解耦 ──
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
		// 默认开：播放音乐时默认显示浮动歌词
		return true;
	}
})();
let floatingOn = $state(initialFloatingOn);
let lyricsGeneration = 0;
let lyricsScrolling = false;
let lyricsScrollTimer: ReturnType<typeof setTimeout> | null = null;

// ── 悬浮唱片 dock 三态机（复刻参考博客）：
//     disc 收起唱片 / pill 歌词胶囊（播放中静置） / bar 完整控件 ──
type DockShape = "disc" | "pill" | "bar";
const DOCK_LYRICS_KEY = "shirone:music:dock-lyrics";
/** bar 态鼠标离开后自动收回的延迟（毫秒） */
const DOCK_COLLAPSE_DELAY = 160;

let dockShape = $state<DockShape>("disc");
let dockHover = false;
let dockLyricsOn = $state(
	(() => {
		// 默认关：播放时默认显示的是悬浮歌词（与 floatingOn 互斥）
		try {
			return localStorage.getItem(DOCK_LYRICS_KEY) === "true";
		} catch {
			return false;
		}
	})(),
);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
let floatPanelOpen = $state(false);
let panelTab = $state<"list" | "lyrics">("list");

/** 播放中静置形态：歌词开关打开为胶囊，关闭为唱片 */
function dockRestingShape(): DockShape {
	return dockLyricsOn ? "pill" : "disc";
}

/** 工具栏歌词按钮：控制控件胶囊歌词；与悬浮歌词互斥（开此关彼） */
function toggleDockLyrics(): void {
	dockLyricsOn = !dockLyricsOn;
	try {
		localStorage.setItem(DOCK_LYRICS_KEY, dockLyricsOn ? "true" : "false");
	} catch {
		// localStorage 不可用（隐私模式）时仅本次会话生效
	}
	setFloatingOn(!dockLyricsOn);
	if (playing && dockShape !== "bar") {
		dockShape = dockHover ? "bar" : dockRestingShape();
	}
}

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
// 垂直音量条填充百分比（静音时归零）
const volumePct = $derived(
	snapshot.muted ? 0 : Math.round(snapshot.volume * 100),
);
// 胶囊文本：播放中优先显示当前歌词行，无活动行时显示曲名 - 歌手
const dockPillText = $derived.by(() => {
	if (!dockLyricsOn) return currentTitle;
	const line = lyrics.lines[currentLrcIndex];
	if (line?.text) return line.text;
	return currentArtist ? `${currentTitle} - ${currentArtist}` : currentTitle;
});
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
// 悬浮歌词条显示（原有逻辑：开关开启且有歌词）
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

// 切歌（或曲目 lrc 变化）时重新加载歌词。
// 注意：snapshot 每次播放进度更新都会被整体重新赋值，effect 会随之
// 高频重跑——必须用「曲目指纹」短路，否则歌词会反复回到加载态闪烁。
let loadedLyricsKey: string | null = null;
$effect(() => {
	const track = snapshot.currentTrack;
	const key = track ? `${track.id}\u0000${track.lrc ?? ""}` : null;
	if (key === loadedLyricsKey) return;
	loadedLyricsKey = key;
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

// 悬浮歌词条展示时为 body 预留底部空间，避免遮挡页脚
$effect(() => {
	if (typeof document === "undefined") return;
	document.body.classList.toggle("music-has-floating-lyrics", floatingShown);
	return () => document.body.classList.remove("music-has-floating-lyrics");
});

// 把当前高亮行滚动到列表垂直居中。
// 必须用 getBoundingClientRect 做相对计算：offsetTop 相对的是最近定位
// 祖先而非滚动容器本身（列表未定位），直接用会得到错误目标值。
function scrollLyricsToActive(force = false): void {
	const list = lyricsListEl;
	if (!list) return;
	const index = currentLrcIndex;
	if (index < 0 || lyricsScrolling) return;
	const line = list.querySelector<HTMLElement>(`[data-lyric-index="${index}"]`);
	if (!line) return;
	const listRect = list.getBoundingClientRect();
	const lineRect = line.getBoundingClientRect();
	const relativeTop = lineRect.top - listRect.top + list.scrollTop;
	const target = Math.max(
		0,
		relativeTop - list.clientHeight / 2 + lineRect.height / 2,
	);
	// 目标与当前位置几乎一致时跳过：重复平滑滚动会互相打断造成抖动
	if (!force && Math.abs(list.scrollTop - target) < 8) return;
	list.scrollTo({ top: target, behavior: "smooth" });
}

// 当前行变化时自动跟随（用户手动滚动期间暂停）
$effect(() => {
	if (!lyricsOpen) return;
	void currentLrcIndex;
	scrollLyricsToActive();
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
	if (lyricsOpen) {
		// 展开动画期间容器高度在变，平滑滚动会被打断：
		// 动画结束后强制校准一次居中位置
		setTimeout(() => scrollLyricsToActive(true), 400);
	}
}

/** 悬浮歌词开关（带持久化），供侧栏按钮与控件歌词互斥联动复用 */
function setFloatingOn(on: boolean): void {
	floatingOn = on;
	try {
		localStorage.setItem(FLOATING_LYRICS_KEY, on ? "true" : "false");
	} catch {
		// localStorage 不可用（隐私模式）时仅本次会话生效
	}
}

/** 侧栏悬浮歌词按钮：与控件胶囊歌词互斥（开此关彼） */
function toggleFloatingLyrics(): void {
	setFloatingOn(!floatingOn);
	dockLyricsOn = !floatingOn;
	try {
		localStorage.setItem(DOCK_LYRICS_KEY, dockLyricsOn ? "true" : "false");
	} catch {
		// localStorage 不可用（隐私模式）时仅本次会话生效
	}
	if (playing && dockShape !== "bar") {
		dockShape = dockHover ? "bar" : dockRestingShape();
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

/** 传送门：挂到 body 下，规避侧栏容器可能的 transform/blur 包含块 */
function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		},
	};
}

// ── 悬浮唱片：常驻左下角；拖动移动位置，点击展开/收起完整面板 ──
const DISC_POS_KEY = "shirone:music:disc-pos";
const DISC_MARGIN = 8;
let discSize = 64;

let discPos = $state<{ x: number; y: number } | null>(null);
let discEl: HTMLElement | null = null;
let discDragging = $state(false);
let discPointerId: number | null = null;
let discDragStart = { px: 0, py: 0, x: 0, y: 0 };
let discMoved = false;
let suppressDiscClick = false;

function clampDiscPos(x: number, y: number): { x: number; y: number } {
	const maxX = Math.max(
		DISC_MARGIN,
		window.innerWidth - discSize - DISC_MARGIN,
	);
	const maxY = Math.max(
		DISC_MARGIN,
		window.innerHeight - discSize - DISC_MARGIN,
	);
	return {
		x: Math.min(Math.max(DISC_MARGIN, x), maxX),
		y: Math.min(Math.max(DISC_MARGIN, y), maxY),
	};
}

function loadDiscPos(): { x: number; y: number } | null {
	try {
		const parsed = JSON.parse(localStorage.getItem(DISC_POS_KEY) ?? "null");
		if (parsed && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
			return { x: parsed.x, y: parsed.y };
		}
	} catch {
		// 忽略损坏的存储数据
	}
	return null;
}

// 挂载时初始化唱片位置（localStorage 优先，否则默认左下角）
$effect(() => {
	discSize = 64;
	const stored = loadDiscPos();
	discPos = stored
		? clampDiscPos(stored.x, stored.y)
		: clampDiscPos(24, window.innerHeight - 152);
});

// 播放状态变化时同步形态：暂停时胶囊收回 bar，播放中回到静置形态（复刻参考博客）
$effect(() => {
	if (!playing) {
		if (dockShape === "pill") dockShape = "bar";
	} else if (dockShape !== "bar" && dockShape !== dockRestingShape()) {
		dockShape = dockHover ? "bar" : dockRestingShape();
	}
});

/** 按住 dock 可拖部分（唱片 / 信息层表面）启动拖动；交互元素照常点击 */
function onDiscPointerDown(event: PointerEvent): void {
	if (discPos === null) return;
	if ((event.target as HTMLElement).closest("input, button, a")) return;
	discDragging = true;
	discMoved = false;
	discPointerId = event.pointerId;
	discDragStart = {
		px: event.clientX,
		py: event.clientY,
		x: discPos.x,
		y: discPos.y,
	};
	(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onDiscPointerMove(event: PointerEvent): void {
	if (!discDragging || event.pointerId !== discPointerId) return;
	const dx = event.clientX - discDragStart.px;
	const dy = event.clientY - discDragStart.py;
	if (!discMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
	discMoved = true;
	// 拖动中直接写 DOM transform 绕过响应式渲染保证跟手；抬起时再提交状态
	const next = clampDiscPos(discDragStart.x + dx, discDragStart.y + dy);
	if (discEl) {
		discEl.style.transform = `translate(${next.x}px, ${next.y}px)`;
	}
	discPos = next;
}

function onDiscPointerUp(event: PointerEvent): void {
	if (!discDragging || event.pointerId !== discPointerId) return;
	discDragging = false;
	discPointerId = null;
	if (discMoved) {
		// 拖动结束：记录位置；抑制紧随其后的 click（否则会误触展开面板）
		suppressDiscClick = true;
		try {
			localStorage.setItem(DISC_POS_KEY, JSON.stringify(discPos));
		} catch {
			// localStorage 不可用时位置仅本次会话生效
		}
	}
}

function onDiscClick(): void {
	if (suppressDiscClick) {
		suppressDiscClick = false;
		return;
	}
	if (dockShape === "bar") {
		floatPanelOpen = false;
		dockShape = playing ? dockRestingShape() : "disc";
	} else {
		dockShape = "bar";
	}
}

function onDiscKeydown(event: KeyboardEvent): void {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		if (dockShape === "bar") {
			floatPanelOpen = false;
			dockShape = playing ? dockRestingShape() : "disc";
		} else {
			dockShape = "bar";
		}
	}
}

/**
 * 全局指针命中测试替代容器 enter/leave：
 * 容器盒子只覆盖工具栏区域，信息层/面板向上生长超出盒子的部分会误判「离开」。
 * 改为逐次判断指针是否命中 dock 子树（composedPath），命中即悬停。
 * 仅处理鼠标——触屏没有悬浮概念，展开/收起由点击驱动。
 */
function onDocumentPointerMove(event: PointerEvent): void {
	if (event.pointerType !== "mouse") return;
	if (!hasTracks || options.showFloatPlayer === false) return;
	const inside = discEl !== null && event.composedPath().includes(discEl);
	if (inside === dockHover) return;
	dockHover = inside;
	if (inside) {
		if (collapseTimer !== null) {
			clearTimeout(collapseTimer);
			collapseTimer = null;
		}
		if (dockShape !== "bar") dockShape = "bar";
		return;
	}
	// 离开：bar 态延迟收回（播放中回静置形态，未播放收回唱片）
	if (dockShape !== "bar" || discDragging || floatPanelOpen) return;
	if (collapseTimer !== null) clearTimeout(collapseTimer);
	collapseTimer = setTimeout(() => {
		collapseTimer = null;
		if (!dockHover && dockShape === "bar" && !discDragging && !floatPanelOpen) {
			dockShape = playing ? dockRestingShape() : "disc";
			if (dockShape !== "bar") floatPanelOpen = false;
		}
	}, DOCK_COLLAPSE_DELAY);
}

/** 点击组件外：收歌单面板并收回 dock（复刻参考博客行为） */
function onDocumentClick(event: MouseEvent): void {
	if (!hasTracks || options.showFloatPlayer === false) return;
	const target = event.target as Node | null;
	if (
		!target ||
		(discEl !== null && (target === discEl || discEl.contains(target)))
	) {
		return;
	}
	floatPanelOpen = false;
	if (dockShape === "bar") {
		dockShape = playing ? dockRestingShape() : "disc";
	}
}

/** 垂直音量条拖拽（复刻参考博客 bindDrag vertical：底部为 0、顶部为 1） */
function onVolumeTrackPointerDown(event: PointerEvent): void {
	const track = event.currentTarget as HTMLElement;
	track.setPointerCapture(event.pointerId);
	const apply = (clientY: number): void => {
		const rect = track.getBoundingClientRect();
		const ratio =
			1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
		runtime?.setVolume(ratio);
	};
	apply(event.clientY);
	const move = (moveEvent: PointerEvent): void => apply(moveEvent.clientY);
	const up = (): void => {
		track.removeEventListener("pointermove", move);
		track.removeEventListener("pointerup", up);
		track.removeEventListener("pointercancel", up);
	};
	track.addEventListener("pointermove", move);
	track.addEventListener("pointerup", up);
	track.addEventListener("pointercancel", up);
}

function onProgressPointerDown(): void {
	draggingSeek = true;
}

function onProgressInput(event: Event): void {
	const val = Number((event.currentTarget as HTMLInputElement).value);
	dragTime = Number.isFinite(val) ? Math.max(0, val) : null;
}

function onProgressChange(event: Event): void {
	draggingSeek = false;
	dragTime = null;
	const val = Number((event.currentTarget as HTMLInputElement).value);
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
									size="small"
									toggle
									checked={lyricsOpen}
									ariaExpanded={lyricsOpen}
									ariaControls="sidebar-music-lyrics"
									onclick={toggleLyrics}
								/>
							</Tooltip>
							<Tooltip label={labels.floatingLyrics} placement="top">
								<IconButton
									icon="material-symbols:speaker-notes-off-rounded"
									checkedIcon="material-symbols:speaker-notes-rounded"
									label={labels.floatingLyrics}
									size="small"
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

<svelte:document onclick={onDocumentClick} onpointermove={onDocumentPointerMove} />

{#if hasTracks && options.showFloatPlayer !== false}
	<div
		use:portal
		bind:this={discEl}
		class="music-float-player"
		class:music-float-player--bar={dockShape === "bar"}
		class:music-float-player--pill={dockShape === "pill"}
		class:music-float-player--panel-open={floatPanelOpen}
		class:music-float-player--dragging={discDragging}
		style={
			discPos
				? `transform: translate(${Math.round(discPos.x)}px, ${Math.round(discPos.y)}px);`
				: undefined
		}
	>
		<!-- 舞台：面板 + 信息层 + 工具栏 + 唱片（文档流自底向上生长，复刻参考博客） -->
		<div class="music-float-player__stage">
			<!-- 上展面板：歌单 / 歌词双 tab，由工具栏歌单按钮开合 -->
			<div class="music-float-player__panel">
				<div class="music-float-player__panel-clip">
					<div class="music-float-player__panel-body">
						<div class="music-float-player__tabs" role="tablist">
						<button
							type="button"
							role="tab"
							aria-selected={panelTab === "list"}
							class="music-float-player__tab"
							class:music-float-player__tab--active={panelTab === "list"}
							onclick={() => (panelTab = "list")}
						>
							{labels.tabPlaylist}
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={panelTab === "lyrics"}
							class="music-float-player__tab"
							class:music-float-player__tab--active={panelTab === "lyrics"}
							onclick={() => (panelTab = "lyrics")}
						>
							{labels.lyrics}
						</button>
					</div>
					<div class="music-float-player__views">
						{#if panelTab === "list"}
							<ol class="music-player__playlist">
								{#each snapshot.playlist as track, index (track.id)}
									<li>
										<button
											type="button"
											class={`music-player__playlist-item m3-state-layer${index === snapshot.currentIndex ? " music-player__playlist-item--current" : ""}`}
											aria-current={index === snapshot.currentIndex ? "true" : undefined}
											onclick={() => void runtime?.select(index)}
										>
											<span class="music-float-player__item-cover" aria-hidden="true">
												{#if track.cover}
													<img
														src={track.cover}
														srcset={track.coverSrcset}
														sizes="40px"
														width={track.coverWidth}
														height={track.coverHeight}
														alt=""
														loading="lazy"
														decoding="async"
													/>
												{:else}
													<Icon icon="material-symbols:music-note-rounded" />
												{/if}
											</span>
											<span class="music-player__playlist-copy">
												<strong>{track.title}</strong>
												{#if track.artist}<span>{track.artist}</span>{/if}
											</span>
										</button>
									</li>
								{/each}
							</ol>
						{:else if lyrics.status === "loading"}
							<p class="music-float-player__empty">{labels.loadingLyrics}</p>
						{:else if lyrics.lines.length === 0}
							<p class="music-float-player__empty">{labels.noLyrics}</p>
						{:else}
							<div
								class="music-player__lyrics-list"
								onwheel={onLyricsUserScroll}
								ontouchstart={onLyricsUserScroll}
								onpointerdown={onLyricsUserScroll}
							>
								{#each lyrics.lines as line, index (index)}
									<button
										type="button"
										class={`music-player__lyric-line${index === currentLrcIndex ? " music-player__lyric-line--active" : ""}`}
										onclick={() => seekToLine(index)}
									>
										{line.text || "♪"}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
			<div class="music-float-player__info">
				<div class="music-float-player__info-clip">
					<!-- 信息层表面也可按住拖动（按钮/进度条除外） -->
				<div
					class="music-float-player__info-surface"
					onpointerdown={onDiscPointerDown}
					onpointermove={onDiscPointerMove}
					onpointerup={onDiscPointerUp}
				>
						<strong class="music-float-player__title" title={currentTitle}>
							{currentTitle}
						</strong>
						<span class="music-float-player__artist" title={currentArtist}>
							{currentArtist}
						</span>
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
					</div>
				</div>
			</div>
			<div class="music-float-player__bar">
				<!-- 胶囊歌词槽：pill 态显示当前歌词行，bar 态让位工具栏 -->
				<span
					class="music-float-player__pill-text"
					aria-hidden={dockShape !== "pill"}
				>
					<span class="music-float-player__pill-label">{dockPillText}</span>
				</span>
				<div class="music-float-player__toolbar">
					<Tooltip label={modeLabel} placement="top">
						<IconButton
							icon={modeIcon}
							label={`${labels.playbackMode}: ${modeLabel}`}
							size="xsmall"
							disabled={!hasTracks}
							onclick={cycleMode}
						/>
					</Tooltip>
					{#if options.showLyrics !== false}
						<Tooltip label={labels.lyrics} placement="top">
							<IconButton
								icon="material-symbols:subtitles-off-outline-rounded"
								checkedIcon="material-symbols:subtitles-outline-rounded"
								label={labels.lyrics}
								size="xsmall"
								toggle
								checked={dockLyricsOn}
								onclick={toggleDockLyrics}
							/>
						</Tooltip>
					{/if}
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
					<Tooltip label={labels.tabPlaylist} placement="top">
						<IconButton
							icon="material-symbols:queue-music-rounded"
							label={labels.tabPlaylist}
							size="xsmall"
							toggle
							checked={floatPanelOpen}
							onclick={() => {
								floatPanelOpen = !floatPanelOpen;
								if (floatPanelOpen) panelTab = "list";
							}}
						/>
					</Tooltip>
					<div class="music-float-player__volume">
						<IconButton
							icon="material-symbols:volume-up-rounded"
							checkedIcon="material-symbols:volume-off-rounded"
							label={volumeLabel}
							size="xsmall"
							toggle
							checked={snapshot.muted}
							onclick={() => runtime?.setMuted(!snapshot.muted)}
						/>
						<div class="music-float-player__volume-pop">
							<span class="music-float-player__volume-value">{volumePct}</span>
							<div
								class="music-float-player__volume-track"
								role="slider"
								aria-label={volumeLabel}
								aria-orientation="vertical"
								aria-valuemin="0"
								aria-valuemax="100"
								aria-valuenow={volumePct}
								onpointerdown={onVolumeTrackPointerDown}
							>
								<div
									class="music-float-player__volume-bar"
									style={`height:${volumePct}%`}
								/>
								<div
									class="music-float-player__volume-thumb"
									style={`bottom:${volumePct}%`}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<!-- 唱片：收起态独立左下角，展开态骑在信息层与工具栏接缝 -->
			<div class="music-float-player__disc">
				<div
					class="music-float-disc"
					class:music-float-disc--dragging={discDragging}
					class:music-float-disc--paused={!playing}
				>
					<div
						class="music-float-disc__hit"
						role="button"
						tabindex="0"
						aria-label={labels.nowPlaying}
						aria-expanded={dockShape === "bar"}
						// 阻止封面 <img> 原生拖拽（否则 dragstart 会 pointercancel 打断拖动）
						ondragstart={(e) => e.preventDefault()}
						onpointerdown={onDiscPointerDown}
						onpointermove={onDiscPointerMove}
						onpointerup={onDiscPointerUp}
						onclick={onDiscClick}
						onkeydown={onDiscKeydown}
					>
						<div class="music-float-disc__spin" aria-hidden="true">
							{#if snapshot.currentTrack?.cover}
								<img
									src={snapshot.currentTrack.cover}
									srcset={snapshot.currentTrack.coverSrcset}
									sizes="64px"
									width={snapshot.currentTrack.coverWidth}
									height={snapshot.currentTrack.coverHeight}
									alt=""
									draggable="false"
									loading="lazy"
									decoding="async"
								/>
							{:else}
								<Icon icon="material-symbols:music-note-rounded" />
							{/if}
						</div>
						<span class="music-float-disc__toggle" aria-hidden="true">
							<Icon icon={playing ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} />
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}