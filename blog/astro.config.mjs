import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
// import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import vercelAdapter from '@astrojs/vercel';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://teamchords.com',
  output: 'server',
  server: { host: true, port: 8080 },
  adapter: vercelAdapter(),
  integrations: [mdx(), sitemap()],
});
