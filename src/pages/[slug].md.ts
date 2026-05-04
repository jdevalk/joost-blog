import { createMarkdownEndpoint } from '@jdevalk/astro-seo-graph';
import { getCollection, type CollectionEntry } from 'astro:content';
import { canonicalUrl } from '../utils/schema/constants';

type Entry = CollectionEntry<'blog'> | CollectionEntry<'pages'>;

export async function getStaticPaths() {
    const [posts, pages] = await Promise.all([getCollection('blog'), getCollection('pages')]);
    const skip = new Set(['videos', 'clicky', 'about-me', 'contact-me', 'contact', 'cms-market-share']);
    const all: Entry[] = [
        ...posts.filter((p) => !p.data.draft),
        ...pages.filter((p) => !skip.has(p.id))
    ];
    return all.map((entry) => ({ params: { slug: entry.id } }));
}

export const GET = createMarkdownEndpoint<Entry>({
    entries: async () => {
        const [posts, pages] = await Promise.all([getCollection('blog'), getCollection('pages')]);
        return [...posts, ...pages];
    },
    mapper: (entry, slug) => {
        if (entry.id !== slug) return null;
        if (!entry.body) return null;
        const data = entry.data as { title?: string; excerpt?: string; publishDate?: Date; updatedDate?: Date; categories?: string[]; tags?: string[]; draft?: boolean };
        if (data.draft) return null;
        const rawBody = entry.body ?? '';
        const body = rawBody
            .replace(/^import .+$/gm, '')
            .replace(/<Aside>([\s\S]*?)<\/Aside>/g, (_, c: string) => `\n> **Aside:** ${c.trim()}\n`)
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return {
            frontmatter: {
                title: data.title ?? entry.id,
                canonical: canonicalUrl(`/${entry.id}`),
                pubDate: data.publishDate,
                updatedDate: data.updatedDate,
                description: data.excerpt,
                categories: data.categories,
                tags: data.tags
            },
            body
        };
    }
});
