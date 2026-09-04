/**
 * 友链卡片专属粒子特效（Svelte action）— 移植自参考站（fqzlr-bk）的两个 canvas 脚本：
 * - starFlow：推荐友链（金色）——16 颗五角圆角星「自左向右」流动，
 *   带彗尾、呼吸闪烁与光带增益（recommended-star-flow 等价）；
 * - auroraFlow：站长卡片（紫色）——14 颗四角星芒自底部上升，
 *   带十字光芒、摇曳与光带增益（owner-aurora-flow 等价）。
 *
 * 约束：
 * - prefers-reduced-motion（系统偏好或站点手动开关）命中时不创建 canvas，
 *   仅保留组件内的静态光感层；
 * - IntersectionObserver 控制暂停：卡片离开视口即停止绘制，不空转 rAF；
 * - 宿主元素（.friend-card__fx）由组件样式定位且 pointer-events:none，
 *   hover 增益监听挂在其父级（卡片 <a>）上。
 */

import { prefersReducedMotion } from "@utils/motion";

import type { ActionReturn } from "svelte/action";

/** 平滑 0-1（smoothstep），与参考站 smooth01 一致 */
function smooth01(t: number): number {
	const clamped = Math.max(0, Math.min(1, t));
	return clamped * clamped * (3 - 2 * clamped);
}

/** 区间取随机值 */
const between = (range: readonly [number, number]): number =>
	range[0] + (range[1] - range[0]) * Math.random();

/**
 * 圆角多角星路径（参考站 traceRoundedStar 等价）：
 * points=5 + innerScale=0.48 → 金色五角星；points=4 + innerScale=0.36 → 紫色四角星芒。
 */
function traceRoundedStar(
	ctx: CanvasRenderingContext2D,
	outerRadius: number,
	rotation: number,
	rounding: number,
	points: number,
	innerScale: number,
): void {
	const innerRadius = outerRadius * innerScale;
	const total = points * 2;
	const vertices = Array.from({ length: total }, (_, index) => {
		const radius = index % 2 === 0 ? outerRadius : innerRadius;
		const angle = rotation - Math.PI / 2 + (index * Math.PI) / points;
		return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
	});
	const first = vertices[0];
	const last = vertices[vertices.length - 1];

	ctx.beginPath();
	ctx.moveTo(
		first.x + (last.x - first.x) * rounding,
		first.y + (last.y - first.y) * rounding,
	);

	vertices.forEach((point, index) => {
		const previous = vertices[(index + vertices.length - 1) % vertices.length];
		const next = vertices[(index + 1) % vertices.length];
		const beforeX = point.x + (previous.x - point.x) * rounding;
		const beforeY = point.y + (previous.y - point.y) * rounding;
		const afterX = point.x + (next.x - point.x) * rounding;
		const afterY = point.y + (next.y - point.y) * rounding;
		if (index > 0) ctx.lineTo(beforeX, beforeY);
		ctx.quadraticCurveTo(point.x, point.y, afterX, afterY);
	});
	ctx.closePath();
}

// ===== 金色流星（推荐友链）：recommended-star-flow 等价移植 =====

interface GoldStarParticle {
	layer: number;
	/** 0-1 循环相位（决定粒子在周期内的出发错峰） */
	phase: number;
	/** 0-1 归一化纵向槽位 */
	baseY: number;
	radius: number;
	baseAlpha: number;
	floatAmplitude: number;
	curveAmplitude: number;
	glow: number;
	xDrift: number;
	driftFrequency: number;
	curvePhase: number;
	twinklePhase: number;
	twinkleSpeed: number;
	rotation: number;
	rotationSpeed: number;
	hasTrail: boolean;
	tailScale: number;
}

