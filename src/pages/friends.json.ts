import type { APIRoute } from "astro";
import { isPageAvailable } from "@/utils/page-availability";
import { getFriendsList } from "../data/friends";

/**
 * 友链清单 JSON 端点，供 check-flink（SOURCE_URL）定时拉取检测：
 * https://github.com/fqzlr/check-flink
 *
 * 字段契约（check-flink 期望）：
 * - link_list[].name/link/avatar/descr：站点基本信息；
 * - siteshot：留空，由 check-flink 截图任务填充；
 * - linkpage：对方友链页地址（FriendItem.linkpage），用于反链检测，缺省为空串。
 * 构建期静态生成；友链页被 siteConfig.pages 关闭时返回 404。
 */
export const GET: APIRoute = () => {
	if (!isPageAvailable("friends")) {
		return new Response(null, { status: 404 });
	}

	const link_list = getFriendsList().map((friend) => ({
		name: friend.title,
		link: friend.siteurl,
		avatar: friend.imgurl,
		descr: friend.desc,
		siteshot: "",
		linkpage: friend.linkpage ?? "",
	}));

	return new Response(JSON.stringify({ link_list, length: link_list.length }), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
