import { PUBLIC_SITE_URL } from '../lib/site';

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap-index.xml', PUBLIC_SITE_URL).href}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}