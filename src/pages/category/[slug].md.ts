import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { getPublishedPosts, slugify, sortPostsByDateDesc } from '../../utils/post-utils';

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');

export async function getStaticPaths() {
    const allPosts = getPublishedPosts(await getCollection('blog'));
    const categoryMap = new Map<string, { name: string; posts: CollectionEntry<'blog'>[] }>();

    for (const post of allPosts) {
        for (const category of post.data.categories ?? []) {
            const slug = slugify(category);
            if (!categoryMap.has(slug)) {
                categoryMap.set(slug, { name: category, posts: [] });
            }
            categoryMap.get(slug)!.posts.push(post);
        }
    }

    return Array.from(categoryMap.entries()).map(([slug, { name, posts }]) => ({
        params: { slug },
        props: { categoryName: name, posts: posts.sort(sortPostsByDateDesc) }
    }));
}

export const GET: APIRoute = async ({ props }) => {
    const { categoryName, posts } = props as { categoryName: string; posts: CollectionEntry<'blog'>[] };
    const slug = slugify(categoryName);

    const body = [
        '---',
        `title: Category: ${categoryName}`,
        `description: Articles by Joost de Valk in the ${categoryName} category.`,
        `canonical: https://joost.blog/category/${slug}/`,
        '---',
        '',
        `# Category: ${categoryName}`,
        '',
        `${posts.length} article${posts.length === 1 ? '' : 's'} in this category.`,
        '',
        ...posts.map((p) => {
            const date = new Date(p.data.publishDate).toISOString().slice(0, 10);
            return `- ${date} — [${stripHtml(p.data.title)}](/${p.id}/)`;
        })
    ].join('\n');

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
