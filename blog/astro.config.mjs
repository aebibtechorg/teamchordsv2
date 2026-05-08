import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  site: process.env.BLOG_SITE_URL || 'https://teamchords-blog.web.app',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx()],
});
