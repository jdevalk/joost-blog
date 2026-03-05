import { IDS } from '../constants';
import type { SchemaPageContext } from '../types';

function getWebPageType(pageType: SchemaPageContext['pageType']): string {
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

export function buildWebPagePiece(ctx: SchemaPageContext): Record<string, unknown> {
    const piece: Record<string, unknown> = {
        '@type': getWebPageType(ctx.pageType),
        '@id': IDS.webPage(ctx.canonicalUrl),
        url: ctx.canonicalUrl,
        name: ctx.title,
        isPartOf: { '@id': IDS.website },
        breadcrumb: { '@id': IDS.breadcrumb(ctx.canonicalUrl) },
        inLanguage: 'en-US',
        potentialAction: [{ '@type': 'ReadAction', target: [ctx.canonicalUrl] }]
    };

    if (ctx.publishDate) {
        piece.datePublished = ctx.publishDate.toISOString();
    }
    if (ctx.updatedDate) {
        piece.dateModified = ctx.updatedDate.toISOString();
    }

    if (ctx.pageType === 'blogPost' && ctx.featureImageUrl) {
        piece.primaryImageOfPage = { '@id': IDS.primaryImage(ctx.canonicalUrl) };
    }

    if (ctx.pageType === 'about' || ctx.pageType === 'homepage') {
        piece.about = { '@id': IDS.person };
    }

    return piece;
}
