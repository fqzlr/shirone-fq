import type { AnnouncementConfig } from "@/types/announcementConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 公告栏配置
 * 组件显示由 sidebarConfig 统一控制
 */
export const announcementConfig: AnnouncementConfig = withUserConfig(
	"announcement",
	{
		title: "", // 公告标题，填空使用 i18n 字符串 Key.announcement
		content: "The only way to do great work is to love what you do", // 公告内容
		closable: true, // 允许用户关闭公告
		link: {
			enable: true, // 启用链接
			text: "GitHub", // 链接文本
			url: "https://github.com", // 链接 URL
			external: true, // 外部链接
		},
		// 公告板（FAB 弹窗列表）：enable: false 或 items 为空时不渲染按钮与弹窗（零额外负担）
		board: {
			enable: false,
			items: [],
		},
	},
);
