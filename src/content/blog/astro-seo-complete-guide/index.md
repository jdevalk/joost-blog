---
title: 'Astro SEO: the <em>definitive</em> guide.'
seo:
  description: "Eighteen years after 'WordPress SEO: the definitive guide,' here's the Astro version — the full SEO stack for 2026, from JSON-LD to agent discovery."
publishDate: 2026-04-12T00:00:00.000Z
excerpt: >-
  In 2008 I wrote "WordPress SEO: the definitive guide." Eighteen years later,
  this is the Astro version. The full SEO stack: linked JSON-LD graphs,
  per-collection sitemaps, auto-generated OG images, IndexNow, schema endpoints
  for agent discovery, and why keyphrase optimization matters less than you
  think.
categories:
  - SEO
  - Development
isFeatured: false
toc: true
---
In 2008, I wrote [WordPress SEO: the definitive guide](https://yoast.com/wordpress-seo/). It became one of the most-linked SEO articles on the internet and laid the groundwork for what eventually became Yoast SEO. The tools have changed, the web has changed, and my thinking on several fundamentals has evolved. This is the Astro version.

When I [moved this blog to Astro](/do-you-need-a-cms/), people asked: what about SEO? The answer is that everything I did on WordPress, I do on Astro. And because I control the entire HTML output, most of it is easier to get right. No theme conflicts, no plugin fights over head tags, no render-blocking resources injected by something I forgot I installed.

No server to compromise, no database to inject into, no login to brute force. From an SEO perspective, static HTML on a CDN is a better starting point than most CMSes will ever give you.

<div class="not-prose rounded-lg border-2 border-primary/20 bg-tertiary px-6 py-5 dark:border-accent/20 dark:bg-stone-900">
<p class="mb-2 text-lg font-semibold text-primary dark:text-accent">Want your AI agent to do this for you?</p>
<p class="text-base leading-relaxed text-stone-700 dark:text-stone-300">Install my <a href="https://github.com/jdevalk/skills?tab=readme-ov-file#-astro-seo" class="text-primary underline decoration-1 underline-offset-2 hover:no-underline dark:text-accent">Astro SEO skill</a>, or point your AI coding agent at this article. Everything below is written so an agent can read it and implement it directly.</p>
</div>

Here's the full stack.

## Technical foundation

### One component for all head metadata

The starting point is [`@jdevalk/astro-seo-graph`](https://github.com/jdevalk/seo-graph), a package I [built for exactly this purpose](/seo-graph/). The `<Seo>` component handles everything you'd normally scatter across your `<head>`: title, description, canonical, Open Graph, Twitter cards, hreflang, and the JSON-LD graph.

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

That's the entire `BaseHead.astro` here (minus font preloads and analytics). It used to be 130 lines.

The component handles several SEO details automatically:

- **Canonical URLs** are derived from Astro's `site` config with query parameters stripped by default (UTM tags and other tracking params don't create duplicate canonicals)
- **Robots meta** always includes `max-snippet:-1`, `max-image-preview:large`, `max-video-preview:-1` for maximum snippet sizes
- **Canonical is omitted when `noindex` is true**, per Google's recommendation
- **Twitter tags** that duplicate their Open Graph equivalents are suppressed (Twitter falls back to OG automatically)
- **Hreflang alternates** for multilingual sites. This blog is English-only so it doesn't need them, but [limonaia.house](https://limonaia.house) uses the same `<Seo>` component with `alternates` to tell search engines which page is the Italian version and which is the English version. Without hreflang, Google may show the wrong language version in search results, or treat the translations as duplicate content.

### Auto-generated OG images

Every page gets a 1200×675 Open Graph image generated at build time. That size matters: Google Discover requires images at least 1200px wide, and the 16:9 ratio works well across social platforms. The route at `/og/[...slug].jpg` uses [satori](https://github.com/vercel/satori) to render a template to SVG, then [sharp](https://sharp.pixelplumbing.com/) to convert it to JPEG. If the post has a featured image, it's composited into the design. If not, the template fills with the title and site branding.

[Why JPEG and not WebP or AVIF?](/use-avif-webp-share-images/) Because social platforms don't reliably support modern formats yet.

The `<Seo>` component derives the OG image URL from the page slug automatically:

```ts
const slug = Astro.url.pathname.replace(/^\/|\/$/g, '');
const ogImage = new URL(`/og/${slug || 'index'}.jpg`, SITE_URL).toString();
```

No manual image creation, no missing OG images, no forgetting to update them when you change the title.

### Build-time validation

The `seoGraph()` integration that handles IndexNow also validates your built HTML on every build. All six checks are on by default:

- **H1 validation:** Warns about pages with zero or more than one `<h1>` element, a common SEO and accessibility issue that's easy to miss in templates.
- **Duplicate title/description detection:** Checks across all built pages for duplicate `<title>` or meta description values. Here, it caught paginated blog pages all sharing the same title, a corpus-level SEO problem that per-page checks can't find.
- **Schema validation:** Validates the JSON-LD structured data on every page, which brings us to the next layer.
- **Image alt validation:** Warns about `<img>` tags without an `alt` attribute. Ran this once on my own site and got a list of 24 images across 14 posts with missing alt text that I'd missed over the years. Fixed in an afternoon.
- **Metadata length validation:** Flags titles or meta descriptions outside SERP-safe bounds. Defaults are title 30–65 and description 70–200. Configurable per site — a personal blog with listing pages like `/ask/` can loosen the title min, which is what I did here.
- **Internal link validation:** Scans every page's `<a href>` values and checks them against the set of paths the build actually produced. Catches the common "I linked to `/about-me` but the page is `/about-me/`" bug, where the site "works" via a 301 redirect but wastes a round-trip on every visit. Catches typo-broken links too. Supports a `skip` callback for paths handled at the CDN layer (like generated sitemaps).

What the link validator found on this site the first time I ran it: a broken `/about-me` (no trailing slash) in one post, every pagination link in my blog archive missing its trailing slash, and five internal links to `/plugins/*` that were being served via a redirect because the pages had moved to a different domain. The first two took five minutes to fix, the third was a real content issue I replaced with direct links.

Beyond build-time checks, add a **broken link checker** to your CI pipeline. A [lychee](https://github.com/lycheeverse/lychee-action) GitHub Action that runs on every push to your content files catches dead links to external URLs — which `validateInternalLinks` doesn't cover. A weekly scheduled run catches link rot as external sites move or disappear. Broken outbound links are a bad user experience and a negative trust signal.

## Structured data

Most sites that have structured data at all output a flat snippet: a single `Article` or `WebPage` object. That's better than nothing, but it doesn't tell search engines or AI agents how things connect. Who wrote this article? What site is it on? What organization does the author work for?

I [wrote about this in detail](/seo-graph/) when I shipped `@jdevalk/seo-graph-core`, the graph engine that powers this site's structured data. The short version: every page outputs a linked `@graph` with `WebSite`, `Blog`, `Person`, `WebPage`, `BlogPosting`, `BreadcrumbList`, and `ImageObject` entities. They're wired together with `@id` references so an agent can walk the relationships.

Trust signals in your graph matter more than they used to:

- `publishingPrinciples` tells agents where your editorial policy lives
- `copyrightHolder` and `copyrightYear` communicate rights
- `knowsAbout` helps topical authority
- `SearchAction` on the `WebSite` tells agents how to search your content

You can [visualize this blog's graph](https://classyschema.org/Visualisation?url=https%3A%2F%2Fjoost.blog%2F) to see how the entities connect.

The `<Seo>` component takes the assembled graph as a prop and renders it as `<script type="application/ld+json">` alongside all the meta tags. Everything in one place.

The seo-graph repo includes a [3,000-line AGENTS.md](https://github.com/jdevalk/seo-graph/blob/main/AGENTS.md) with recipes for fourteen site types (blog, e-commerce, vacation rental, podcast, documentation, and more), so your AI coding agent knows which entities to pick for your specific case.

## Content optimization

This is where my thinking has changed the most since 2008.

### Topics over keyphrases

The original WordPress SEO guide spent a lot of time on keyphrase optimization: pick a focus keyword, use it in your title, heading, first paragraph, meta description. That advice was correct for a world where search engines matched strings. It's much less relevant in 2026.

Modern search is vectorized. Engines and AI models convert your content into mathematical representations that capture *meaning*, not exact word matches. Writing about "building websites with Astro" has a much better chance of surfacing for related queries like "static site generators" than it used to. You don't need those exact phrases in your text. Exact keyword placement still has some effect, but it's far less important than covering the topic thoroughly and clearly.

That doesn't mean titles and descriptions don't matter. They do, because humans read them in search results and social shares. But optimizing them for exact keyword placement is solving a problem from 2015.

### Write for humans and extraction

Readability has always mattered, but the reason has expanded. It's no longer just about keeping humans engaged. AI systems pull answers from your content, and the unit of extraction is the paragraph. A self-contained paragraph that makes its point without requiring context from surrounding paragraphs is the one that gets surfaced in AI-generated answers. If your paragraph can't stand on its own, an AI agent can't use it.

Several specific things matter more than they used to:

- **Lead with the point.** Every paragraph should open with its most important sentence. That's what AI systems quote, and it's what L2 English readers use to decide whether to keep reading.
- **Keep sentences short.** Sentences over 20 words are harder to parse, especially for readers who aren't native English speakers. Most of your audience reads English as a second language. Write for them.
- **One idea per paragraph.** When a paragraph does two things, neither is extractable. Break it.
- **Use transitions.** Words like "because", "however", "for example" tell readers (and machines) how paragraphs connect. Without them, your post reads like a list of unrelated statements.
- **Avoid filler.** Words like "basically", "simply", "really", "just" add length without meaning. Cut them.

The same writing discipline that makes content readable to humans makes it useful to machines. If you write with an AI agent, the [readability-check skill](https://github.com/jdevalk/skills#-readability-check) can audit your drafts against these criteria automatically.

### Enforce structure at the content level

Astro's content collections let you enforce SEO fields at the schema level using Zod validation. `@jdevalk/astro-seo-graph` provides `seoSchema` which enforces title length (5-120 characters) and description length (15-160 characters):

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

## Site structure

### Content collections as typed architecture

On WordPress, your site structure lives in the database: posts, pages, categories, tags, custom post types. On Astro, it lives in the file system as content collections with typed schemas. Each collection is a directory of Markdown files with frontmatter validated against a Zod schema at build time.

This is stricter than WordPress taxonomies. A blog post that's missing a required `publishDate` or has a malformed `category` array won't build. The site structure is enforced by the type system, not by conventions that plugins may or may not follow.

### One taxonomy, not two

Most sites should not use both categories and tags. Pick one taxonomy and commit to it. If you have both, one of them is almost certainly adding clutter without adding navigational value. I [researched this](/research-wordpress-publications-misuse-tags/) and wrote [a plugin](https://progressplanner.com/plugins/fewer-tags/) about it for WordPress. On Astro, I simply didn't build tags. This site uses categories only.

### Breadcrumbs linked to the graph

Breadcrumbs aren't just a visual navigation aid. In the JSON-LD graph, each breadcrumb item can reference a schema entity via `@id`. Here, the "Blog" crumb in every blog post's breadcrumb trail links directly to the `Blog` entity in the graph, not just to the `/blog/` URL. That tells agents the structural relationship between the breadcrumb and the blog as a publication.

### Internal linking

Internal linking doesn't need to be a manual process. Tools like [Graphify](https://github.com/safishamsi/graphify) can analyze your content as a knowledge graph and surface linking opportunities you'd never find by scanning posts manually. The structure of your internal links is one of the strongest signals you control. Automate the discovery; be intentional about the execution.

## Performance

Performance is where Astro's architecture does most of the work for you.

**Static by default.** Every page is pre-rendered to HTML at build time. No server-side rendering, no database queries, no PHP execution. The baseline is already fast because there's nothing slow to do.

**Zero JavaScript by default.** Astro ships no client-side JS unless you explicitly add interactive components. Compare that to WordPress, where the average page loads dozens of scripts from themes, plugins, and third-party services.

**Image optimization.** Astro's built-in `<Image>` component generates responsive `srcset` attributes, converts to WebP, and adds `loading="lazy"` and `decoding="async"` automatically.

**Font preloading.** Preload your primary web font in woff2 format. Mona Sans is preloaded in the `<head>` so it's available before the first paint.

**View Transitions.** Astro's `<ClientRouter />` with `defaultStrategy: 'viewport'` prefetches links as they scroll into view, making navigation feel instant while keeping the initial load minimal.

**CDN headers.** Hashed assets under `/_astro/` get `Cache-Control: public, max-age=31536000, immutable`. They never need revalidation because the filename changes when the content changes. How you set these headers depends on your platform: Cloudflare Pages and Netlify use a `_headers` file, Vercel uses `vercel.json`, and other hosts typically use server config.

**[No-Vary-Search](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/No-Vary-Search).** UTM parameters break browser caching: `?utm_source=linkedin` and `?utm_source=email` are treated as different resources. The `No-Vary-Search` response header tells the browser to ignore specified query parameters when matching cached responses:

```
No-Vary-Search: key-order, params=("utm_source" "utm_medium" "utm_campaign" "utm_content" "utm_term")
```

Same page, different UTM tags, one cached response. Supported in Chrome, degrades gracefully elsewhere.

## Sitemaps and indexing

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

For this blog, that produces `sitemap-posts-0.xml`, `sitemap-videos-0.xml`, and `sitemap-pages-0.xml` (the default bucket for unmatched URLs). Per-collection sitemaps make it much easier to debug indexing issues in Google Search Console and Bing Webmaster Tools, since each collection shows separately.

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

When I first enabled this, the build pinged Bing with all 153 URLs on the site. Without IndexNow, you publish and wait for search engines to discover your changes on their next crawl, which can take days or weeks. With it, the search engine knows about your new or updated pages within seconds of the build finishing.

### RSS feed

An RSS feed is still one of the most reliable discovery mechanisms. Feed readers, podcast apps, and an increasing number of AI agents consume RSS directly. Astro's [`@astrojs/rss`](https://docs.astro.build/en/guides/rss/) package makes this straightforward: you create a route that pulls your content collection, renders each post's body to HTML, and returns a valid RSS 2.0 feed. The `<Seo>` component advertises it with a `<link rel="alternate" type="application/rss+xml">` tag in the head so browsers and agents can discover it automatically.

Include the full post content in your feed, not just excerpts. Truncated feeds frustrate readers and give AI systems less to work with. If someone is subscribed to your feed, they've already opted in to reading your writing.

### robots.txt

A dynamic `robots.txt` route references the sitemap index and the schema map (see next section):

```
User-agent: *
Allow: /

Sitemap: https://joost.blog/sitemap-index.xml
Schemamap: https://joost.blog/schemamap.xml
```

## Agent discovery

Sitemaps and IndexNow help search engines find your content. Agent discovery helps AI systems understand it. The sections below cover the basics; for the fuller agent-readiness picture, see my post "[What agent-ready looks like for a static blog](/agent-ready/)".

### Schema endpoints and schema map

Schema endpoints serve a corpus-wide JSON-LD graph that lets an agent understand your entire site in one request. This is part of Microsoft's [NLWeb](https://github.com/nlweb-ai/NLWeb) specification. It's still early, but the setup is simple enough that it's worth having ready:

Each endpoint collects every entry in a content collection, builds the full JSON-LD graph for each entry, and serves the combined result as `application/ld+json`. This site has three: `/schema/post.json`, `/schema/page.json`, and `/schema/video.json`. A schema map at `/schemamap.xml` lists them all, like a sitemap but for structured data. The `Schemamap:` directive in `robots.txt` points agents to it. See the [`astro-seo-graph` documentation](https://github.com/jdevalk/seo-graph/tree/main/packages/astro-seo-graph#schema-endpoints) for the full implementation.

### Markdown alternates

AI agents parse markdown more reliably than HTML. Astro sites are unusually well-placed to serve it: content collections already *are* markdown, so there's no lossy HTML-to-markdown conversion — you hand the agent the source. `astro-seo-graph` ships a [`createMarkdownEndpoint`](https://github.com/jdevalk/seo-graph/tree/main/packages/astro-seo-graph#markdown-alternate) factory that exposes a `.md` URL for every page (frontmatter + body + a `X-Markdown-Tokens` header so agents can size requests). The `<Seo>` component auto-emits `<link rel="alternate" type="text/markdown" href="…">` so agents discover it the same way browsers discover an RSS feed.

For content negotiation — agents that send `Accept: text/markdown` on the canonical URL — add a Cloudflare Transform Rule that rewrites the path when the header is present. The [README has the exact rule](https://github.com/jdevalk/seo-graph/tree/main/packages/astro-seo-graph#3-accept-textmarkdown-content-negotiation-cloudflare); it works on the free plan and needs no SSR.

### llms.txt

The [`llms.txt` standard](https://llmstxt.org) provides a machine-readable summary of your site at `/llms.txt`. Think of it as a `robots.txt` for AI: it tells language models what your site is about, what content is available, and where to find it. The `seoGraph()` integration generates it automatically at build time from your built pages:

```js
seoGraph({
    llmsTxt: {
        title: 'My Site',
        siteUrl: 'https://example.com',
        summary: 'What this site is about.',
    },
})
```

No AI bot widely requests `llms.txt` today. [That's not the point](/standards-dont-prove-themselves/). Standards don't prove themselves before adoption. SEO plugins that ship `llms.txt` across millions of sites create the supply that gives crawlers a reason to look for it.

### NLWeb discovery

A `<link rel="nlweb">` tag in the head points to the site's conversational endpoint, for AI agents that support Microsoft's [NLWeb protocol](https://github.com/nlweb-ai/NLWeb). Early days, but the tag is one line.

## Redirects and error handling

### Redirects

When you change a URL, delete a page, or consolidate duplicate content, you need redirects. How you configure them depends on your hosting platform. On Cloudflare Pages, a `_redirects` file in `public/` works. On Netlify, you can use the same `_redirects` format or `netlify.toml`. On Vercel, redirects go in `vercel.json`. The syntax differs but the principle is the same: map every old URL to its new location with a 301 status.

Keep this maintained. Every URL that ever existed and moved should have a redirect. Search engines transfer link equity through 301 redirects, and users who bookmarked the old URL still arrive where they should.

### FuzzyRedirect on 404

For the URLs that slip through, the [`FuzzyRedirect`](https://github.com/jdevalk/seo-graph/tree/main/packages/astro-seo-graph#fuzzy-404-redirect) component from `@jdevalk/astro-seo-graph` acts as a safety net. It fetches your sitemap, computes Levenshtein distance against the current URL, and either auto-redirects (above 85% similarity) or shows a "Did you mean..." suggestion. Catches typos and old URL patterns without maintaining a redirect table.

## Analytics and measurement

**[Plausible](https://plausible.io/)** for traffic analytics. Privacy-friendly, no cookie banner needed, lightweight script that doesn't slow down the page.

**[Google Search Console](https://search.google.com/search-console)** for indexing status, structured data validation, and search performance. The per-collection sitemaps make debugging easier: if something isn't being indexed, you can see immediately whether it's a posts problem, a videos problem, or something else.

**[Bing Webmaster Tools](https://www.bing.com/webmasters)** for the same reasons, and because Bing's index feeds AI products like Copilot and ChatGPT. If your content isn't indexed by Bing, it's invisible to a growing share of how people find information.

**Structured data validation.** Use Google's [Rich Results Test](https://search.google.com/test/rich-results) and [ClassySchema](https://classyschema.org/Visualisation) to verify your JSON-LD graph. Check that every `@id` reference resolves, that the entity relationship tree is complete, and that trust signals like `publishingPrinciples` and `copyrightHolder` are present.

## The full stack

Here's what it looks like assembled:

- [`@jdevalk/astro-seo-graph`](https://github.com/jdevalk/seo-graph) for the `<Seo>` component, schema endpoints, schema map, IndexNow, `llms.txt`, FuzzyRedirect, and build-time validation (includes `@jdevalk/seo-graph-core` for the JSON-LD graph engine)
- [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) with `chunks` for per-collection sitemaps and `serialize` for git-based lastmod
- [satori](https://github.com/vercel/satori) + [sharp](https://sharp.pixelplumbing.com/) for auto-generated OG images
- [astro-pagefind](https://github.com/shishkin/astro-pagefind) for client-side search (which the `SearchAction` in the schema points to)
- [readability-check skill](https://github.com/jdevalk/skills#-readability-check) for AI-assisted content auditing

All of it is open source. You can see it running live on this site: view source on any page for the JSON-LD graph, check the [sitemap index](/sitemap-index.xml), the [schema map](/schemamap.xml), or [visualize the full graph](https://classyschema.org/Visualisation?url=https%3A%2F%2Fjoost.blog%2F) for the homepage.

Eighteen years after that first WordPress SEO guide, the principles haven't changed: make your content accessible to both humans and machines, structure it so search engines understand it, and make the whole thing fast. What has changed is that the machines reading your content are no longer just crawlers following links. They're AI agents that understand meaning, extract paragraphs, and walk knowledge graphs. The SEO stack should reflect that. This one does.

If you're building an Astro site with an AI coding agent, point it at this post and let it set everything up for you.
