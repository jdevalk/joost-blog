import { SITE_URL, IDS } from '../constants';

export function buildWebSitePiece(): Record<string, unknown> {
    return {
        '@type': 'WebSite',
        '@id': IDS.website,
        url: `${SITE_URL}/`,
        name: 'Joost.blog',
        description: 'Joost de Valk - internet entrepreneur, founder of Yoast, investor at Emilia Capital',
        publisher: { '@id': IDS.person },
        inLanguage: 'en-US',
        hasPart: { '@id': IDS.navigation }
    };
}
