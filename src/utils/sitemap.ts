import { gitLastmod as packageGitLastmod } from '@jdevalk/astro-seo-graph';
import type { AstroIntegration } from 'astro';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BULK_COMMITS = ['52130a9', '989dc47', '53c0235', '6def8ab', 'a3f7e33'];

export function gitLastmod(filePath: string): Date | null {
    return packageGitLastmod(filePath, { excludeCommits: BULK_COMMITS });
}

/**
 * @astrojs/sitemap only supports a single global `lastmod` for the whole
 * sitemap index, so every <sitemap> entry in sitemap-index.xml ends up with
 * the same date. This integration runs after @astrojs/sitemap and rewrites
 * each index entry's <lastmod> to the newest <lastmod> actually present in
 * the child sitemap it points to — giving posts, videos, and pages distinct,
 * accurate dates. Entries whose child sitemap has no per-URL <lastmod> keep
 * the global fallback date untouched.
 */
export function sitemapIndexLastmod(): AstroIntegration {
    return {
        name: 'sitemap-index-lastmod',
        hooks: {
            'astro:build:done': ({ dir, logger }) => {
                const distDir = fileURLToPath(dir);
                const indexPath = join(distDir, 'sitemap-index.xml');
                let indexXml: string;
                try {
                    indexXml = readFileSync(indexPath, 'utf-8');
                } catch {
                    return; // no sitemap index in this build
                }

                let rewritten = 0;
                const updated = indexXml.replace(/<sitemap>([\s\S]*?)<\/sitemap>/g, (block: string, inner: string) => {
                    const loc = inner.match(/<loc>([^<]+)<\/loc>/)?.[1];
                    if (!loc) return block;

                    let childXml: string;
                    try {
                        const childPath = new URL(loc).pathname.replace(/^\//, '');
                        childXml = readFileSync(join(distDir, childPath), 'utf-8');
                    } catch {
                        return block; // referenced file missing — leave entry as-is
                    }

                    const dates = [...childXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => new Date(m[1])).filter((d) => !Number.isNaN(d.getTime()));
                    if (dates.length === 0) return block; // keep global fallback

                    const max = new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString();
                    rewritten++;
                    return /<lastmod>[^<]*<\/lastmod>/.test(inner)
                        ? block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${max}</lastmod>`)
                        : `<sitemap>${inner}<lastmod>${max}</lastmod></sitemap>`;
                });

                if (updated !== indexXml) {
                    writeFileSync(indexPath, updated);
                    logger.info(`sitemap-index.xml: set per-file lastmod on ${rewritten} ${rewritten === 1 ? 'entry' : 'entries'}`);
                }
            }
        }
    };
}