const STAR_LAYER_PATTERN = [0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 2, 1, 0, 1, 2];
const STAR_Y_SLOTS = [
	0.2, 0.7, 0.43, 0.77, 0.17, 0.57, 0.32, 0.64, 0.82, 0.5, 0.25, 0.73, 0.16,
	0.84, 0.39, 0.58,
];
const STAR_LAYERS = [
	{
		radius: [3.1, 4.35],
		alpha: [0.56, 0.7],
		float: [1.9, 3.5],
		curve: [2.1, 3.9],
		glow: [4, 7],
	},
	{
		radius: [4.5, 6.25],
		alpha: [0.72, 0.88],
		float: [2.9, 5],
		curve: [3.5, 6],
		glow: [7, 11],
	},
	{
		radius: [6.3, 8.35],
		alpha: [0.88, 1],
		float: [4, 6.4],
		curve: [4.8, 7.8],
		glow: [11, 16],
	},
] as const;

function createGoldStars(): GoldStarParticle[] {
	return Array.from({ length: 16 }, (_, index) => {
		const layer = STAR_LAYER_PATTERN[index];
		const profile = STAR_LAYERS[layer];
		return {
			layer,
			phase: index / 16,
			baseY: STAR_Y_SLOTS[index],
			radius: between(profile.radius),
			baseAlpha: between(profile.alpha),
			floatAmplitude: between(profile.float),
			curveAmplitude: between(profile.curve),
			glow: between(profile.glow),
			xDrift: 0.8 + Math.random() * (1.3 + layer * 0.85),
			driftFrequency: 0.62 + Math.random() * 0.72,
			curvePhase: Math.random() * Math.PI * 2,
			twinklePhase: Math.random() * Math.PI * 2,
			twinkleSpeed: 0.88 + Math.random() * 1.05,
			rotation: Math.random() * Math.PI * 2,
			rotationSpeed:
				(0.2 + Math.random() * (0.18 + layer * 0.09)) *
				(Math.random() > 0.5 ? 1 : -1),
			hasTrail: layer > 0 || index % 4 === 0,
			tailScale: 3.2 + Math.random() * 1.7 + layer * 0.75,
		};
	}).sort((a, b) => a.layer - b.layer);
}

/** 金色彗尾：星星身后的渐隐拖尾（沿运动曲线方向） */
function drawGoldTrail(
	ctx: CanvasRenderingContext2D,
	particle: GoldStarParticle,
	width: number,
	x: number,
	y: number,
	radius: number,
	curveAngle: number,
	alpha: number,
	beamBoost: number,
): void {
	const tailLength = radius * particle.tailScale;
	const slope =
		(particle.curveAmplitude * Math.PI * 2 * Math.cos(curveAngle)) /
		Math.max(width, 1);
	const startX = x - tailLength;
	const startY = y - slope * tailLength;
	const gradient = ctx.createLinearGradient(startX, startY, x, y);
	gradient.addColorStop(0, "rgba(248, 197, 76, 0)");
	gradient.addColorStop(
		1,
		`rgba(248, 192, 59, ${Math.min(0.7, alpha * (0.45 + beamBoost * 0.22))})`,
	);

	ctx.save();
	ctx.globalCompositeOperation = "source-over";
	ctx.strokeStyle = gradient;
	ctx.lineWidth = Math.max(0.9, radius * 0.48);
	ctx.lineCap = "round";
	ctx.shadowColor = `rgba(244, 182, 47, ${0.38 + beamBoost * 0.3})`;
	ctx.shadowBlur = 5 + beamBoost * 7;
	ctx.beginPath();
	ctx.moveTo(startX, startY);
	ctx.quadraticCurveTo(
		x - tailLength * 0.45,
		y - slope * tailLength * 0.24,
		x - radius * 0.7,
		y,
	);
	ctx.stroke();
	ctx.restore();
}

/** 金色五角星主体：分层填色 + 亮色描边 + 光晕 */
function drawGoldStar(
	ctx: CanvasRenderingContext2D,
	particle: GoldStarParticle,
	x: number,
	y: number,
	radius: number,
	rotation: number,
	alpha: number,
	beamBoost: number,
	hoverAmount: number,
): void {
	const fillColors = ["255, 220, 125", "250, 200, 76", "246, 185, 50"];
	const fill = fillColors[particle.layer];

	ctx.save();
	ctx.translate(x, y);
	ctx.globalCompositeOperation = "source-over";
	ctx.shadowColor = `rgba(241, 171, 31, ${0.48 + beamBoost * 0.3})`;
	ctx.shadowBlur = particle.glow + beamBoost * 10 + hoverAmount * 3;
	traceRoundedStar(ctx, radius, rotation, 0.18, 5, 0.48);
	ctx.fillStyle = `rgba(${fill}, ${alpha})`;
	ctx.fill();
	ctx.strokeStyle = `rgba(255, 247, 193, ${Math.min(1, alpha + 0.16)})`;
	ctx.lineWidth = 0.72 + particle.layer * 0.18;
	ctx.stroke();
	ctx.restore();
}

