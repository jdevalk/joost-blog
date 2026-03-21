import type { APIContext, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateOgImage } from '../../utils/og-image';

function findFeatureImage(dir: string): string | undefined {
    const imagesDir = join(dir, 'images');
    if (!existsSync(imagesDir)) return undefined;
    const files = readdirSync(imagesDir);
    // Look for featured.* or any image file
    const featured = files.find(f => f.startsWith('featured.'));
    if (featured) return join(imagesDir, featured);
    const image = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    return image ? join(imagesDir, image) : undefined;
}

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog');
    const pages = await getCollection('pages');
    const blogDir = join(process.cwd(), 'src/content/blog');
    const pagesDir = join(process.cwd(), 'src/content/pages');

    const blogPaths = posts.map((post) => {
        const imagePath = post.data.featureImage ? findFeatureImage(join(blogDir, post.id)) : undefined;

        return {
            params: { slug: post.id },
            props: { title: post.data.title, imagePath }
        };
    });

    const pagePaths = pages.map((page) => {
        let imagePath = page.data.featureImage ? findFeatureImage(join(pagesDir, page.id)) : undefined;
        if (page.id === 'about-me' && !imagePath) {
            imagePath = join(pagesDir, 'images/cropped-joost-de-valk-profile-picture-web.jpg');
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
    const jpg = await generateOgImage(title, imagePath);

    return new Response(jpg, {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}
