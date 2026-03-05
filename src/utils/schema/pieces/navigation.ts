import { SITE_URL, IDS } from '../constants';
import siteConfig from '../../../data/site-config';

export function buildSiteNavigationElementPiece(): Record<string, unknown> {
    const navItems = (siteConfig.primaryNavLinks ?? []).map((link) => ({
        '@type': 'SiteNavigationElement',
        name: link.text,
        url: `${SITE_URL}${link.href}/`
    }));

    return {
        '@type': 'SiteNavigationElement',
        '@id': IDS.navigation,
        name: 'Main navigation',
        hasPart: navItems
    };
}
