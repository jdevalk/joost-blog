import type { APIRoute } from 'astro';
import { SITE_URL } from '../utils/schema/constants';
import { aggregateBlogPosts, aggregateVideos, aggregatePages } from '../utils/schema/aggregator';

export const GET: APIRoute = async () => {
    const [posts, videos, pages] = await Promise.all([
        aggregateBlogPosts(),
        aggregateVideos(),
        aggregatePages()
    ]);

    const entries = [
        { loc: `${SITE_URL}/schema/post.json`, lastmod: posts.lastModified, count: posts.count },
        { loc: `${SITE_URL}/schema/video.json`, lastmod: videos.lastModified, count: videos.count },
        { loc: `${SITE_URL}/schema/page.json`, lastmod: pages.lastModified, count: pages.count }
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (e) => `  <url contentType="structuredData/schema.org">
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=300'
        }
    });
};
