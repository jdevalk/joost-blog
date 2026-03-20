import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import pagefind from 'astro-pagefind';
import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({
    site: 'https://joost.blog',
    vite: {
        plugins: [tailwindcss()]
    },
    redirects: {
        '/clicky': 'https://wordpress.org/plugins/clicky/',
        '/clicky/': 'https://wordpress.org/plugins/clicky/',
        '/code/clicky': 'https://wordpress.org/plugins/clicky/',
        '/code/clicky/': 'https://wordpress.org/plugins/clicky/',
        '/plugins': '/code/',
        '/plugins/': '/code/',
    },
    prefetch: {
        defaultStrategy: 'viewport',
    },
    integrations: [mdx(), sitemap(), pagefind()],
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark'
            }
        }
    }
});
