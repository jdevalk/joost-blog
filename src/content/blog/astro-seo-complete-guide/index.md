---
title: 'Astro SEO: the definitive guide'
publishDate: 2026-04-12T00:00:00.000Z
excerpt: >-
  In 2008 I wrote "WordPress SEO: the definitive guide." Eighteen years
  later, this is the Astro version. The full SEO stack: linked JSON-LD
  graphs, per-collection sitemaps, auto-generated OG images, IndexNow,
  schema endpoints for agent discovery, and why keyphrase optimization
  matters less than you think.
categories:
  - Development
draft: true
password: astro-seo-2026
toc: true
---
In 2008, I wrote [WordPress SEO: the definitive guide](https://yoast.com/wordpress-seo/). It became one of the most-linked SEO articles on the internet and laid the groundwork for what eventually became Yoast SEO. The tools have changed, the web has changed, and my thinking on several fundamentals has evolved. This is the Astro version.

When I [moved this blog to Astro](/do-you-need-a-cms/), people asked: what about SEO? The answer is that everything I did on WordPress, I do on Astro. And because I control the entire HTML output, most of it is easier to get right. No theme conflicts, no plugin fights over head tags, no render-blocking resources injected by something I forgot I installed. No server to compromise, no database to inject into, no login to brute force. From an SEO perspective, static HTML on a CDN is a better starting point than most CMSes will ever give you.

Here's the full stack.

**Table of contents:**

1. [Technical foundation](#1-technical-foundation) — the `<Seo>` component, canonical URLs, OG images
2. [Structured data](#2-structured-data) — linked JSON-LD knowledge graphs, trust signals
3. [Content optimization](#3-content-optimization) — topics over keyphrases, writing for AI extraction
4. [Site structure](#4-site-structure) — content collections, one taxonomy, breadcrumbs, internal linking
5. [Performance](#5-performance) — static by default, image optimization, caching, No-Vary-Search
6. [Sitemaps and discovery](#6-sitemaps-and-discovery) — XML sitemaps, IndexNow, schema endpoints, NLWeb
7. [Analytics and measurement](#7-analytics-and-measurement) — Search Console, Bing, structured data validation

## 1. Technical foundation

### One component for all head metadata

The starting point is [`@jdevalk/astro-seo-graph`](https://github.com/jdevalk/seo-graph), a package I [built for exactly this purpose](/seo-graph/). The `<Seo>` component handles everything you'd normally scatter across your `<head>`: title, meta description, canonical URL, Open Graph tags, Twitter cards, hreflang alternates, and the JSON-LD knowledge graph. One component, one call.

```astro
---
import Seo from '@jdevalk/astro-seo-graph/Seo.astro';
---

<Seo
    title="My Post | My Site"
    description="A concise description for search engines."
    canonical="https://example.com/my-post/"
    ogType="article"
    ogImage="https://example.com/og/my-post.jpg"
    ogImageAlt="My Post"
    ogImageWidth={1200}
    ogImageHeight={675}
    siteName="My Site"
    twitter={{ card: 'summary_large_image', site: '@handle' }}
    article={{ publishedTime: publishDate, tags: ['Astro', 'SEO'] }}
    graph={graph}
    extraLinks={[
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'sitemap', href: '/sitemap-index.xml' },
        { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml', title: 'RSS' },
    ]}
/>
```

That's the entire `BaseHead.astro` on this site (minus font preloads and analytics). It used to be 130 lines.

The component handles several SEO details automatically:

- **Canonical URLs** are derived from Astro's `site` config with query parameters stripped by default (UTM tags and other tracking params don't create duplicate canonicals)
- **Robots meta** always includes `max-snippet:-1`, `max-image-preview:large`, `max-video-preview:-1` for maximum snippet sizes
- **Canonical is omitted when `noindex` is true**, per Google's recommendation
- **Twitter tags** that duplicate their Open Graph equivalents are suppressed (Twitter falls back to OG automatically)

### Auto-generated OG images

Every page on this site gets a 1200×675 Open Graph image generated at build time. That size matters: Google Discover requires images at least 1200px wide, and the 16:9 ratio works well across social platforms. The route at `/og/[...slug].jpg` uses [satori](https://github.com/vercel/satori) to render a template to SVG, then [sharp](https://sharp.pixelplumbing.com/) to convert it to JPEG. If the post has a featured image, it's composited into the design. If not, the template fills with the title and site branding.

The `<Seo>` component derives the OG image URL from the page slug automatically:

```ts
const slug = Astro.url.pathname.replace(/^\/|\/$/g, '');
const ogImage = new URL(`/og/${slug || 'index'}.jpg`, SITE_URL).toString();
```

No manual image creation, no missing OG images, no forgetting to update them when you change the title.

### Build-time H1 validation

The same `seoGraph()` integration that handles IndexNow also validates your built HTML. It warns about pages with zero or more than one `<h1>` element, a common SEO and accessibility issue that's easy to miss in templates. The check runs automatically on every build.

## 2. Structured data

Most sites that have structured data at all output a flat snippet: a single `Article` or `WebPage` object. That's better than nothing, but it doesn't tell search engines or AI agents how things connect. Who wrote this article? What site is it on? What organization does the author work for?

I [wrote about this in detail](/seo-graph/) when I shipped `@jdevalk/seo-graph-core`, the graph engine that powers this site's structured data. The short version: every page outputs a linked `@graph` with `WebSite`, `Blog`, `Person`, `WebPage`, `BlogPosting`, `BreadcrumbList`, and `ImageObject` entities, all wired together with `@id` references so an agent can walk the relationships.

The entities include trust signals that are increasingly important: `publishingPrinciples` tells agents where your editorial policy lives, `copyrightHolder` and `copyrightYear` communicate rights, `knowsAbout` helps topical authority, and `SearchAction` on the `WebSite` tells agents how to search your content. You can [visualize this site's graph](https://classyschema.org/Visualisation?url=https%3A%2F%2Fjoost.blog%2F) to see how the entities connect.

The `<Seo>` component takes the assembled graph as a prop and renders it as `<script type="application/ld+json">` alongside all the meta tags. One component, one graph, one place to get it right.

The seo-graph repo includes a [3,000-line AGENTS.md](https://github.com/jdevalk/seo-graph/blob/main/AGENTS.md) with recipes for fourteen site types (blog, e-commerce, vacation rental, podcast, documentation, and more), so your AI coding agent knows which entities to pick for your specific case.

## 3. Content optimization

This is where my thinking has changed the most since 2008.

### Topics over keyphrases

The original WordPress SEO guide spent a lot of time on keyphrase optimization: pick a focus keyword, use it in your title, heading, first paragraph, meta description. That advice was correct for a world where search engines matched strings. It's much less relevant in 2026.

Modern search is vectorized. Engines and AI models convert your content into high-dimensional embeddings that capture *meaning*, not exact word matches. Writing about "building websites with Astro" will rank for "static site generators" and "modern web development" without those phrases ever appearing in your text. What matters is covering the *topic* thoroughly, not placing specific keywords in specific locations.

That doesn't mean titles and descriptions don't matter. They do, because humans read them in search results and social shares. But optimizing them for exact keyword placement is solving a problem from 2015.

### Write for extraction

Readability has always mattered, but the reason has shifted. It's no longer just about keeping humans engaged. AI systems pull answers from your content, and the unit of extraction is the paragraph. A self-contained paragraph that makes its point without requiring context from surrounding paragraphs is the one that gets surfaced in AI-generated answers. If your paragraph can't stand on its own, an AI agent can't use it.

This means: clear topic sentences, one idea per paragraph, conclusions stated rather than implied. The same writing discipline that makes content readable to humans makes it useful to machines.

### Enforce structure at the content level

Astro's content collections let you enforce SEO fields at the schema level using Zod validation. On this site, `@jdevalk/astro-seo-graph` provides `seoSchema` which enforces title length (5-120 characters) and description length (15-160 characters):

```ts
import { seoSchema } from '@jdevalk/astro-seo-graph';

const blog = defineCollection({
    schema: ({ image }) => z.object({
        title: z.string(),
        publishDate: z.coerce.date(),
        seo: seoSchema(image).optional(),
    }),
});
```

If someone adds a 200-character SEO title, the build fails. That's more reliable than a runtime warning in a CMS sidebar.

The schema endpoints also include `articleBody` with the full text of each post (markdown-stripped, up to 10K characters), giving AI agents access to your content through structured data, not just by scraping rendered HTML.

## 4. Site structure

### Content collections as typed architecture

On WordPress, your site structure lives in the database: posts, pages, categories, tags, custom post types. On Astro, it lives in the file system as content collections with typed schemas. Each collection is a directory of Markdown files with frontmatter validated against a Zod schema at build time.

This is more rigorous than WordPress taxonomies. A blog post that's missing a required `publishDate` or has a malformed `category` array won't build. The site structure is enforced by the type system, not by conventions that plugins may or may not follow.

### One taxonomy, not two

Most sites should not use both categories and tags. Pick one taxonomy and commit to it. If you have both, one of them is almost certainly adding clutter without adding navigational value. I [researched this](/research-wordpress-publications-misuse-tags/) and wrote [a plugin](https://progressplanner.com/plugins/fewer-tags/) about it for WordPress; on Astro I simply didn't build tags. This site uses categories only.

### Breadcrumbs linked to the graph

Breadcrumbs aren't just a visual navigation aid. In the JSON-LD graph, each breadcrumb item can reference a schema entity via `@id`. On this site, the "Blog" crumb in every blog post's breadcrumb trail links directly to the `Blog` entity in the graph, not just to the `/blog/` URL. That tells agents the structural relationship between the breadcrumb and the blog as a publication.

### Internal linking

Internal linking doesn't need to be a manual process. Tools like [Graphify](https://github.com/safishamsi/graphify) can analyze your content as a knowledge graph and surface linking opportunities you'd never find by scanning posts manually. The structure of your internal links is one of the strongest signals you control. Automate the discovery; be intentional about the execution.

## 5. Performance

This is where Astro's architecture does most of the work for you.

**Static by default.** Every page is pre-rendered to HTML at build time. No server-side rendering, no database queries, no PHP execution. The baseline is already fast because there's nothing slow to do.

**Zero JavaScript by default.** Astro ships no client-side JS unless you explicitly add interactive components. Compare that to WordPress, where the average page loads dozens of scripts from themes, plugins, and third-party services.

**Image optimization.** Astro's built-in `<Image>` component generates responsive `srcset` attributes, converts to WebP, and adds `loading="lazy"` and `decoding="async"` automatically.

**Font preloading.** Preload your primary web font in woff2 format. On this site, Mona Sans is preloaded in the `<head>` so it's available before the first paint.

**Module preloads.** A custom Astro integration scans the built output, traces JavaScript import chains, and injects `<link rel="modulepreload">` tags for transitive dependencies. This eliminates the waterfall where the browser discovers imports only after parsing the parent module.

**View Transitions.** Astro's `<ClientRouter />` with `defaultStrategy: 'viewport'` prefetches links as they scroll into view, making navigation feel instant while keeping the initial load minimal.

**CDN headers.** Hashed assets under `/_astro/` get `Cache-Control: public, max-age=31536000, immutable`. They never need revalidation because the filename changes when the content changes.

**No-Vary-Search.** UTM parameters break browser caching: `?utm_source=linkedin` and `?utm_source=email` are treated as different resources. The `No-Vary-Search` response header tells the browser to ignore specified query parameters when matching cached responses:

```
No-Vary-Search: key-order, params=("utm_source" "utm_medium" "utm_campaign" "utm_content" "utm_term")
```

Same page, different UTM tags, one cached response. Supported in Chrome, degrades gracefully elsewhere.

## 6. Sitemaps and discovery

### Per-collection sitemaps

Astro's [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) integration generates sitemaps, but the defaults are a single file with no `lastmod` dates. Both are easy to fix.

The `chunks` option splits your sitemap by content type:

```js
sitemap({
    entryLimit: 1000,
    chunks: {
        'posts': (item) => {
            if (isABlogPost(new URL(item.url).pathname)) return item;
        },
        'videos': (item) => {
            if (/\/videos\/[^/]+/.test(new URL(item.url).pathname)) return item;
        },
    },
})
```

On this site, this produces `sitemap-posts-0.xml`, `sitemap-videos-0.xml`, and `sitemap-pages-0.xml` (the default bucket for unmatched URLs). Per-collection sitemaps make it much easier to debug indexing issues in Google Search Console and Bing Webmaster Tools, since each collection shows separately.

### Git-based lastmod

For `lastmod`, the `serialize` callback adds dates. Frontmatter `publishDate` only gives you a date, not a timestamp. File system timestamps reset on CI. The reliable source is git:

```ts
function gitLastmod(filePath) {
    const log = execSync(
        `git log -1 --format="%cI" -- "${filePath}"`,
        { encoding: 'utf-8' }
    ).trim();
    return log ? new Date(log) : null;
}
```

This gives you the actual timestamp of the last commit that touched each content file, falling back to frontmatter dates when git history isn't reliable (for example, after a bulk content migration).

### IndexNow

Sitemaps are passive: you publish them and wait for crawlers to find the changes. [IndexNow](https://www.indexnow.org/) is the active counterpart. When you publish or update content, you push a notification to Bing, Yandex, and other supporting search engines, telling them the URL has changed.

`@jdevalk/astro-seo-graph` ships an Astro integration that submits all built URLs to IndexNow automatically after each build:

```js
// astro.config.mjs
import seoGraph from '@jdevalk/astro-seo-graph/integration';

export default defineConfig({
    integrations: [
        seoGraph({
            indexNow: {
                key: 'your-indexnow-key',
                host: 'example.com',
                siteUrl: 'https://example.com',
            },
        }),
    ],
});
```

You also need a key verification route so search engines can confirm host ownership:

```ts
// src/pages/[your-key].txt.ts
import { createIndexNowKeyRoute } from '@jdevalk/astro-seo-graph';

export const GET = createIndexNowKeyRoute({ key: 'your-indexnow-key' });
```

On this site, the first build submitted 153 URLs and got a 202 response within seconds. Instead of waiting for crawlers, the search engine already knows.

### Schema endpoints and schema map

Schema endpoints serve a corpus-wide JSON-LD graph that lets an agent understand your entire site in one request. This is part of Microsoft's [NLWeb](https://github.com/nlweb-ai/NLWeb) specification. It's still early, but the infrastructure is simple enough that there's no reason not to have it ready:

```ts
// src/pages/schema/post.json.ts
import { createSchemaEndpoint } from '@jdevalk/astro-seo-graph';

export const GET = createSchemaEndpoint({
    entries: () => getCollection('blog'),
    mapper: (post) => [
        buildWebPage({ url, name: post.data.title, ... }, ids),
        buildArticle({ url, headline: post.data.title, ... }, ids, 'BlogPosting'),
    ],
});
```

This site serves three schema endpoints and a schema map at `/schemamap.xml` that lists them, like a sitemap but for structured data.

### robots.txt

A dynamic `robots.txt` route references both the sitemap index and the schema map:

```
User-agent: *
Allow: /

Sitemap: https://joost.blog/sitemap-index.xml
Schemamap: https://joost.blog/schemamap.xml
```

### NLWeb discovery

A `<link rel="nlweb">` tag in the head points to the site's conversational endpoint, for AI agents that support Microsoft's [NLWeb protocol](https://github.com/nlweb-ai/NLWeb). Early days, but the tag is one line.

### FuzzyRedirect on 404

The `FuzzyRedirect` component from `@jdevalk/astro-seo-graph` fetches your sitemap, computes Levenshtein distance against the current URL, and either auto-redirects (above 95% similarity) or shows a "Did you mean..." suggestion. Catches typos and old URL patterns without maintaining a redirect table.

## 7. Analytics and measurement

**Plausible** for traffic analytics. Privacy-friendly, no cookie banner needed, lightweight script that doesn't slow down the page.

**Google Search Console** for indexing status, structured data validation, and search performance. The per-collection sitemaps make debugging easier: if something isn't being indexed, you can see immediately whether it's a posts problem, a videos problem, or something else.

**Bing Webmaster Tools** for the same reasons, and because Bing's index feeds AI products like Copilot and ChatGPT. If your content isn't indexed by Bing, it's invisible to a growing share of how people find information.

**Structured data validation.** Use Google's [Rich Results Test](https://search.google.com/test/rich-results) and [ClassySchema](https://classyschema.org/Visualisation) to verify your JSON-LD graph. Check that every `@id` reference resolves, that the entity relationship tree is complete, and that trust signals like `publishingPrinciples` and `copyrightHolder` are present.

## The full stack

Here's what it looks like assembled:

- [`@jdevalk/astro-seo-graph`](https://github.com/jdevalk/seo-graph) for the `<Seo>` component, schema endpoints, schema map, IndexNow, FuzzyRedirect, and build-time H1 validation (includes `@jdevalk/seo-graph-core` for the JSON-LD graph engine)
- [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) with `chunks` for per-collection sitemaps and `serialize` for git-based lastmod
- [satori](https://github.com/vercel/satori) + [sharp](https://sharp.pixelplumbing.com/) for auto-generated OG images
- [astro-pagefind](https://github.com/shishkin/astro-pagefind) for client-side search (which the `SearchAction` in the schema points to)
- A custom integration for module preloads

All of it is open source. You can see it running live on this site: view source on any page for the JSON-LD graph, check the [sitemap index](/sitemap-index.xml), the [schema map](/schemamap.xml), or [visualize the full graph](https://classyschema.org/Visualisation?url=https%3A%2F%2Fjoost.blog%2F) for the homepage.

Eighteen years after that first WordPress SEO guide, the principles haven't changed: make your content accessible to both humans and machines, structure it so search engines understand it, and make the whole thing fast. What has changed is that the machines reading your content are no longer just crawlers following links. They're AI agents that understand meaning, extract paragraphs, and walk knowledge graphs. The SEO stack should reflect that. This one does.

If you're building an Astro site with an AI coding agent, point it at this post and let it set everything up for you.
