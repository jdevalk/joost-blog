import { SITE_URL, IDS } from '../constants';
import type { SchemaPageContext } from '../types';

export function buildImageObjectPiece(ctx: SchemaPageContext): Record<string, unknown> {
    return {
        '@type': 'ImageObject',
        '@id': IDS.primaryImage(ctx.canonicalUrl),
        url: ctx.featureImageUrl,
        contentUrl: ctx.featureImageUrl,
        inLanguage: 'en-US'
    };
}

export function buildPersonImagePiece(): Record<string, unknown> {
    return {
        '@type': 'ImageObject',
        '@id': IDS.personImage,
        url: `${SITE_URL}/images/joost-profile.jpg`,
        contentUrl: `${SITE_URL}/images/joost-profile.jpg`,
        caption: 'Joost de Valk',
        inLanguage: 'en-US'
    };
}
