import type { APIContext, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateOgImage } from '../../utils/og-image';
import { getReadingTime } from '../../utils/post-utils';

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog');
    const pages = await getCollection('pages');

    // Sort posts by date ascending to assign sequential article numbers
    const sortedPosts = [...posts].sort(
        (a, b) => new Date(a.data.publishDate).getTime() - new Date(b.data.publishDate).getTime()
    );
    const articleNumberMap = new Map(sortedPosts.map((p, i) => [p.id, i + 1]));

    const blogPaths = posts.map((post) => ({
        params: { slug: post.id },
        props: {
            title: post.data.title,
            category: post.data.categories?.[0],
            publishDate: post.data.publishDate,
            readingTime: getReadingTime(post.body ?? ''),
            articleNumber: articleNumberMap.get(post.id),
            isFeatured: post.data.isFeatured,
        },
    }));

    const pagePaths = pages.map((page) => ({
        params: { slug: page.id },
        props: { title: page.data.title },
    }));

    const standalonePaths = [
        { slug: 'ask-joost', title: 'Ask Joost' },
        { slug: 'cms-market-share', title: 'CMS Market Share' },
        { slug: 'cms-usage', title: 'CMS Usage Statistics' },
        { slug: 'contact-me', title: 'Contact' },
        { slug: 'search', title: 'Search' },
        { slug: '404', title: 'Page Not Found' },
    ].map(({ slug, title }) => {
        const pageImagePath = join(process.cwd(), 'public/images/pages', `${slug}.webp`);
        return {
            params: { slug },
            props: {
                title,
                backgroundImagePath: existsSync(pageImagePath) ? pageImagePath : undefined,
            },
        };
    });

    return [...blogPaths, ...pagePaths, ...standalonePaths];
};

export async function GET({ props }: APIContext) {
    const {
        title,
        category,
        publishDate,
        readingTime,
        articleNumber,
        isFeatured,
    } = props as {
        title: string;
        category?: string;
        publishDate?: Date;
        readingTime?: number;
        articleNumber?: number;
        isFeatured?: boolean;
        backgroundImagePath?: string;
    };

    const jpg = await generateOgImage({
        title,
        category,
        publishDate,
        readingTime,
        articleNumber,
        isFeatured,
    });

    return new Response(jpg, {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
