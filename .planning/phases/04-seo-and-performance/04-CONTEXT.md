# Phase 4: SEO and Performance - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Production-quality SEO metadata and optimized asset delivery. Every page gets proper OG tags, canonical URLs, meta descriptions, and auto-generated OG images. Blog posts get simple Article JSON-LD, video pages get VideoObject. YouTube embeds switch to a facade pattern. All templates pass heading hierarchy audit. The full Yoast-style @graph schema system is deferred to a separate phase.

</domain>

<decisions>
## Implementation Decisions

### OG image generation
- Auto-generated at build time, 1200x675 pixels
- Full-bleed featured image as background with post title text overlaid
- "joost.blog" branding in a corner
- Dark gradient scrim behind text for readability on any image
- Fallback for posts/pages without a featured image: title text on branded background (brand colors)
- BaseHead already has OG tag framework — this adds the image generation layer

### JSON-LD structured data (simple)
- Article schema on blog posts: headline, author ("Joost de Valk", url: joost.blog), datePublished, dateModified, description, image
- VideoObject schema on video pages: name, description, thumbnailUrl, uploadDate, duration, embedUrl (from existing youtubeId/duration frontmatter)
- No full @graph approach yet — keep it simple with standalone JSON-LD blocks per page type
- Full Yoast-style schema with Organization, WebSite, WebPage, BreadcrumbList, SearchAction deferred to dedicated phase

### YouTube facade pattern
- Replace current full iframe embeds with a facade/lite pattern (no iframe until user clicks)
- Claude's discretion on library choice (lite-youtube-embed, astro-embed, or custom)
- Must maintain youtube-nocookie.com privacy-enhanced mode from Phase 3

### Heading hierarchy
- Strict hierarchy enforced: no skipping levels (h1 > h2 > h3, never h1 > h3)
- Audit all page templates and components for compliance
- One h1 per page, logical h2-h6 nesting below

### Existing SEO foundation (already implemented)
- Canonical URLs: implemented in BaseHead with formatCanonicalURL (SEO-03 done)
- OG meta tags: framework in BaseHead with title, description, image, type (SEO-01 partially done)
- Meta descriptions: wired from excerpts/frontmatter via BaseHead props (SEO-04 partially done)
- These need review/verification but not reimplementation

### Claude's Discretion
- YouTube facade library selection
- OG image typography and exact gradient treatment
- Fallback OG image design details
- JS audit approach for PERF-03 (zero unnecessary JS)
- Any minor SEO improvements discovered during implementation

</decisions>

<specifics>
## Specific Ideas

- OG images should feel professional — this is the blog of the Yoast SEO founder
- The full Yoast schema spec is at https://developer.yoast.com/features/schema/ — reference for the future dedicated phase
- Yoast schema uses @graph array with @id cross-references between Organization, WebSite, WebPage, Article, Person, Breadcrumb, ImageObject, VideoObject pieces

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseHead.astro`: Already has OG tags, canonical URLs, meta descriptions, twitter cards — extend for OG image generation
- `YouTubeEmbed.astro`: Simple iframe component to replace with facade pattern
- `src/content.config.ts`: Video schema already has youtubeId, duration, title for VideoObject generation
- `[slug].astro`: Already passes pageType="article" for blog posts, seoDescription, seoImage to BaseLayout

### Established Patterns
- SEO data flows through BaseLayout props → BaseHead component
- Featured images use Astro's `getImage()` for optimization (already in BaseHead for OG)
- Blog posts have excerpt, categories, publishDate, updatedDate in frontmatter
- Videos have youtubeId, duration, description in frontmatter

### Integration Points
- OG image generation needs a build-time pipeline (Astro endpoint or integration)
- JSON-LD script tags go in BaseHead or page-level head injection
- YouTube facade replaces YouTubeEmbed.astro component
- Heading audit touches all page templates: [slug].astro, index.astro, blog/[...page].astro, category/[slug].astro, videos/*.astro, 404.astro

</code_context>

<deferred>
## Deferred Ideas

- Full Yoast-style Schema.org module — dedicated phase with @graph array, Organization, WebSite, WebPage, BreadcrumbList, SearchAction, Person pieces interconnected via @id references. Spec: https://developer.yoast.com/features/schema/

</deferred>

---

*Phase: 04-seo-and-performance*
*Context gathered: 2026-03-04*
