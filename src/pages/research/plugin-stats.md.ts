import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: Plugin Stats
description: Active installs and download numbers for WordPress plugins, pulled from the WordPress.org plugin directory and visualized over time.
canonical: https://joost.blog/research/plugin-stats/
---

# Plugin Stats

Active installs and download numbers for WordPress plugins, pulled from the WordPress.org plugin directory and visualized over time. The interactive page at [joost.blog/research/plugin-stats/](https://joost.blog/research/plugin-stats/) lets you explore historical data per plugin.
`;

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
