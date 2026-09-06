import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Content collection definitions for Shirone, packaged so a user's
 * `src/content.config.ts` stays three lines long:
 *
 * ```ts
 * import { defineCollections } from "shirones/collections";
 * export const collections = defineCollections();
 * ```
 */

export interface DefineCollectionsOptions {
	/**
	 * Directory holding `posts/`, `moments/` and `spec/`, relative to the
	 * project root.
	 * @default "shirones/content"
	 */
	contentDir?: string;
	/** Override individual sub-directories. */
	paths?: {
		posts?: string;
		moments?: string;
		spec?: string;
	};
}

const DEFAULT_CONTENT_DIR = "shirones/content";

function normaliseBase(value: string): string {
	const trimmed = value.replace(/^\.\//, "").replace(/\/+$/, "");
	return `./${trimmed}`;
}

/**
 * The post schema. Kept identical to the source template so content authored
 * against the git-clone workflow works unchanged in package mode.
 */
const postSchemaObject = z.object({
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

	/* Post encryption */
	encrypted: z.boolean().optional().default(false),
	password: z
		.union([z.string(), z.number()])
		.transform((v) => String(v))
		.optional(),
	passwordHint: z.string().optional().default(""),
	hideHomeContent: z.boolean().optional().default(true),

	/* Populated internally by the theme during collection post-processing */
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});
const postSchema: typeof postSchemaObject = postSchemaObject;

/** Schema for the short-form "moments" timeline. */
const momentSchemaObject = z.object({
	published: z.date(),
	pinned: z.boolean().optional().default(false),
	location: z.string().optional().default(""),
	/** Mood icon (Iconify name, e.g. `material-symbols:sentiment-excited-outline-rounded`). */
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
const momentSchema: typeof momentSchemaObject = momentSchemaObject;

/** Schema for free-form spec pages (currently just `about.md`). */
const specSchemaObject = z.object({});
const specSchema: typeof specSchemaObject = specSchemaObject;

/**
 * Build the `collections` export for `src/content.config.ts`.
 */
export function defineCollections(
	options: DefineCollectionsOptions = {},
): Record<"posts" | "spec" | "moments", ReturnType<typeof defineCollection>> {
	const root = normaliseBase(options.contentDir ?? DEFAULT_CONTENT_DIR);

	const postsBase = options.paths?.posts
		? normaliseBase(options.paths.posts)
		: `${root}/posts`;
	const momentsBase = options.paths?.moments
		? normaliseBase(options.paths.moments)
		: `${root}/moments`;
	const specBase = options.paths?.spec
		? normaliseBase(options.paths.spec)
		: `${root}/spec`;

	return {
		posts: defineCollection({
			loader: glob({ base: postsBase, pattern: "**/*.{md,mdx}" }),
			schema: postSchema,
		}),
		spec: defineCollection({
			loader: glob({ base: specBase, pattern: "**/*.{md,mdx}" }),
			schema: specSchema,
		}),
		moments: defineCollection({
			loader: glob({ base: momentsBase, pattern: "**/*.md" }),
			schema: momentSchema,
		}),
	} as const;
}

export default defineCollections;
