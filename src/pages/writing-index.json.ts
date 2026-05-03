import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts } from '../utils/post-utils';

export const GET: APIRoute = async () => {
    const posts = getPublishedPosts(await getCollection('blog'));

    const items = posts.map((post) => ({
        url: `/${post.id}/`,
        title: post.data.title,
        publishDate: post.data.publishDate.toISOString(),
        excerpt: post.data.excerpt ?? post.data.seo?.description ?? '',
        categories: post.data.categories ?? []
    }));

    return new Response(JSON.stringify(items), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'max-age=300'
        }
    });
};
