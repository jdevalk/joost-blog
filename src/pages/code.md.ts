import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: The Workshop — Code & Projects
description: Code projects, WordPress plugins, npm packages, and other software built and maintained by Joost de Valk.
canonical: https://joost.blog/code/
---

# The Workshop

Building tools that make the web and the world better — from WordPress and EmDash plugins to Astro integrations, schema infrastructure, and club management software.

## Astro packages

- [@jdevalk/seo-graph-core](https://www.npmjs.com/package/@jdevalk/seo-graph-core) — pure TypeScript schema.org JSON-LD graph builder.
- [@jdevalk/astro-seo-graph](https://www.npmjs.com/package/@jdevalk/astro-seo-graph) — Astro integration for seo-graph-core.
- [@jdevalk/astro-markdown-alternate](https://www.npmjs.com/package/@jdevalk/astro-markdown-alternate) — markdown alternate links for Astro articles.

## EmDash packages

- [@jdevalk/emdash-plugin-seo](https://www.npmjs.com/package/@jdevalk/emdash-plugin-seo) — SEO plugin for EmDash CMS.
- [@jdevalk/emdash-plugin-lettermint](https://www.npmjs.com/package/@jdevalk/emdash-plugin-lettermint) — Lettermint email provider plugin for EmDash.

## WordPress plugins

- [Progress Planner](https://progressplanner.com/) — content and site maintenance planning.
- [AAA Option Optimizer](https://progressplanner.com/plugins/aaa-option-optimizer/) — autoloaded options optimization.
- [Brand Assets](https://progressplanner.com/plugins/brand-assets/) — public brand assets page.
- [Comment Experience](https://progressplanner.com/plugins/comment-experience/) — comment system improvements.
- [Comment Free Zone](https://progressplanner.com/plugins/comment-free-zone/) — cleanly removes comments.
- [Fewer Tags](https://progressplanner.com/plugins/fewer-tags/) — only show tags with enough posts.
- [Glossary](https://progressplanner.com/plugins/glossary/) — inline term definitions.
- [XML Sitemaps for PDFs](https://progressplanner.com/plugins/xml-sitemap-for-pdfs/) — Yoast SEO add-on for PDF indexing.

## Other

- [Quix for Alfred](/code/alfred-quix/) — Alfred workflow for SEO and web analysis.

The full interactive page lives at [joost.blog/code/](https://joost.blog/code/).
`;

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
