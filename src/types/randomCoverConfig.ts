/**
 * 随机封面配置契约（字段注释即文档）。
 *
 * 语义：未配置封面（frontmatter 无 image）的文章，回退显示图床随机图；
 * 随机图加载失败时（图床不可达 / 目录为空），换用代码仓库内的本地兜底图。
 *
 * 依赖 CloudFlare ImgBed 的 /random 随机图 API（公开访问，无需鉴权），
 * 端点需带 `type=img` 直接返回图片本体（可在 <img src> 中直接使用）。
 */
export interface RandomCoverConfig {
	/** 是否启用随机封面回退：false 时无封面文章保持原行为（列表卡进入箭头 / 文章页虚线），零额外负担 */
	enable: boolean;
	/**
	 * 图床随机图端点（完整 URL，可直接作为 <img src>）。
	 * CloudFlare ImgBed 示例："https://your-imgbed.domain/random?type=img&dir=katong"
	 * - type=img：直接返回图片本体（而非 JSON 链接）
	 * - dir：随机图目录（相对路径，包含其子目录）
	 * - 可选 orientation=landscape|portrait|square|auto 做方向筛选
	 */
	endpoint: string;
	/** 随机图加载失败时的本地兜底图（站点内绝对路径，指向 public/ 下的文件） */
	fallback: string;
}
