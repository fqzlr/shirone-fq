import type { SakuraConfig } from "./effectsConfig";

/**
 * 樱花特效 Worker 通信协议。
 * 主线程 → Worker（worker.postMessage 发送，init 携带转移所有权的 OffscreenCanvas）。
 */
export type SakuraWorkerInboundMessage =
	| {
			type: "init";
			config: SakuraConfig;
			/** 通过 transfer 转移给 Worker 的 OffscreenCanvas */
			canvas: OffscreenCanvas;
			/** 樱花贴图地址（由主线程按站点 base 解析后传入） */
			imageUrl: string;
			width: number;
			height: number;
	  }
	| { type: "stop" }
	| { type: "resize"; width: number; height: number }
	| { type: "visibilitychange"; hidden: boolean };

/** Worker → 主线程 的消息（self.postMessage 发送） */
export type SakuraWorkerOutboundMessage =
	| { type: "ready" }
	| { type: "error"; message: string; stack?: string }
	| { type: "messageError"; message: string };

/**
 * 主线程侧樱花管理器接口契约：Worker 模式与主线程回退模式均实现该接口，
 * 调用方（sakura-utils / 设置面板）无需感知底层实现。
 */
export interface SakuraManagerLike {
	config: SakuraConfig;
	isRunning: boolean;
	init: () => Promise<void>;
	stop: () => void;
	getIsRunning: () => boolean;
}
