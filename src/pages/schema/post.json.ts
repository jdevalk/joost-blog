import type { APIRoute } from 'astro';
import { aggregateBlogPosts } from '../../utils/schema/aggregator';

export const GET: APIRoute = async () => {
    const { entities } = await aggregateBlogPosts();

    return new Response(
        entities.map((e) => JSON.stringify(e)).join('\n'),
        {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=300'
            }
        }
    );
};
