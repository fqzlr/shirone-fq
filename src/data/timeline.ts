/**
 * 时间线页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/timelineConfig.ts 控制。
 */
import type { TimelineItem } from "@/types/timelineConfig";

export const timelineData: TimelineItem[] = [
	{
		title: "迁移至 Shirone 主题，内容仓分离",
		date: "2026.09",
		category: "milestone",
		subtitle: "Blog Rebuild",
		description:
			"把博客整体迁移到 Material 3 Expressive 风格的 Shirone 主题，并将文章、数据与配置拆分到独立内容仓库，写作与主题升级从此互不干扰。",
		highlights: [
			"站点身份、友链、关于页与时间线全部迁移到新主题",
			"内容与代码双仓分离，content sync 一键物化",
		],
		tags: ["Shirone", "Astro", "内容分离"],
		icon: "material-symbols:rocket-launch-rounded",
		featured: true,
	},
	{
		title: "时间线 & 图形化视图上线",
		date: "2026.08",
		category: "milestone",
		subtitle: "旧站 · 魔改记录",
		description: "更新日志变成时间线 + 图形化双视图，魔改的手就没停过～",
		tags: ["Mizuki", "可视化"],
		icon: "material-symbols:timeline-rounded",
	},
	{
		title: "友链自动检测上线",
		date: "2026.07",
		category: "milestone",
		subtitle: "旧站 · 魔改记录",
		description: "给友链页接上了失效检测，掉线的小站自动进「暂留区」～",
		tags: ["Mizuki", "友链"],
		icon: "material-symbols:link-rounded",
	},
	{
		title: "fork 一份博客，开始建站",
		date: "2025.10",
		category: "milestone",
		subtitle: "blog.fqzlr.top",
		description: "把开源模板 fork 回家，拉着番茄喵开始了大改造，博客正式上线。",
		highlights: [
			"注册域名 blog.fqzlr.top 并部署上线",
			"开始记录技术折腾与生活随想",
		],
		tags: ["起点", "Mizuki", "Astro"],
		links: [
			{
				label: "blog.fqzlr.top",
				url: "https://blog.fqzlr.top/",
				icon: "material-symbols:language-rounded",
			},
		],
		icon: "material-symbols:flag-rounded",
		featured: true,
	},
];

/** 获取所有时间线数据列表 */
export function getTimelineList(): TimelineItem[] {
	return timelineData;
}
