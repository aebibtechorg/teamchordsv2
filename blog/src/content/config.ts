import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().min(20),
    pubDate: z.coerce.date(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
