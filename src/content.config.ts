import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * --isolatedDeclarations 要求导出值有可单文件推断的类型，zod schema 的
 * 推断类型无法满足，因此为每个 collection 显式声明输出形状并标注
 * `z.ZodType<Output>`：既过类型门禁，又让 getCollection("posts") 等
 * 的 `data` 保持强类型。
 */
export interface PostsSchemaOutput {
	title: string;
	published: Date;
	publishedAt?: Date;
	updated?: Date;
	updatedAt?: Date;
	pinned: boolean;
	draft: boolean;
	comment: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string | null;
	lang: string;

	/* Post Encryption */
	encrypted: boolean;
	password?: string;
	passwordHint: string;
	hideHomeContent: boolean;

	/* Post alias & custom permalink */
	alias?: string;
	permalink?: string;

	/* For internal use */
	prevUrl?: string;
	nextUrl?: string;
	prevTitle: string;
	prevSlug: string;
	nextTitle: string;
	nextSlug: string;
}

export interface MomentsSchemaOutput {
	published: Date;
	pinned: boolean;
	location: string;
	/** 心情（Iconify 图标名，如 material-symbols:sentiment-excited-outline-rounded） */
	mood: string;
	tags: string[];
	images: { src: string; alt: string }[];
	draft: boolean;
}

const postsSchema: z.ZodType<PostsSchemaOutput> = z.object({
	title: z.string(),
	published: z.date(),
	publishedAt: z.date().optional(),
	updated: z.date().optional(),
	updatedAt: z.date().optional(),
	pinned: z.boolean().optional().default(false),
	draft: z.boolean().optional().default(false),
	comment: z.boolean().optional().default(true),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),
	lang: z.string().optional().default(""),

	/* Post Encryption */
	encrypted: z.boolean().optional().default(false),
	password: z
		.union([z.string(), z.number()])
		.transform((v) => String(v))
		.optional(),
	passwordHint: z.string().optional().default(""),
	hideHomeContent: z.boolean().optional().default(true),

	/* Post alias & custom permalink */
	alias: z.string().optional(),
	permalink: z.string().optional(),

	/* For internal use */
	prevUrl: z.string().optional(),
	nextUrl: z.string().optional(),
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});

const specSchema: z.ZodType<Record<string, never>> = z.object({});

const momentsSchema: z.ZodType<MomentsSchemaOutput> = z.object({
	published: z.date(),
	pinned: z.boolean().optional().default(false),
	location: z.string().optional().default(""),
	/** 心情（Iconify 图标名，如 material-symbols:sentiment-excited-outline-rounded） */
	mood: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	images: z
		.array(
			z.object({
				src: z.string(),
				alt: z.string().optional().default(""),
			}),
		)
		.optional()
		.default([]),
	draft: z.boolean().optional().default(false),
});

type PostCollection = ReturnType<
	typeof defineCollection<z.ZodType<PostsSchemaOutput>>
>;
type SpecCollection = ReturnType<
	typeof defineCollection<z.ZodType<Record<string, never>>>
>;
type MomentsCollection = ReturnType<
	typeof defineCollection<z.ZodType<MomentsSchemaOutput>>
>;

const postsCollection: PostCollection = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	schema: postsSchema,
});

const specCollection: SpecCollection = defineCollection({
	loader: glob({ base: "./src/content/spec", pattern: "**/*.{md,mdx}" }),
	schema: specSchema,
});

const momentsCollection: MomentsCollection = defineCollection({
	loader: glob({ base: "./src/content/moments", pattern: "**/*.md" }),
	schema: momentsSchema,
});

export const collections: {
	posts: PostCollection;
	spec: SpecCollection;
	moments: MomentsCollection;
} = {
	posts: postsCollection,
	spec: specCollection,
	moments: momentsCollection,
};
