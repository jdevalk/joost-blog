import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts } from '../utils/post-utils';

export const GET: APIRoute = async () => {
    const posts = getPublishedPosts(await getCollection('blog'));
    const recent = posts.slice(0, 10);

    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');

    const body = [
        '---',
        'title: joost.blog',
        'description: Personal blog by Joost de Valk about SEO, WordPress, the open web, AI, and building things.',
        'canonical: https://joost.blog/',
        '---',
        '',
        '# joost.blog',
        '',
        'Personal blog by Joost de Valk. I write about SEO, WordPress, the open web, AI, and building things.',
        '',
        '## Recent articles',
        '',
        ...recent.map(p => `- [${stripHtml(p.data.title)}](/${p.id}/)`),
        '',
        `[Full archive](/blog/) — ${posts.length} articles total`,
    ].join('\n');

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
