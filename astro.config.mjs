import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { writeFileSync } from 'node:fs';

const PRODUCTION_URL = 'https://joost.blog';

function noIndexOnStaging() {
    let siteUrl;
    return {
        name: 'noindex-on-staging',
        hooks: {
            'astro:config:done': ({ config }) => {
                siteUrl = config.site?.toString().replace(/\/$/, '');
            },
            'astro:build:done': ({ dir }) => {
                if (siteUrl !== PRODUCTION_URL) {
                    writeFileSync(
                        new URL('_headers', dir),
                        '/*\n  X-Robots-Tag: noindex, nofollow\n'
                    );
                }
            }
        }
    };
}

// https://astro.build/config
export default defineConfig({
    site: process.env.DEPLOY_URL || PRODUCTION_URL,
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [mdx(), sitemap(), noIndexOnStaging()],
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark'
            }
        }
    }
});
