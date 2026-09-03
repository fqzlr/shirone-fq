/**
 * 樱花飘落特效配置（画布绘制，OffscreenCanvas + Worker 优先，主线程回退）。
 * `enable` 仅为站点默认值：访客可在「显示设置 → 特效」中开关并保存到浏览器。
 */
export type SakuraConfig = {
	/** 是否默认启用樱花特效（默认 false；关闭时零请求、零 DOM、零打包负担） */
	enable: boolean;
	/** 樱花数量（默认 21） */
	sakuraNum: number;
	/** 樱花越界重置次数上限，-1 为无限循环 */
	limitTimes: number;
	/** 樱花尺寸倍数范围 */
	size: {
		min: number;
		max: number;
	};
	/** 樱花不透明度范围 */
	opacity: {
		min: number;
		max: number;
	};
	/** 樱花运动速度 */
	speed: {
		/** 水平漂移速度范围（负值向左） */
		horizontal: {
			min: number;
			max: number;
		};
		/** 垂直下落速度范围 */
		vertical: {
			min: number;
			max: number;
		};
		/** 旋转速度（弧度/帧） */
		rotation: number;
		/** 消失（淡出）速度，不应大于 opacity.min */
		fadeSpeed: number;
	};
	/** 画布层级（默认 100，位于内容之上、悬浮控件之下） */
	zIndex: number;
};
