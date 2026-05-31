import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts, sortPostsByDateDesc } from '../utils/post-utils';

export const GET: APIRoute = async () => {
    const posts = getPublishedPosts(await getCollection('blog')).sort(sortPostsByDateDesc);
    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');

    const body = [
        '---',
        'title: Blog archive',
        'description: All articles by Joost de Valk on SEO, WordPress, the open web, AI, and building things.',
        'canonical: https://joost.blog/blog/',
        '---',
        '',
        '# Blog archive',
        '',
        `${posts.length} articles total, newest first.`,
        '',
        ...posts.map((p) => {
            const date = new Date(p.data.publishDate).toISOString().slice(0, 10);
            return `- ${date} — [${stripHtml(p.data.title)}](/${p.id}/)`;
        })
    ].join('\n');

    return new Response(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            Link: '<https://joost.blog/blog/>; rel="canonical"'
        }
    });
};
