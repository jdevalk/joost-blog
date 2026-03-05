import type { SchemaPageContext } from './types';
import { buildPersonPiece } from './pieces/person';
import { buildWebSitePiece } from './pieces/website';
import { buildWebPagePiece } from './pieces/webpage';
import { buildArticlePiece } from './pieces/article';
import { buildVideoObjectPiece } from './pieces/video';
import { buildBreadcrumbPiece } from './pieces/breadcrumb';
import { buildImageObjectPiece, buildPersonImagePiece } from './pieces/image';
import { buildSiteNavigationElementPiece } from './pieces/navigation';
import { countryNl, familyMembers } from './person-data';
import { organizations } from './organization-data';

export type { SchemaPageContext } from './types';
export { buildSchemaGraph };

function buildSchemaGraph(ctx: SchemaPageContext): Record<string, unknown> {
    const graph: Record<string, unknown>[] = [];

    // Always included: core entities
    graph.push(buildWebSitePiece());
    graph.push(buildPersonPiece());
    graph.push(buildBreadcrumbPiece(ctx));
    graph.push(buildPersonImagePiece());
    graph.push(buildSiteNavigationElementPiece());

    // Always include referenced entities
    graph.push(countryNl);
    for (const org of organizations) {
        graph.push(org);
    }

    // Page-type specific pieces
    switch (ctx.pageType) {
        case 'blogPost':
            graph.push(buildWebPagePiece(ctx));
            graph.push(buildArticlePiece(ctx));
            if (ctx.featureImageUrl) {
                graph.push(buildImageObjectPiece(ctx));
            }
            break;

        case 'video':
            graph.push(buildWebPagePiece(ctx));
            graph.push(buildVideoObjectPiece(ctx));
            break;

        case 'homepage':
            graph.push(buildWebPagePiece(ctx));
            for (const member of familyMembers) {
                graph.push(member);
            }
            break;

        case 'about':
            graph.push(buildWebPagePiece(ctx));
            for (const member of familyMembers) {
                graph.push(member);
            }
            break;

        case 'blogListing':
        case 'category':
        case 'videoListing':
        case 'page':
        default:
            graph.push(buildWebPagePiece(ctx));
            break;
    }

    return {
        '@context': 'https://schema.org',
        '@graph': graph
    };
}
