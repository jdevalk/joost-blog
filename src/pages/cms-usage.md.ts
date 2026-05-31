import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: CMS usage
description: Monthly CMS usage data based on a DomainCrawler dataset of nearly 100 million sites — WordPress, Shopify, Wix, Squarespace, and more, tracked over time.
canonical: https://joost.blog/cms-usage/
---

# CMS usage

Monthly CMS usage data based on a DomainCrawler dataset of nearly 100 million sites. The page at [joost.blog/cms-usage/](https://joost.blog/cms-usage/) shows ranked CMS counts, market share, year-over-year change, and historical sparklines for each detected platform.

The interactive table is rendered from JSON at build time. For the underlying methodology, see [/cms-market-share/](https://joost.blog/cms-market-share/).
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            Link: '<https://joost.blog/cms-usage/>; rel="canonical"'
        }
    });
};
