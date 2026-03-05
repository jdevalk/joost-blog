import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
    const siteUrl = site?.toString().replace(/\/$/, '') ?? 'https://joost.blog';

    return new Response(
        `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap-index.xml
Schemamap: ${siteUrl}/schemamap.xml
`,
        { headers: { 'Content-Type': 'text/plain' } }
    );
};