// ===== 紫色星芒（站长卡片）：owner-aurora-flow 等价移植 =====

interface AuroraParticle {
	layer: number;
	phase: number;
	/** 0-1 归一化横向槽位 */
	baseX: number;
	radius: number;
	baseAlpha: number;
	swayAmplitude: number;
	swayFrequency: number;
	swayPhase: number;
	riseSpeed: number;
	glow: number;
	rotation: number;
	spinSpeed: number;
	pulsePhase: number;
	pulseSpeed: number;
	tailScale: number;
	hasTrail: boolean;
}

const AURORA_LAYER_PATTERN = [0, 1, 0, 2, 1, 0, 2, 1, 0, 1, 2, 0, 1, 2];
const AURORA_X_SLOTS = [
	0.08, 0.2, 0.33, 0.45, 0.57, 0.68, 0.8, 0.92, 0.14, 0.27, 0.4, 0.62, 0.74,
	0.86,
];
const AURORA_LAYERS = [
	{
		radius: [2.4, 3.4],
		alpha: [0.38, 0.55],
		sway: [5, 10],
		glow: [3, 6],
	},
	{
		radius: [3.4, 4.8],
		alpha: [0.55, 0.75],
		sway: [8, 14],
		glow: [6, 10],
	},
	{
		radius: [4.8, 6.8],
		alpha: [0.75, 0.98],
		sway: [11, 19],
		glow: [10, 15],
	},
] as const;

function createAuroraParticles(): AuroraParticle[] {
	return Array.from({ length: 14 }, (_, index) => {
		const layer = AURORA_LAYER_PATTERN[index];
		const profile = AURORA_LAYERS[layer];
		return {
			layer,
			phase: Math.random(),
			baseX: AURORA_X_SLOTS[index],
			radius: between(profile.radius),
			baseAlpha: between(profile.alpha),
			swayAmplitude: between(profile.sway),
			swayFrequency: 0.5 + Math.random() * 0.6,
			swayPhase: Math.random() * Math.PI * 2,
			riseSpeed: 0.75 + Math.random() * 0.5 + layer * 0.12,
			glow: between(profile.glow),
			rotation: Math.random() * Math.PI * 2,
			spinSpeed: (0.25 + Math.random() * 0.35) * (Math.random() > 0.5 ? 1 : -1),
			pulsePhase: Math.random() * Math.PI * 2,
			pulseSpeed: 0.9 + Math.random() * 1.1,
			tailScale: 2.4 + Math.random() * 1.4 + layer * 0.6,
			hasTrail: layer > 0 || index % 4 === 0,
		};
	}).sort((a, b) => a.layer - b.layer);
}

/** 紫色尾迹：上升粒子身后的渐隐拖尾 */
function drawAuroraTrail(
	ctx: CanvasRenderingContext2D,
	particle: AuroraParticle,
	height: number,
	x: number,
	y: number,
	radius: number,
	alpha: number,
	bandBoost: number,
): void {
	const tailLength = radius * particle.tailScale;
	const swayOffset =
		Math.sin((y / Math.max(height, 1)) * Math.PI * 2 + particle.swayPhase) *
		(tailLength * 0.22);
	const gradient = ctx.createLinearGradient(
		x + swayOffset,
		y + tailLength,
		x,
		y,
	);
	gradient.addColorStop(0, "rgba(165, 148, 255, 0)");
	gradient.addColorStop(
		1,
		`rgba(178, 160, 255, ${Math.min(0.6, alpha * (0.4 + bandBoost * 0.2))})`,
	);

	ctx.save();
	ctx.globalCompositeOperation = "source-over";
	ctx.strokeStyle = gradient;
	ctx.lineWidth = Math.max(0.8, radius * 0.4);
	ctx.lineCap = "round";
	ctx.shadowColor = `rgba(141, 124, 255, ${0.3 + bandBoost * 0.28})`;
	ctx.shadowBlur = 4 + bandBoost * 6;
	ctx.beginPath();
	ctx.moveTo(x + swayOffset, y + tailLength);
	ctx.quadraticCurveTo(
		x + swayOffset * 0.4,
		y + tailLength * 0.45,
		x,
		y + radius * 0.6,
	);
	ctx.stroke();
	ctx.restore();
}

