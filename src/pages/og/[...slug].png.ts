import type { APIContext, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../utils/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog');
    const pages = await getCollection('pages');

    const blogPaths = posts.map((post) => {
        // Resolve featured image filesystem path from ImageMetadata
        let imagePath: string | undefined;
        if (post.data.featureImage?.src) {
            const src = post.data.featureImage.src;
            // Astro ImageMetadata has fsPath property at build time
            if (typeof src === 'object' && 'fsPath' in src) {
                imagePath = (src as { fsPath: string }).fsPath;
            }
        }

        return {
            params: { slug: post.id },
            props: { title: post.data.title, imagePath }
        };
    });

    const pagePaths = pages.map((page) => {
        let imagePath: string | undefined;
        if (page.data.featureImage?.src) {
            const src = page.data.featureImage.src;
            if (typeof src === 'object' && 'fsPath' in src) {
                imagePath = (src as { fsPath: string }).fsPath;
            }
        }
        if (page.id === 'about-me' && !imagePath) {
            imagePath = process.cwd() + '/src/content/pages/images/cropped-joost-de-valk-profile-picture-web.jpg';
        }

        return {
            params: { slug: page.id },
            props: { title: page.data.title, imagePath }
        };
    });

    return [...blogPaths, ...pagePaths];
};

export async function GET({ props }: APIContext) {
    const { title, imagePath } = props as { title: string; imagePath?: string };
    const png = await generateOgImage(title, imagePath);

    return new Response(png, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}
