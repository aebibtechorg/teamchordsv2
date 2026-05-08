import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: process.env.BLOG_SITE_URL || 'https://teamchords-blog.web.app',
  output: 'static',
  integrations: [mdx()],
});
