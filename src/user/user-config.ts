/**
 * 用户配置覆盖层（由 `pnpm content:sync` 生成，请勿手工编辑）。
 *
 * 内容来自内容仓的以下文件，改配置请改那边：
 * - config/site.yaml
 * - config/profile.yaml
 *
 * 每个领域的类型标注让 `tsc` 直接校验用户配置：拼错的键、越界的枚举、填错的类型
 * 都会在这里报错，错误信息里的行号可以对回上面的 YAML 文件。
 */

import type { ProfileConfig, SiteConfig } from "@/types/config";

/**
 * 用户只需要写想改的键，因此每个领域都按「深度可选」校验。
 *
 * 数组保持原类型不放宽：清单类配置（侧栏 widget、社交链接）的覆盖语义是整体替换，
 * 半个元素没有意义，而且保留完整类型才能让判别联合的 `type` 字段继续生效。
 */
type DeepPartial<T> = T extends readonly unknown[]
	? T
	: T extends object
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: T;

// config/site.yaml
const site: DeepPartial<SiteConfig> = {
	site: "https://blog.fqzlr.top/",
	base: "/",
	title: "Fqzlr的博客",
	subtitle: "Fqzlr",
	lang: "zh_CN",
	timeZone: "Asia/Shanghai",
	themeColor: {
		hue: 165,
	},
};

// config/profile.yaml
const profile: DeepPartial<ProfileConfig> = {
	avatar: "https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640",
	name: "Fqzlr",
	bio: "躬身入局，心为主理，行有尺度，自持本心.",
	links: [
		{
			name: "QQ群",
			icon: "simple-icons:tencentqq",
			url: "https://qm.qq.com/q/wrmF4FI9pu",
		},
		{
			name: "Bilibili",
			icon: "simple-icons:bilibili",
			url: "https://space.bilibili.com/2017273493",
		},
		{
			name: "GitHub",
			icon: "simple-icons:github",
			url: "https://github.com/fqzlr",
		},
		{
			name: "Email",
			icon: "material-symbols:mail-outline",
			url: "mailto:fqzlr@outlook.com",
		},
		{
			name: "RSS",
			icon: "material-symbols:rss-feed",
			url: "/rss.xml",
		},
	],
};

/** 领域名 -> 该领域的用户覆盖值（仅包含用户显式声明的键）。 */
export const userConfigOverrides: Readonly<Record<string, unknown>> = {
	site,
	profile,
};

/** 本次生成消费了内容仓中的哪些文件，用于溯源与错误提示。 */
export const userConfigSources: readonly string[] = [
	"config/site.yaml",
	"config/profile.yaml",
];
