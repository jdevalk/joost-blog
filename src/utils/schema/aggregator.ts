import { getCollection } from 'astro:content';
import { SITE_URL } from './constants';
import { buildSchemaGraph } from './index';
import type { SchemaPageContext } from './types';

const ARTICLE_BODY_MAX_LENGTH = 500;

function stripMarkdown(md: string): string {
    return md
        .replace(/^---[\s\S]*?---\n*/m, '') // frontmatter
        .replace(/!\[.*?\]\(.*?\)/g, '') // images
        .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // links → text
        .replace(/#{1,6}\s+/g, '') // headings
        .replace(/[*_~`>]/g, '') // formatting
        .replace(/\n{2,}/g, '\n')
        .trim();
}

function truncateBody(body: string): string {
    const plain = stripMarkdown(body);
    if (plain.length <= ARTICLE_BODY_MAX_LENGTH) return plain;
    return plain.slice(0, ARTICLE_BODY_MAX_LENGTH).replace(/\s+\S*$/, '') + '…';
}

/**
 * Deduplicate schema entities by @id.
 * When duplicates exist, the first occurrence wins.
 */
function deduplicateEntities(entities: Record<string, unknown>[]): Record<string, unknown>[] {
    const seen = new Set<string>();
    const result: Record<string, unknown>[] = [];
    for (const entity of entities) {
        const id = entity['@id'] as string | undefined;
        if (id) {
            if (seen.has(id)) continue;
            seen.add(id);
        }
        result.push(entity);
    }
    return result;
}

export interface AggregatedSchema {
    entities: Record<string, unknown>[];
    lastModified: Date;
    count: number;
}

export async function aggregateBlogPosts(): Promise<AggregatedSchema> {
    const posts = await getCollection('blog');
    const allEntities: Record<string, unknown>[] = [];
    let lastModified = new Date(0);

    for (const post of posts) {
        const canonicalUrl = `${SITE_URL}/${post.id}/`;
        const ctx: SchemaPageContext = {
            pageType: 'blogPost',
            canonicalUrl,
            title: post.data.title,
            description: post.data.excerpt ?? '',
            publishDate: post.data.publishDate,
            updatedDate: post.data.updatedDate,
            featureImageUrl: `${SITE_URL}/og/${post.id}.png`,
            categories: post.data.categories,
            wordCount: (post.body ?? '').split(/\s+/).length
        };

        const schema = buildSchemaGraph(ctx);
        const graph = schema['@graph'] as Record<string, unknown>[];

        // Enrich Article with articleBody
        for (const entity of graph) {
            if (entity['@type'] === 'Article' && post.body) {
                entity.articleBody = truncateBody(post.body);
            }
        }

        allEntities.push(...graph);

        const postDate = post.data.updatedDate ?? post.data.publishDate;
        if (postDate > lastModified) lastModified = postDate;
    }

    return {
        entities: deduplicateEntities(allEntities),
        lastModified,
        count: posts.length
    };
}

export async function aggregateVideos(): Promise<AggregatedSchema> {
    const videos = await getCollection('videos');
    const allEntities: Record<string, unknown>[] = [];
    let lastModified = new Date(0);

    for (const video of videos) {
        const canonicalUrl = `${SITE_URL}/videos/${video.id}/`;
        const ctx: SchemaPageContext = {
            pageType: 'video',
            canonicalUrl,
            title: video.data.title,
            description: '',
            publishDate: video.data.publishDate,
            youtubeId: video.data.youtubeId,
            duration: video.data.duration
        };

        const schema = buildSchemaGraph(ctx);
        allEntities.push(...(schema['@graph'] as Record<string, unknown>[]));

        if (video.data.publishDate > lastModified) lastModified = video.data.publishDate;
    }

    return {
        entities: deduplicateEntities(allEntities),
        lastModified,
        count: videos.length
    };
}

export async function aggregatePages(): Promise<AggregatedSchema> {
    const pages = await getCollection('pages');
    const allEntities: Record<string, unknown>[] = [];
    let lastModified = new Date(0);

    for (const page of pages) {
        const canonicalUrl = `${SITE_URL}/${page.id}/`;
        const ctx: SchemaPageContext = {
            pageType: page.id === 'about-me' ? 'about' : 'page',
            canonicalUrl,
            title: page.data.title,
            description: page.data.seo?.description ?? ''
        };

        const schema = buildSchemaGraph(ctx);
        allEntities.push(...(schema['@graph'] as Record<string, unknown>[]));

        // Pages don't have dates — use current build time
        lastModified = new Date();
    }

    return {
        entities: deduplicateEntities(allEntities),
        lastModified,
        count: pages.length
    };
}
