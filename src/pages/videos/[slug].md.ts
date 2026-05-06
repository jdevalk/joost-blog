import { createMarkdownEndpoint } from '@jdevalk/astro-seo-graph';
import { getCollection, type CollectionEntry } from 'astro:content';
import { canonicalUrl } from '../../utils/schema/constants';

type Entry = CollectionEntry<'videos'>;

export async function getStaticPaths() {
    const videos = await getCollection('videos');
    return videos.map((entry) => ({ params: { slug: entry.id } }));
}

export const GET = createMarkdownEndpoint<Entry>({
    entries: async () => getCollection('videos'),
    mapper: (entry, slug) => {
        if (entry.id !== slug) return null;
        const data = entry.data;
        const body = (entry.body ?? '')
            .replace(/^import .+$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        const watchUrl = data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : (data.videoUrl ?? undefined);
        return {
            frontmatter: {
                title: data.title,
                canonical: canonicalUrl(`/videos/${entry.id}`),
                pubDate: data.publishDate,
                description: data.seo?.description,
                type: data.type,
                watchUrl
            },
            body
        };
    }
});
