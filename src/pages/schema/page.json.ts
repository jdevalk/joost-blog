import type { APIRoute } from 'astro';
import { aggregatePages } from '../../utils/schema/aggregator';

export const GET: APIRoute = async () => {
    const { entities } = await aggregatePages();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': entities
    };

    return new Response(JSON.stringify(jsonLd, null, 2), {
        headers: {
            'Content-Type': 'application/ld+json',
            'Cache-Control': 'max-age=300'
        }
    });
};
