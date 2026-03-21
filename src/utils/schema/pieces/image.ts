import { SITE_URL, IDS } from '../constants';
import type { SchemaPageContext } from '../types';

export function buildImageObjectPiece(ctx: SchemaPageContext): Record<string, unknown> {
    return {
        '@type': 'ImageObject',
        '@id': IDS.primaryImage(ctx.canonicalUrl),
        url: ctx.featureImageUrl,
        contentUrl: ctx.featureImageUrl,
        width: 1200,
        height: 630,
        inLanguage: 'en-US'
    };
}

export function buildPersonImagePiece(): Record<string, unknown> {
    return {
        '@type': 'ImageObject',
        '@id': IDS.personImage,
        url: `${SITE_URL}/images/joost-profile.jpg`,
        contentUrl: `${SITE_URL}/images/joost-profile.jpg`,
        width: 400,
        height: 400,
        caption: 'Joost de Valk',
        inLanguage: 'en-US'
    };
}
