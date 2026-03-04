# Phase 3: Routing and Core Pages - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Every piece of migrated content renders at its correct URL, with blog listing, category archives, video pages, and a custom 404. This phase wires up routing and page templates for all content from Phase 2. SEO metadata, performance optimization, and engagement features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Post URL routing
- Blog posts render at root level `/{slug}/` to preserve WordPress URLs exactly (URL-01)
- Pages also render at root level at their original URLs (`/about-me/`, `/contact-me/`, `/plugins/`, etc.)
- Blog listing stays at `/blog/` with pagination (`/blog/2/`, `/blog/3/`)
- Homepage remains the hero + recent posts landing page (not the blog listing)
- 10 posts per page on blog listing and any paginated views

### Post display
- Blog listing and post pages show: date, category, and estimated reading time (BLOG-02)
- Categories are clickable links to their archive pages

### Category archives
- URL pattern: `/category/{slug}/` matching WordPress default
- All posts on one page (no pagination) — most categories have <20 posts
- Simple layout: category name heading + filtered post list using same card style as blog listing
- No category descriptions — just name + posts

### Related posts
- Replace current prev/next navigation with category-based related posts (up to 3)
- Claude's discretion on selection algorithm (first category vs mixed, fallback strategy)

### Video pages
- Individual video pages at `/videos/{slug}/` (URL-05)
- Videos hub page (`/videos/`) auto-generated from the videos collection, not static markdown
- Claude's discretion on YouTube embed approach (Phase 4 will optimize with facade pattern)

### 404 page
- Claude's discretion on tone and content for the custom 404 page

### Feeds and sitemap
- Claude's discretion on whether to include videos in RSS/sitemap or blog posts only

### Claude's Discretion
- YouTube embed implementation on video pages (full iframe vs thumbnail; Phase 4 handles facade)
- Related posts selection algorithm and fallback when <3 posts in category
- 404 page tone, content, and design
- RSS/sitemap scope (blog only vs blog + videos)
- Routing conflict resolution between blog posts and pages at root level (technical implementation)

</decisions>

<specifics>
## Specific Ideas

- WordPress URLs must be preserved exactly — this is the #1 priority for the migration
- Blog listing should feel consistent with the existing Ovidius PostPreview cards, just enhanced with category and reading time
- Videos hub should auto-generate so it stays current as new video content is added
- Category archive pages should reuse the same post card component as the blog listing for consistency

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PostPreview.astro`: existing blog post card component — enhance with category links and reading time
- `ReadNextPostPreview.astro`: current prev/next component — will be replaced with related posts
- `FormattedDate.astro`: date formatting component, reuse as-is
- `CustomImage.astro`: image component with responsive sizing, reuse for video thumbnails
- `BaseLayout.astro`: page shell with SEO head, reuse for all new page types
- `Subscribe.astro`: newsletter subscribe component, currently on blog pages

### Established Patterns
- Blog collection uses `glob` loader from `src/content/blog/` with `sortPostsByDateDesc` utility
- Pages collection uses `glob` loader from `src/content/pages/`
- Videos collection uses `glob` loader from `src/content/videos/` with youtubeId, duration fields
- Pagination uses Astro's built-in `paginate()` with `siteConfig.postsPerPage`
- SEO data passed via BaseLayout props (title, description, image, pageType)

### Integration Points
- `src/pages/blog/[id].astro`: needs to move to `src/pages/[slug].astro` or similar for root-level URLs
- `src/pages/[...id].astro`: currently handles pages — needs to coexist with blog posts at root
- `src/data/site-config.ts`: holds postsPerPage (currently 5, change to 10)
- `src/utils/post-utils.ts`: has sortPostsByDateDesc, add reading time calculation
- New files needed: category archive page, video single page, videos hub page, 404 page

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-routing-and-core-pages*
*Context gathered: 2026-03-04*
