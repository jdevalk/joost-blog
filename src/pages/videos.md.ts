import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
    const videos = await getCollection('videos');
    const sorted = videos.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());

    const body = [
        '---',
        'title: Videos',
        'description: Talks, interviews, podcasts, and panels with Joost de Valk.',
        'canonical: https://joost.blog/videos/',
        '---',
        '',
        '# Videos',
        '',
        'Talks, interviews, podcasts, and panels with Joost de Valk.',
        '',
        ...sorted.map((v) => {
            const year = new Date(v.data.publishDate).getFullYear();
            return `- [${v.data.title}](/videos/${v.id}/) — ${year}`;
        })
    ].join('\n');

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
