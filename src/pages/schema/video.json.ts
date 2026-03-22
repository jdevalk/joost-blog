import type { APIRoute } from 'astro';
import { aggregateVideos } from '../../utils/schema/aggregator';

export const GET: APIRoute = async () => {
    const { entities } = await aggregateVideos();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': entities,
    };

    return new Response(
        JSON.stringify(jsonLd, null, 2),
        {
            headers: {
                'Content-Type': 'application/ld+json',
                'Cache-Control': 'max-age=300'
            }
        }
    );
};
