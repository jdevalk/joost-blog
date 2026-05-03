import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
    const catalog = {
        linkset: [
            {
                anchor: 'https://joost.blog/ask',
                'service-doc': [{ href: 'https://joost.blog/ask-joost/' }],
                type: [{ href: 'https://schema.org/SearchAction' }],
            },
            {
                anchor: 'https://joost.blog/schema/post.json',
                'service-doc': [{ href: 'https://joost.blog/seo-graph/' }],
                type: [{ href: 'https://schema.org/BlogPosting' }],
            },
            {
                anchor: 'https://joost.blog/schema/page.json',
                'service-doc': [{ href: 'https://joost.blog/seo-graph/' }],
                type: [{ href: 'https://schema.org/WebPage' }],
            },
            {
                anchor: 'https://joost.blog/schema/video.json',
                'service-doc': [{ href: 'https://joost.blog/seo-graph/' }],
                type: [{ href: 'https://schema.org/VideoObject' }],
            },
            {
                anchor: 'https://joost.blog/schemamap.xml',
                'service-doc': [{ href: 'https://joost.blog/seo-graph/' }],
            },
        ],
    };

    return new Response(JSON.stringify(catalog, null, 2), {
        headers: { 'Content-Type': 'application/linkset+json' },
    });
};
