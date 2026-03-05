import { IDS } from '../constants';
import type { SchemaPageContext } from '../types';

export function buildVideoObjectPiece(ctx: SchemaPageContext): Record<string, unknown> {
    const piece: Record<string, unknown> = {
        '@type': 'VideoObject',
        '@id': IDS.videoObject(ctx.canonicalUrl),
        name: ctx.title,
        description: ctx.description,
        isPartOf: { '@id': IDS.webPage(ctx.canonicalUrl) }
    };

    if (ctx.youtubeId) {
        piece.thumbnailUrl = `https://img.youtube.com/vi/${ctx.youtubeId}/maxresdefault.jpg`;
        piece.embedUrl = `https://www.youtube-nocookie.com/embed/${ctx.youtubeId}`;
    }
    if (ctx.publishDate) {
        piece.uploadDate = ctx.publishDate.toISOString();
    }
    if (ctx.duration) {
        piece.duration = ctx.duration;
    }

    return piece;
}
