const scriptCache = new Map<string, Promise<void>>();
const moduleCache = new Map<string, Promise<unknown>>();

/**
 * 确保指定 URL 的 ESM 模块只被动态导入一次。
 * 返回模块命名空间 Promise，重复调用复用同一个 Promise。
 */
export function loadModuleOnce<T = Record<string, unknown>>(
	url: string,
): Promise<T> {
	const normalizedUrl = url.trim();
	if (!normalizedUrl) {
		return Promise.reject(new Error("Empty module URL provided"));
	}

	const cached = moduleCache.get(normalizedUrl);
	if (cached) {
		return cached as Promise<T>;
	}

	// 动态 import 的模块由浏览器模块注册表按 URL 去重；
	// 此处缓存 Promise 以同时去重"加载中"状态并统一失败重试语义
	const promise = import(/* @vite-ignore */ normalizedUrl)
		.then((mod) => mod as T)
		.catch((error) => {
			moduleCache.delete(normalizedUrl);
			throw error;
		});

	moduleCache.set(normalizedUrl, promise);
	return promise;
}

/**
 * 确保指定 URL 的外部脚本在页面中只被加载一次。
 * 返回 Promise，若已在加载中或已完成则复用同一个 Promise。
 */
export function loadScriptOnce(url: string): Promise<void> {
	const normalizedUrl = url.trim();
	if (!normalizedUrl) {
		return Promise.reject(new Error("Empty script URL provided"));
	}

	const cached = scriptCache.get(normalizedUrl);
	if (cached) {
		return cached;
	}

	// 检查 DOM 中是否已有对应脚本标签（防御外部已插入场景）
	const existing = document.querySelector<HTMLScriptElement>(
		`script[src="${normalizedUrl}"]`,
	);
	if (existing) {
		const existingPromise = Promise.resolve();
		scriptCache.set(normalizedUrl, existingPromise);
		return existingPromise;
	}

	const promise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = normalizedUrl;
		script.async = true;

		script.onload = () => {
			resolve();
		};

		script.onerror = () => {
			// 加载失败时从缓存移除，允许后续重试
			scriptCache.delete(normalizedUrl);
			script.remove();
			reject(new Error(`Failed to load external script: ${normalizedUrl}`));
		};

		document.head.appendChild(script);
	});

	scriptCache.set(normalizedUrl, promise);
	return promise;
}
