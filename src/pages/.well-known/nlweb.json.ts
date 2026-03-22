import type { APIRoute } from 'astro';
import { SITE_URL } from '../../utils/schema/constants';
import siteConfig from '../../data/site-config';

export const GET: APIRoute = async ({ url }) => {
    const baseUrl = import.meta.env.DEV
        ? `${url.protocol}//${url.host}`
        : SITE_URL;

    const manifest = {
        name: siteConfig.title,
        description: siteConfig.description,
        url: baseUrl,
        endpoints: {
            ask: {
                url: `${baseUrl}/ask`,
                methods: ['GET', 'POST'],
                modes: ['list', 'summarize', 'generate'],
                description: 'NLWeb-compatible natural language query endpoint with hybrid keyword + semantic search and LLM-powered answers.',
            },
        },
        schema: {
            schemamap: `${baseUrl}/schemamap.xml`,
            posts: `${baseUrl}/schema/post.json`,
            videos: `${baseUrl}/schema/video.json`,
            pages: `${baseUrl}/schema/page.json`,
        },
        feeds: {
            rss: `${baseUrl}/feed.xml`,
            sitemap: `${baseUrl}/sitemap-index.xml`,
        },
        navigation: siteConfig.primaryNavLinks.map((link: { text: string; href: string }) => ({
            name: link.text,
            url: `${baseUrl}${link.href}`,
        })),
    };

    return new Response(JSON.stringify(manifest, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=3600',
        },
    });
};
