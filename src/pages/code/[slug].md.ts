import { createMarkdownEndpoint } from '@jdevalk/astro-seo-graph';
import { getCollection, type CollectionEntry } from 'astro:content';
import { canonicalUrl } from '../../utils/schema/constants';

type Entry = CollectionEntry<'pages'>;

export async function getStaticPaths() {
    const pages = await getCollection('pages');
    return pages.filter((page) => page.data.section === 'code').map((page) => ({ params: { slug: page.id } }));
}

export const GET = createMarkdownEndpoint<Entry>({
    entries: async () => {
        const pages = await getCollection('pages');
        return pages.filter((p) => p.data.section === 'code');
    },
    mapper: (entry, slug) => {
        if (entry.id !== slug) return null;
        if (!entry.body) return null;
        const data = entry.data as { title?: string; seo?: { description?: string }; publishDate?: Date; updatedDate?: Date };
        const body = (entry.body ?? '')
            .replace(/^import .+$/gm, '')
            .replace(/<Aside>([\s\S]*?)<\/Aside>/g, (_, c: string) => `\n> **Aside:** ${c.trim()}\n`)
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return {
            frontmatter: {
                title: data.title?.replace(/<[^>]+>/g, '') ?? entry.id,
                canonical: canonicalUrl(`/code/${entry.id}`),
                pubDate: data.publishDate,
                updatedDate: data.updatedDate,
                description: data.seo?.description
            },
            body
        };
    }
});
