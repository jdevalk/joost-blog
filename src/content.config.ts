import { glob } from 'astro/loaders';
import { defineCollection, z, type ImageFunction } from 'astro:content';

const imageSchema = (image: ImageFunction) =>
    z.object({
        src: image(),
        alt: z.string().optional()
    });

const seoSchema = (image: ImageFunction) =>
    z.object({
        title: z.string().min(5).max(120).optional(),
        description: z.string().min(15).max(160).optional(),
        image: imageSchema(image).optional(),
        pageType: z.enum(['website', 'article']).default('website')
    });

const blog = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            excerpt: z.string().optional(),
            publishDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            featureImage: image().optional(),
            featureImageAlt: z.string().optional(),
            featureImageCaption: z.string().optional(),
            imageHint: z.string().optional(),
            categories: z.array(z.string()).optional(),
            isFeatured: z.boolean().default(false),
            draft: z.boolean().default(false),
            toc: z.boolean().default(false),
            password: z.string().optional(),
            seo: seoSchema(image).optional()
        })
});

const pages = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            section: z.string().optional(),
            toc: z.boolean().default(false),
            featureImage: image().optional(),
            featureImageAlt: z.string().optional(),
            featureImageCaption: z.string().optional(),
            seo: seoSchema(image).optional()
        })
});

const videos = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videos' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            publishDate: z.coerce.date(),
            youtubeId: z.string().optional(),
            duration: z.string().optional(),
            videoUrl: z.string().url().optional(),
            videoPressId: z.string().optional(),
            featured: z.boolean().default(false),
            thumbnailUrl: z.string().url().optional(),
            featureImage: image().optional(),
            featureImageAlt: z.string().optional(),
            featureImageCaption: z.string().optional(),
            seo: seoSchema(image).optional(),
            type: z.enum(['keynote', 'talk', 'podcast', 'interview', 'panel']).optional(),
            with: z.union([z.string(), z.array(z.string())]).optional()
        })
});

export const collections = { blog, pages, videos };
