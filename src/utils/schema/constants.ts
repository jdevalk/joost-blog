export const SITE_URL = 'https://joost.blog';

/**
 * Build a canonical URL using the production SITE_URL,
 * regardless of what Astro.site is set to (e.g. staging).
 */
export function canonicalUrl(pathname: string): string {
    return `${SITE_URL}${pathname.startsWith('/') ? '' : '/'}${pathname}`.replace(/\/?$/, '/');
}