/** 紫色四角星芒：径向渐变主体 + 亮色描边 + 十字光芒 */
function drawSparkle(
	ctx: CanvasRenderingContext2D,
	particle: AuroraParticle,
	x: number,
	y: number,
	radius: number,
	rotation: number,
	alpha: number,
	bandBoost: number,
	hoverAmount: number,
): void {
	const fillColors = ["214, 205, 255", "178, 160, 255", "141, 124, 255"];
	const fill = fillColors[particle.layer];

	ctx.save();
	ctx.translate(x, y);
	ctx.globalCompositeOperation = "source-over";
	ctx.shadowColor = `rgba(141, 124, 255, ${0.5 + bandBoost * 0.34})`;
	ctx.shadowBlur = particle.glow + bandBoost * 11 + hoverAmount * 3;

	// 四角星芒主体（径向渐变：白芯 → 层色 → 层色渐隐）
	traceRoundedStar(ctx, radius, rotation, 0.14, 4, 0.36);
	const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
	gradient.addColorStop(0, `rgba(245, 242, 255, ${Math.min(1, alpha + 0.25)})`);
	gradient.addColorStop(0.55, `rgba(${fill}, ${alpha})`);
	gradient.addColorStop(1, `rgba(${fill}, ${alpha * 0.72})`);
	ctx.fillStyle = gradient;
	ctx.fill();
	ctx.strokeStyle = `rgba(235, 230, 255, ${Math.min(1, alpha + 0.18)})`;
	ctx.lineWidth = 0.6 + particle.layer * 0.16;
	ctx.stroke();

	// 十字光芒（细长闪光线，营造"星光"质感）
	const flareLength = radius * (2.1 + bandBoost * 1.2);
	const flareAlpha = alpha * (0.34 + bandBoost * 0.3);
	ctx.rotate(rotation);
	ctx.strokeStyle = `rgba(226, 218, 255, ${flareAlpha})`;
	ctx.lineWidth = Math.max(0.6, radius * 0.16);
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(-flareLength, 0);
	ctx.lineTo(flareLength, 0);
	ctx.moveTo(0, -flareLength);
	ctx.lineTo(0, flareLength);
	ctx.stroke();
	ctx.restore();
}

// ===== 通用运行器：canvas 装配 / resize(DPR) / 离屏暂停 / hover 增益 =====

interface FxHooks {
	/** rAF 速度的 hover 增益系数（金 0.14 / 紫 0.16） */
	hoverSpeed: number;
	/** 按宿主尺寸重设 canvas（含 DPR），由运行器在 ResizeObserver 中调用 */
	resize(): void;
	/** 绘制一帧：elapsed 毫秒累计时长 + hoverAmount 0-1 */
	render(elapsed: number, hoverAmount: number): void;
}

