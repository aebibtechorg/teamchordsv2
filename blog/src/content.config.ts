import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(20),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};