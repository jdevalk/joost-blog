import {
    buildArticle,
    buildBreadcrumbList,
    buildImageObject,
    buildOrganization,
    buildPerson,
    buildSiteNavigationElement,
    buildVideoObject,
    buildWebPage,
    buildWebSite,
    makeIds,
    type BreadcrumbItem,
    type WebPageType,
} from '@jdevalk/seo-graph-core';

import siteConfig from '../../data/site-config';
import { slugify } from '../post-utils';
import { SITE_URL } from './constants';
import { organizationInputs } from './organization-data';
import { familyMembers, getCountryNl, getJoostPersonData } from './person-data';
import type { SchemaPageContext } from './types';

export type { SchemaPageContext } from './types';
export { buildSchemaGraph };

/**
 * IdFactory for joost.blog. The Person lives at `/about-me/` (not the
 * site root), which is what joost.blog has always done.
 */
export const ids = makeIds({
    siteUrl: SITE_URL,
    personUrl: `${SITE_URL}/about-me/`,
});

function buildJoostWebSite(): Record<string, unknown> {
    return buildWebSite(
        {
            url: `${SITE_URL}/`,
            name: 'Joost.blog',
            description:
                'Joost de Valk - internet entrepreneur, founder of Yoast, investor at Emilia Capital',
            publisher: { '@id': ids.person },
            hasPart: { '@id': ids.navigation },
        },
        ids,
    );
}

function buildJoostPerson(): Record<string, unknown> {
    return buildPerson(getJoostPersonData(ids), ids);
}

function buildJoostPersonImage(): Record<string, unknown> {
    return buildImageObject(
        {
            id: ids.personImage,
            url: `${SITE_URL}/images/joost-profile.jpg`,
            width: 400,
            height: 400,
            caption: 'Joost de Valk',
        },
        ids,
    );
}

function buildJoostNavigation(): Record<string, unknown> {
    return buildSiteNavigationElement(
        {
            name: 'Main navigation',
            isPartOf: { '@id': ids.website },
            items: (siteConfig.primaryNavLinks ?? []).map((link) => ({
                name: link.text,
                url: `${SITE_URL}${link.href}/`,
            })),
        },
        ids,
    );
}

/**
 * Compute the breadcrumb item list for a given page context. This is
 * joost.blog's routing convention expressed as data; core just wraps it
 * in a `BreadcrumbList` entity.
 */
function buildBreadcrumbItems(ctx: SchemaPageContext): BreadcrumbItem[] {
    const home: BreadcrumbItem = { name: 'Home', url: `${SITE_URL}/` };

    switch (ctx.pageType) {
        case 'homepage':
            return [home];

        case 'blogListing':
            return [home, { name: 'Blog', url: `${SITE_URL}/blog/` }];

        case 'videoListing':
            return [home, { name: 'Videos', url: `${SITE_URL}/videos/` }];

        case 'category': {
            const catName = ctx.categoryName ?? ctx.categories?.[0] ?? 'Category';
            return [
                home,
                { name: 'Blog', url: `${SITE_URL}/blog/` },
                { name: catName, url: ctx.canonicalUrl },
            ];
        }

        case 'blogPost': {
            const items: BreadcrumbItem[] = [home, { name: 'Blog', url: `${SITE_URL}/blog/` }];
            if (ctx.categories && ctx.categories.length > 0) {
                const cat = ctx.categories[0];
                items.push({
                    name: cat,
                    url: `${SITE_URL}/blog/category/${slugify(cat)}/`,
                });
            }
            items.push({ name: ctx.title, url: ctx.canonicalUrl });
            return items;
        }

        case 'video':
            return [
                home,
                { name: 'Videos', url: `${SITE_URL}/videos/` },
                { name: ctx.title, url: ctx.canonicalUrl },
            ];

        case 'about':
        case 'page':
        default:
            return [home, { name: ctx.title, url: ctx.canonicalUrl }];
    }
}

/**
 * Map joost.blog's page type enum onto the schema.org WebPage subtype.
 * Preserves the existing dispatch exactly — in particular, `videoListing`
 * and `video` stay on `WebPage`, not `CollectionPage`.
 */
function getWebPageType(pageType: SchemaPageContext['pageType']): WebPageType {
    switch (pageType) {
        case 'about':
            return 'ProfilePage';
        case 'homepage':
        case 'blogListing':
        case 'category':
            return 'CollectionPage';
        case 'videoListing':
        case 'video':
        case 'blogPost':
        case 'page':
        default:
            return 'WebPage';
    }
}