function createFx(node: HTMLElement, hooks: FxHooks): ActionReturn {
	if (typeof window === "undefined" || prefersReducedMotion()) {
		return { destroy() {} };
	}

	const canvas = document.createElement("canvas");
	canvas.setAttribute("aria-hidden", "true");
	node.appendChild(canvas);
	const ctx = canvas.getContext("2d", { alpha: true });
	if (!ctx) {
		canvas.remove();
		return { destroy() {} };
	}

	let raf = 0;
	let visible = false;
	let last = 0;
	let elapsed = 0;
	let hoverAmount = 0;
	let hoverTarget = 0;

	const onEnter = () => {
		hoverTarget = 1;
	};
	const onLeave = () => {
		hoverTarget = 0;
	};
	// .friend-card__fx 为 pointer-events:none，hover 监听挂到卡片根节点（父级）
	const hoverEl = node.parentElement ?? node;

	const tick = (now: number): void => {
		if (!visible) return;
		const delta = last ? Math.min(42, now - last) : 0;
		last = now;
		hoverAmount += (hoverTarget - hoverAmount) * Math.min(1, delta / 180);
		elapsed += delta * (1 + hoverAmount * hooks.hoverSpeed);
		hooks.render(elapsed, hoverAmount);
		raf = requestAnimationFrame(tick);
	};

	const ro = new ResizeObserver(() => {
		// HMR / Swup 摘除竞态防御：宿主已脱离文档时跳过，避免对已销毁节点取尺寸
		if (!node.isConnected) return;
		hooks.resize();
		// resize 后立即补绘一帧，避免离屏暂停期间出现空白
		hooks.render(elapsed, hoverAmount);
	});
	ro.observe(node);
	hooks.resize();

	const io = new IntersectionObserver(
		(entries) => {
			const intersecting = entries[0]?.isIntersecting ?? false;
			if (intersecting === visible) return;
			visible = intersecting;
			cancelAnimationFrame(raf);
			if (visible) {
				last = 0;
				raf = requestAnimationFrame(tick);
			}
		},
		{ threshold: 0.01 },
	);
	io.observe(node);

	hoverEl.addEventListener("pointerenter", onEnter);
	hoverEl.addEventListener("pointerleave", onLeave);

	return {
		destroy() {
			io.disconnect();
			ro.disconnect();
			cancelAnimationFrame(raf);
			hoverEl.removeEventListener("pointerenter", onEnter);
			hoverEl.removeEventListener("pointerleave", onLeave);
			canvas.remove();
		},
	};
}

/** 推荐友链：金色五角星自左向右流动（周期 4.6s + 光带增益周期 3.8s） */
export function starFlow(node: HTMLElement): ActionReturn {
	const particles = createGoldStars();
	let width = 0;
	let height = 0;

	return createFx(node, {
		hoverSpeed: 0.14,
		resize() {
			const rect = node.getBoundingClientRect();
			if (rect.width < 1 || rect.height < 1) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = rect.width;
			height = rect.height;
			const canvas = node.querySelector("canvas");
			if (!canvas) return;
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			const ctx = canvas.getContext("2d");
			ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
		},
		render(elapsed, hoverAmount) {
			const canvas = node.querySelector("canvas");
			const ctx = canvas?.getContext("2d");
			if (!ctx || !width || !height) return;
			ctx.clearRect(0, 0, width, height);

			const time = elapsed / 1000;
			const cycleDuration = 4600;
			const beamDuration = 3800;
			const beamProgress = (elapsed % beamDuration) / beamDuration;
			const easedBeam = smooth01(beamProgress);
			const beamX = (-0.16 + easedBeam * 1.32) * width;
			const beamSpread = Math.max(24, width * 0.13);

			for (const particle of particles) {
				const progress = (particle.phase + elapsed / cycleDuration) % 1;
				const radius = particle.radius;
				const enterFade = smooth01(progress / 0.14);
				const exitFade = smooth01((1 - progress) / 0.2);
				const edgeFade = enterFade * exitFade;
				const drift = Math.sin(
					time * particle.driftFrequency + particle.twinklePhase,
				);
				const curveAngle = progress * Math.PI * 2 + particle.curvePhase;
				// 自左向右：progress 0 → 1 对应 x 从左缘到右缘
				const rawX =
					radius +
					progress * Math.max(1, width - radius * 2) +
					drift * particle.xDrift;
				const x = Math.max(radius, Math.min(width - radius, rawX));
				const rawY =
					particle.baseY * height +
					Math.sin(curveAngle) * particle.curveAmplitude +
					Math.sin(progress * Math.PI * 2 - time * 0.72) *
						(1.6 + particle.layer * 1.15) +
					drift * particle.floatAmplitude;
				const safeY = radius + Math.min(5, particle.glow * 0.34) + 2;
				const y = Math.max(safeY, Math.min(height - safeY, rawY));
				const beamDistance = x - beamX;
				const beamBoost = Math.exp(
					-(beamDistance * beamDistance) / (2 * beamSpread * beamSpread),
				);
				const twinkle =
					0.9 +
					Math.sin(time * particle.twinkleSpeed + particle.twinklePhase) * 0.08;
				const scale =
					0.94 + twinkle * 0.06 + beamBoost * 0.24 + hoverAmount * 0.08;
				const alpha = Math.min(
					1,
					particle.baseAlpha *
						edgeFade *
						(twinkle + beamBoost * 0.38 + hoverAmount * 0.13),
				);
				const rotation =
					particle.rotation +
					time * particle.rotationSpeed +
					Math.sin(curveAngle) * 0.08;

				if (particle.hasTrail) {
					drawGoldTrail(
						ctx,
						particle,
						width,
						x,
						y,
						radius * scale,
						curveAngle,
						alpha,
						beamBoost,
					);
				}
				drawGoldStar(
					ctx,
					particle,
					x,
					y,
					radius * scale,
					rotation,
					alpha,
					beamBoost,
					hoverAmount,
				);
			}
		},
	});
}

