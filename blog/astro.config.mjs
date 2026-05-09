import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  site: process.env.BLOG_SITE_URL || 'https://teamchords-blog.web.app',
  output: 'server',
  server: { host: true, port: 8080 },
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), tailwind()],
});
