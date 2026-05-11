import { getBlogPosts } from '../lib/posts';
import { PUBLIC_SITE_URL, SITE_DESCRIPTION, SITE_NAME } from '../lib/site';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET() {
  const posts = await getBlogPosts();
  const lastBuildDate = posts[0]?.updatedDate ?? posts[0]?.pubDate ?? new Date();
  const items = posts
    .map((post) => {
      const url = new URL(`/stories/${post.slug}`, PUBLIC_SITE_URL).href;

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${post.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${SITE_NAME} Stories`)}</title>
    <link>${PUBLIC_SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}