/** 站长卡片：紫色四角星芒自底部上升（周期 7.2s + 光带增益周期 5.2s） */
export function auroraFlow(node: HTMLElement): ActionReturn {
	const particles = createAuroraParticles();
	let width = 0;
	let height = 0;

	return createFx(node, {
		hoverSpeed: 0.16,
		resize() {
			const rect = node.getBoundingClientRect();
			if (rect.width < 1 || rect.height < 1) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = rect.width;
			height = rect.height;
			const canvas = node.querySelector("canvas");
			if (!canvas) return;
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			const ctx = canvas.getContext("2d");
			ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
		},
		render(elapsed, hoverAmount) {
			const canvas = node.querySelector("canvas");
			const ctx = canvas?.getContext("2d");
			if (!ctx || !width || !height) return;
			ctx.clearRect(0, 0, width, height);

			const time = elapsed / 1000;
			const cycleDuration = 7200;
			const bandDuration = 5200;
			const bandProgress = (elapsed % bandDuration) / bandDuration;
			const easedBand = smooth01(bandProgress);
			const bandX = (-0.18 + easedBand * 1.36) * width;
			const bandSpread = Math.max(26, width * 0.16);

			for (const particle of particles) {
				const progress =
					(particle.phase + (elapsed / cycleDuration) * particle.riseSpeed) % 1;
				const radius = particle.radius;
				const enterFade = smooth01(progress / 0.18);
				const exitFade = smooth01((1 - progress) / 0.24);
				const edgeFade = enterFade * exitFade;

				// 自底部上升：progress 0 → 1 对应 y 从底部到顶部
				const rawY = height * (1.1 - progress * 1.2);
				const y = Math.max(radius + 2, Math.min(height - radius - 2, rawY));
				const rawX =
					particle.baseX * width +
					Math.sin(time * particle.swayFrequency + particle.swayPhase) *
						particle.swayAmplitude;
				const x = Math.max(radius, Math.min(width - radius, rawX));

				const bandDistance = x - bandX;
				const bandBoost = Math.exp(
					-(bandDistance * bandDistance) / (2 * bandSpread * bandSpread),
				);
				const pulse =
					0.88 +
					Math.sin(time * particle.pulseSpeed + particle.pulsePhase) * 0.12;
				const scale = 0.9 + pulse * 0.1 + bandBoost * 0.3 + hoverAmount * 0.1;
				const alpha = Math.min(
					1,
					particle.baseAlpha *
						edgeFade *
						(pulse + bandBoost * 0.42 + hoverAmount * 0.14),
				);
				const rotation = particle.rotation + time * particle.spinSpeed;

				if (particle.hasTrail && alpha > 0.05) {
					drawAuroraTrail(
						ctx,
						particle,
						height,
						x,
						y,
						radius * scale,
						alpha,
						bandBoost,
					);
				}
				if (alpha > 0.02) {
					drawSparkle(
						ctx,
						particle,
						x,
						y,
						radius * scale,
						rotation,
						alpha,
						bandBoost,
						hoverAmount,
					);
				}
			}
		},
	});
}
