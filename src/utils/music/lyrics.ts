/**
 * 音乐歌词（LRC）解析与加载工具。
 *
 * 由侧栏播放器的 UI 层消费：曲目数据的 `lrc` 字段支持
 * 远端 URL（http(s):// 或 / 开头）与内嵌 LRC 文本两种形态；
 * 播放引擎（music-runtime）保持与歌词解耦。
 */

export interface LrcLine {
	/** 行起始时间（秒） */
	time: number;
	/** 歌词文本 */
	text: string;
}

/** 多时间标签正则：[mm:ss.xx] / [mm:ss.xxx]，一行可携带多个 */
const LRC_TIME_TAG = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/** 判断 lrc 字段是否为需要 fetch 的 URL（而非内嵌文本） */
export function isLrcUrl(value: string): boolean {
	const v = value.trim();
	return /^(?:https?:)?\/\//i.test(v) || v.startsWith("/");
}

/**
 * 解析 LRC 文本为按时间升序的歌词行。
 * 非法/无时间戳行忽略；一行多时间标签展开为多行；空文本行保留（间奏占位）。
 */
export function parseLrc(lrcText: string): LrcLine[] {
	if (!lrcText) return [];
	const lines: LrcLine[] = [];
	for (const rawLine of lrcText.split(/\r?\n/)) {
		LRC_TIME_TAG.lastIndex = 0;
		const matches = [...rawLine.matchAll(LRC_TIME_TAG)];
		if (matches.length === 0) continue;
		const text = rawLine.replace(LRC_TIME_TAG, "").trim();
		for (const match of matches) {
			const minutes = Number.parseInt(match[1], 10);
			const seconds = Number.parseInt(match[2], 10);
			const fraction = match[3] ?? "0";
			const millis = Number.parseInt(fraction, 10);
			if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) continue;
			const time = minutes * 60 + seconds + millis / 10 ** fraction.length;
			if (Number.isFinite(time)) lines.push({ time, text });
		}
	}
	return lines.sort((a, b) => a.time - b.time);
}

/** 根据播放进度计算当前高亮行下标（最后一个 time <= currentTime 的行；无则 -1） */
export function currentLrcIndexAt(
	lines: LrcLine[],
	currentTime: number,
): number {
	let index = -1;
	for (let i = 0; i < lines.length; i++) {
		if (currentTime >= lines[i].time) index = i;
		else break;
	}
	return index;
}

/**
 * 加载并解析曲目歌词：URL 走 fetch（带超时），否则按内嵌文本处理。
 * 失败抛错由调用方归类为 failed；resolve("") 表示无歌词数据。
 */
export async function loadLrcLines(track: {
	lrc?: string;
}): Promise<LrcLine[]> {
	const lrc = track.lrc?.trim();
	if (!lrc) return [];
	if (isLrcUrl(lrc)) {
		const response = await fetch(lrc, { signal: AbortSignal.timeout(10_000) });
		if (!response.ok) throw new Error(`LRC fetch failed: ${response.status}`);
		return parseLrc(await response.text());
	}
	return parseLrc(lrc);
}