function buildJoostWebPage(ctx: SchemaPageContext): Record<string, unknown> {
    const isBlogPostWithImage = ctx.pageType === 'blogPost' && ctx.featureImageUrl !== undefined;
    const isAboutOrHomepage = ctx.pageType === 'about' || ctx.pageType === 'homepage';

    return buildWebPage(
        {
            url: ctx.canonicalUrl,
            name: ctx.title,
            isPartOf: { '@id': ids.website },
            breadcrumb: { '@id': ids.breadcrumb(ctx.canonicalUrl) },
            datePublished: ctx.publishDate,
            dateModified: ctx.updatedDate,
            primaryImage: isBlogPostWithImage
                ? { '@id': ids.primaryImage(ctx.canonicalUrl) }
                : undefined,
            about: isAboutOrHomepage ? { '@id': ids.person } : undefined,
        },
        ids,
        getWebPageType(ctx.pageType),
    );
}

function buildJoostArticle(ctx: SchemaPageContext): Record<string, unknown> {
    if (!ctx.publishDate) {
        throw new Error('buildJoostArticle: blogPost context requires publishDate');
    }
    return buildArticle(
        {
            url: ctx.canonicalUrl,
            isPartOf: { '@id': ids.webPage(ctx.canonicalUrl) },
            author: { name: 'Joost de Valk', '@id': ids.person },
            publisher: { '@id': ids.person },
            headline: ctx.title,
            description: ctx.description,
            datePublished: ctx.publishDate,
            dateModified: ctx.updatedDate,
            image:
                ctx.featureImageUrl !== undefined
                    ? { '@id': ids.primaryImage(ctx.canonicalUrl) }
                    : undefined,
            articleSection: ctx.categories?.[0],
            wordCount: ctx.wordCount,
        },
        ids,
    );
}

function buildJoostVideo(ctx: SchemaPageContext): Record<string, unknown> {
    return buildVideoObject(
        {
            url: ctx.canonicalUrl,
            name: ctx.title,
            description: ctx.description,
            isPartOf: { '@id': ids.webPage(ctx.canonicalUrl) },
            youtubeId: ctx.youtubeId,
            uploadDate: ctx.publishDate,
            duration: ctx.duration,
        },
        ids,
    );
}

function buildJoostPrimaryImage(ctx: SchemaPageContext): Record<string, unknown> {
    if (!ctx.featureImageUrl) {
        throw new Error('buildJoostPrimaryImage: featureImageUrl is required');
    }
    return buildImageObject(
        {
            pageUrl: ctx.canonicalUrl,
            url: ctx.featureImageUrl,
            width: 1200,
            height: 630,
        },
        ids,
    );
}

/**
 * Assemble the schema.org `@graph` for a single page. The piece ordering
 * mirrors the pre-migration implementation exactly so the aggregator's
 * first-wins deduplication produces byte-identical output against the
 * captured fixture at `tests/fixtures/schema-graph/`.
 */
function buildSchemaGraph(ctx: SchemaPageContext): Record<string, unknown> {
    const graph: Record<string, unknown>[] = [];

    // Always included: core entities
    graph.push(buildJoostWebSite());
    graph.push(buildJoostPerson());
    graph.push(buildBreadcrumbList({ url: ctx.canonicalUrl, items: buildBreadcrumbItems(ctx) }, ids));
    graph.push(buildJoostPersonImage());
    graph.push(buildJoostNavigation());

    // Always include referenced entities
    graph.push(getCountryNl(ids));
    for (const orgInput of organizationInputs) {
        graph.push(buildOrganization(orgInput, ids));
    }

    // Page-type specific pieces
    switch (ctx.pageType) {
        case 'blogPost':
            graph.push(buildJoostWebPage(ctx));
            graph.push(buildJoostArticle(ctx));
            if (ctx.featureImageUrl) {
                graph.push(buildJoostPrimaryImage(ctx));
            }
            break;

        case 'video':
            graph.push(buildJoostWebPage(ctx));
            graph.push(buildJoostVideo(ctx));
            break;

        case 'homepage':
            graph.push(buildJoostWebPage(ctx));
            for (const member of familyMembers) {
                graph.push(member);
            }
            break;

        case 'about':
            graph.push(buildJoostWebPage(ctx));
            for (const member of familyMembers) {
                graph.push(member);
            }
            break;

        case 'blogListing':
        case 'category':
        case 'videoListing':
        case 'page':
        default:
            graph.push(buildJoostWebPage(ctx));
            break;
    }

    return {
        '@context': 'https://schema.org',
        '@graph': graph,
    };
}
