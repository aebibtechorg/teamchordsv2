import { getCollection } from 'astro:content';
import { createClient } from '@sanity/client';
import { marked } from 'marked';

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  tags: string[];
  featured: boolean;
  heroImage: string | null;
  body: string;
};

type SanityBlogPost = {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  author: string;
  tags?: string[];
  featured?: boolean;
  heroImage?: string | null;
  body?: string;
};

const sanityProjectId = import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const sanityDataset = import.meta.env.SANITY_DATASET || process.env.SANITY_DATASET;
const sanityApiVersion = import.meta.env.SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2025-05-08';
const sanityToken = import.meta.env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN;

const hasSanity = Boolean(sanityProjectId && sanityDataset);

const sanityClient = hasSanity
  ? createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      useCdn: !sanityToken,
      token: sanityToken || undefined,
      perspective: sanityToken ? 'previewDrafts' : 'published',
    })
  : null;

const blogPostFields = `{
  "slug": slug.current,
  title,
  description,
  pubDate,
  author,
  tags,
  featured,
  "heroImage": heroImage.asset->url,
  body
}`;

function normalizePost(post: SanityBlogPost): BlogPost {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    pubDate: new Date(post.pubDate),
    author: post.author,
    tags: post.tags ?? [],
    featured: Boolean(post.featured),
    heroImage: post.heroImage || null,
    body: post.body || '',
  };
}

async function getLocalPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    author: post.data.author,
    tags: post.data.tags ?? [],
    featured: Boolean(post.data.featured),
    heroImage: post.data.heroImage ?? null,
    body: post.body,
  }));
}

async function getSanityPosts(): Promise<BlogPost[]> {
  if (!sanityClient) {
    return [];
  }

  const posts = await sanityClient.fetch<SanityBlogPost[]>(`*[_type == "blogPost"] | order(pubDate desc) ${blogPostFields}`);
  return posts.map(normalizePost);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const posts = hasSanity ? await getSanityPosts() : await getLocalPosts();
  return posts.sort((left, right) => right.pubDate.valueOf() - left.pubDate.valueOf());
}

export async function getBlogPostSlugs(): Promise<string[]> {
  return (await getBlogPosts()).map((post) => post.slug);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.featured) ?? posts[0] ?? null;
}

export function renderPostBody(body: string): string {
  return String(marked.parse(body || ''));
}