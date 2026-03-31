import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import ecliptic from 'ecliptic';
import { d1, sqlite } from 'ecliptic/db';
import { astroMarkdownSource } from './src/import/astro-markdown-source';

const database = import.meta.env.PROD
  ? d1({ binding: 'DB' })
  : sqlite({ url: 'file:./data.db' });

export default defineConfig({
  output: 'server',
  integrations: [
    ecliptic({
      database,
      import: {
        sources: [astroMarkdownSource],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  prefetch: {
    defaultStrategy: 'viewport'
  }
});
