import { SITE_URL, IDS } from '../constants';
import { slugify } from '../../post-utils';
import type { SchemaPageContext } from '../types';

interface BreadcrumbItem {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
}

function crumb(position: number, name: string, url: string): BreadcrumbItem {
    return { '@type': 'ListItem', position, name, item: url };
}

export function buildBreadcrumbPiece(ctx: SchemaPageContext): Record<string, unknown> {
    const items: BreadcrumbItem[] = [];
    const home = crumb(1, 'Home', `${SITE_URL}/`);

    switch (ctx.pageType) {
        case 'homepage':
            items.push(home);
            break;

        case 'blogListing':
            items.push(home);
            items.push(crumb(2, 'Blog', `${SITE_URL}/blog/`));
            break;

        case 'videoListing':
            items.push(home);
            items.push(crumb(2, 'Videos', `${SITE_URL}/videos/`));
            break;

        case 'category': {
            items.push(home);
            items.push(crumb(2, 'Blog', `${SITE_URL}/blog/`));
            const catName = ctx.categoryName ?? ctx.categories?.[0] ?? 'Category';
            items.push(crumb(3, catName, ctx.canonicalUrl));
            break;
        }

        case 'blogPost': {
            items.push(home);
            items.push(crumb(2, 'Blog', `${SITE_URL}/blog/`));
            let pos = 3;
            if (ctx.categories && ctx.categories.length > 0) {
                const cat = ctx.categories[0];
                items.push(crumb(pos, cat, `${SITE_URL}/blog/category/${slugify(cat)}/`));
                pos++;
            }
            items.push(crumb(pos, ctx.title, ctx.canonicalUrl));
            break;
        }

        case 'video':
            items.push(home);
            items.push(crumb(2, 'Videos', `${SITE_URL}/videos/`));
            items.push(crumb(3, ctx.title, ctx.canonicalUrl));
            break;

        case 'about':
        case 'page':
        default:
            items.push(home);
            items.push(crumb(2, ctx.title, ctx.canonicalUrl));
            break;
    }

    return {
        '@type': 'BreadcrumbList',
        '@id': IDS.breadcrumb(ctx.canonicalUrl),
        itemListElement: items
    };
}
