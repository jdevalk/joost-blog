import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import pagefind from 'astro-pagefind';
import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function injectModulePreloads() {
    return {
        name: 'inject-modulepreloads',
        hooks: {
            'astro:build:done': ({ dir }) => {
                const astroDir = join(dir.pathname, '_astro');
                let jsFiles;
                try {
                    jsFiles = readdirSync(astroDir).filter(f => f.endsWith('.js'));
                } catch { return; }

                // Build a map of which JS files import which other JS files
                const imports = new Map();
                for (const file of jsFiles) {
                    const content = readFileSync(join(astroDir, file), 'utf-8');
                    const matches = content.matchAll(/from\s*["']\.\/([^"']+\.js)["']/g);
                    for (const match of matches) {
                        if (!imports.has(file)) imports.set(file, []);
                        imports.get(file).push(match[1]);
                    }
                }

                // For each HTML file, find script tags and add modulepreload for their transitive imports
                const walkDir = (dirPath) => {
                    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
                        const fullPath = join(dirPath, entry.name);
                        if (entry.isDirectory()) {
                            walkDir(fullPath);
                        } else if (entry.name === 'index.html') {
                            let html = readFileSync(fullPath, 'utf-8');
                            const scriptMatches = html.matchAll(/src="\/_astro\/([^"]+\.js)"/g);
                            const toPreload = new Set();
                            for (const m of scriptMatches) {
                                const deps = imports.get(m[1]);
                                if (deps) {
                                    for (const dep of deps) {
                                        toPreload.add(dep);
                                        // Also check transitive deps
                                        const transitive = imports.get(dep);
                                        if (transitive) transitive.forEach(t => toPreload.add(t));
                                    }
                                }
                            }
                            if (toPreload.size > 0) {
                                const preloadTags = [...toPreload]
                                    .map(f => `<link rel="modulepreload" href="/_astro/${f}">`)
                                    .join('');
                                html = html.replace('</head>', preloadTags + '</head>');
                                writeFileSync(fullPath, html);
                            }
                        }
                    }
                };
                walkDir(dir.pathname);
            }
        }
    };
}
// https://astro.build/config
export default defineConfig({
    site: 'https://joost.blog',
    vite: {
        plugins: [tailwindcss()]
    },
prefetch: {
        defaultStrategy: 'viewport',
    },
    integrations: [mdx(), sitemap(), pagefind(), injectModulePreloads()],
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark'
            }
        }
    }
});
