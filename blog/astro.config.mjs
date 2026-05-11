import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://teamchords.com',
  output: 'server',
  server: { host: true, port: 8080 },
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), sitemap()],
});
