import { IDS } from '../constants';
import type { SchemaPageContext } from '../types';

export function buildArticlePiece(ctx: SchemaPageContext): Record<string, unknown> {
    const piece: Record<string, unknown> = {
        '@type': 'Article',
        '@id': IDS.article(ctx.canonicalUrl),
        isPartOf: { '@id': IDS.webPage(ctx.canonicalUrl) },
        author: { name: 'Joost de Valk', '@id': IDS.person },
        headline: ctx.title,
        mainEntityOfPage: { '@id': IDS.webPage(ctx.canonicalUrl) },
        publisher: { '@id': IDS.person },
        inLanguage: 'en-US',
        description: ctx.description
    };

    if (ctx.publishDate) {
        piece.datePublished = ctx.publishDate.toISOString();
    }
    if (ctx.updatedDate) {
        piece.dateModified = ctx.updatedDate.toISOString();
    }
    if (ctx.featureImageUrl) {
        piece.image = { '@id': IDS.primaryImage(ctx.canonicalUrl) };
    }
    if (ctx.categories && ctx.categories.length > 0) {
        piece.articleSection = ctx.categories[0];
    }
    if (ctx.wordCount) {
        piece.wordCount = ctx.wordCount;
    }

    return piece;
}
