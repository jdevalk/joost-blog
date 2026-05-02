import type { AstroIntegration } from 'astro';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Options {
    /** Return true if this page should get a markdown alternate link.
     *  Default: any page with og:type="article" in its HTML. */
    test?: (pathname: string, html: string) => boolean;
    /** Generate the markdown href from the page pathname.
     *  Return null to skip. Default: strip trailing slash and append .md. */
    href?: (pathname: string) => string | null;
}

export function markdownAlternate(options: Options = {}): AstroIntegration {
    const test = options.test ?? ((_pathname, html) =>
        html.includes('og:type') && html.includes('"article"')
    );
    const href = options.href ?? ((pathname) => {
        const slug = pathname.replace(/^\/|\/$/g, '');
        return slug ? `/${slug}.md` : null;
    });

    return {
        name: 'markdown-alternate',
        hooks: {
            'astro:build:done': ({ dir }) => {
                function walk(dirPath: string) {
                    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
                        const fullPath = join(dirPath, entry.name);
                        if (entry.isDirectory()) {
                            walk(fullPath);
                            continue;
                        }
                        if (entry.name !== 'index.html') continue;
                        const pathname = '/' + fullPath.slice(dir.pathname.length).replace('index.html', '');
                        const html = readFileSync(fullPath, 'utf-8');
                        if (!test(pathname, html)) continue;
                        const markdownHref = href(pathname);
                        if (!markdownHref) continue;
                        const link = `<link rel="alternate" type="text/markdown" href="${markdownHref}">`;
                        writeFileSync(fullPath, html.replace('</head>', `${link}\n</head>`));
                    }
                }
                walk(dir.pathname);
            },
        },
    };
}
