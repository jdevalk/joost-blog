import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: Research
description: Data reports and research by Joost de Valk — CMS market share and web technology studies.
canonical: https://joost.blog/research/
---

# Research

Data reports and studies on CMS market share and web technology adoption.

- [CMS Market Share](/cms-market-share/) — monthly CMS market share data based on the HTTP Archive: WordPress, Shopify, Wix, Squarespace, and more, tracked over time.
- [Can I safely use AVIF or WebP share images?](/use-avif-webp-share-images/) — platform-by-platform test results for AVIF and WebP support in og:image and twitter:image.
`;

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
