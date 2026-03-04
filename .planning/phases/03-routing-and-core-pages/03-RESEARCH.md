# Phase 3: Routing and Core Pages - Research

**Researched:** 2026-03-04
**Domain:** Astro 5 routing, content collections, pagination, RSS/sitemap
**Confidence:** HIGH

## Summary

Phase 3 transforms the current Ovidius-style routing (blog posts at `/blog/{slug}/`, pages at `/{slug}/`) into WordPress-compatible root-level URLs for all content. The core technical challenge is routing both blog posts and pages at the root level without conflicts -- fortunately, no slug collisions exist between the 75 blog posts (66 directory-style + 9 flat .md) and 13 pages.

The existing codebase already has working pagination (`paginate()`), RSS (`@astrojs/rss`), sitemap (`@astrojs/sitemap`), and content collections with categories. The work is primarily rerouting, enhancing components (add category links + reading time), and creating new page types (category archives, video pages, 404).

**Primary recommendation:** Use a single `src/pages/[slug].astro` dynamic route that merges blog posts and pages into one `getStaticPaths()`, replacing both the current `src/pages/blog/[id].astro` and `src/pages/[...id].astro`. This avoids Astro's rest parameter priority issues and keeps routing explicit.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Blog posts render at root level `/{slug}/` to preserve WordPress URLs exactly (URL-01)
- Pages also render at root level at their original URLs (`/about-me/`, `/contact-me/`, `/plugins/`, etc.)
- Blog listing stays at `/blog/` with pagination (`/blog/2/`, `/blog/3/`)
- Homepage remains the hero + recent posts landing page (not the blog listing)
- 10 posts per page on blog listing and any paginated views
- Blog listing and post pages show: date, category, and estimated reading time (BLOG-02)
- Categories are clickable links to their archive pages
- Category URL pattern: `/category/{slug}/` matching WordPress default
- All posts on one page for category archives (no pagination)
- Simple layout for category archives: category name heading + filtered post list using same card style as blog listing
- No category descriptions -- just name + posts
- Replace current prev/next navigation with category-based related posts (up to 3)
- Individual video pages at `/videos/{slug}/` (URL-05)
- Videos hub page (`/videos/`) auto-generated from the videos collection, not static markdown

### Claude's Discretion
- YouTube embed implementation on video pages (full iframe vs thumbnail; Phase 4 handles facade)
- Related posts selection algorithm and fallback when <3 posts in category
- 404 page tone, content, and design
- RSS/sitemap scope (blog only vs blog + videos)
- Routing conflict resolution between blog posts and pages at root level (technical implementation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| URL-01 | All existing blog post slugs work at their current URLs (root-level: /post-slug/) | Merged `[slug].astro` route handling both blog posts and pages; no slug conflicts found between 75 blog posts and 13 pages |
| URL-02 | All existing page URLs work (/about-me/, /contact-me/, /plugins/, etc.) | Same merged route; pages collection IDs map directly to URL slugs |
| URL-05 | Video page URLs preserved at /videos/video-slug/ | New `src/pages/videos/[slug].astro` route from videos collection |
| BLOG-01 | Blog post listing page with pagination | Existing `blog/[...page].astro` with `paginate()` -- update `postsPerPage` to 10, enhance PostPreview |
| BLOG-02 | Individual post pages with date, category, reading time | Enhance blog post template and PostPreview with category links and reading time utility |
| BLOG-03 | Category archive pages for all 10 categories | New `src/pages/category/[slug].astro` with `getStaticPaths()` extracting unique categories from blog posts |
| BLOG-04 | Related posts displayed at bottom of each article (category-based, limit 3) | New RelatedPosts component replacing ReadNextPostPreview; filter by shared category |
| BLOG-05 | RSS feed generated at /rss.xml | Existing `rss.xml.js` -- update post links from `/blog/{id}/` to `/{slug}/` |
| BLOG-06 | XML sitemap generated automatically | Already configured via `@astrojs/sitemap` integration -- will auto-update with new routes |
| BLOG-07 | Custom 404 page | New `src/pages/404.astro` -- Astro convention |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.15.3 | Framework -- static site generation, routing, content collections | Already installed, drives all routing |
| @astrojs/rss | 4.0.13 | RSS feed generation | Already installed and configured |
| @astrojs/sitemap | 3.6.0 | XML sitemap generation | Already installed and configured |
| @astrojs/mdx | 4.3.9 | MDX support for content | Already installed |

### Supporting (no new installs needed)
This phase requires NO new npm packages. Everything is achievable with Astro's built-in routing, content collections, and the already-installed integrations.

## Architecture Patterns

### Current vs Target Route Structure

```
CURRENT:                          TARGET:
src/pages/                        src/pages/
  index.astro         (home)        index.astro           (home - unchanged)
  [...id].astro       (pages)       [slug].astro          (blog posts + pages merged)
  rss.xml.js          (rss)         rss.xml.js            (rss - update links)
  blog/                             404.astro             (new)
    [id].astro        (posts)       blog/
    [...page].astro   (listing)       [...page].astro     (listing - update postsPerPage)
                                    category/
                                      [slug].astro        (new - category archives)
                                    videos/
                                      index.astro         (new - videos hub)
                                      [slug].astro        (new - video pages)
```

### Pattern 1: Merged Root-Level Route

**What:** A single `[slug].astro` that serves both blog posts and pages at `/{slug}/`
**When to use:** When two content types share the same URL namespace with no conflicts
**Why not `[...slug]`:** Rest parameters have lower priority than named parameters in Astro. A simple `[slug]` is sufficient since all content is one level deep.

```typescript
// src/pages/[slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
    const posts = await getCollection('blog');
    const pages = await getCollection('pages');

    const blogPaths = posts.map((post) => ({
        params: { slug: post.id },
        props: { entry: post, type: 'blog' as const }
    }));

    const pagePaths = pages.map((page) => ({
        params: { slug: page.id },
        props: { entry: page, type: 'page' as const }
    }));

    return [...blogPaths, ...pagePaths];
}
```

**Critical detail:** With Astro 5's glob loader, directory-style posts (`blog/my-post/index.md`) get `id: "my-post"` (the directory name), and flat files (`blog/my-post.md`) get `id: "my-post"` (filename without extension). Both patterns produce clean slugs suitable for root-level URLs.

### Pattern 2: Category Archive Generation

**What:** Extract unique categories from all blog posts, generate one page per category
**When to use:** Dynamic archive pages from content metadata

```typescript
// src/pages/category/[slug].astro
export async function getStaticPaths() {
    const posts = await getCollection('blog');

    // Build category -> posts map
    const categoryMap = new Map<string, typeof posts>();
    for (const post of posts) {
        for (const cat of post.data.categories ?? []) {
            const slug = slugify(cat);
            if (!categoryMap.has(slug)) categoryMap.set(slug, []);
            categoryMap.get(slug)!.push(post);
        }
    }

    return [...categoryMap.entries()].map(([slug, posts]) => ({
        params: { slug },
        props: {
            category: posts[0].data.categories?.find(c => slugify(c) === slug) ?? slug,
            posts: posts.sort(sortPostsByDateDesc)
        }
    }));
}
```

### Pattern 3: Reading Time Calculation

**What:** Estimate reading time from post body word count
**Implementation:** Add to `src/utils/post-utils.ts`

```typescript
export function getReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 225));
}
```

**Note:** Astro's content collections expose `body` on the collection entry (the raw markdown). Use this for word count. The body is available as `entry.body` in Astro 5.

### Pattern 4: Related Posts (Category-Based)

**What:** Find up to 3 posts sharing a category with the current post
**Algorithm recommendation:**
1. Take the first category of the current post
2. Filter all posts with that same category (excluding current post)
3. Sort by date descending, take first 3
4. If fewer than 3, fill from other categories of the post
5. If still fewer than 3, fill with most recent posts from any category

```typescript
export function getRelatedPosts(
    currentPost: CollectionEntry<'blog'>,
    allPosts: CollectionEntry<'blog'>[],
    limit = 3
): CollectionEntry<'blog'>[] {
    const categories = currentPost.data.categories ?? [];
    const otherPosts = allPosts.filter(p => p.id !== currentPost.id);

    // Posts sharing the first category
    const primary = categories[0]
        ? otherPosts.filter(p => p.data.categories?.includes(categories[0]))
        : [];

    if (primary.length >= limit) return primary.slice(0, limit);

    // Fill with posts from any shared category
    const related = new Set(primary.map(p => p.id));
    for (const cat of categories.slice(1)) {
        for (const p of otherPosts) {
            if (!related.has(p.id) && p.data.categories?.includes(cat)) {
                primary.push(p);
                related.add(p.id);
                if (primary.length >= limit) return primary.slice(0, limit);
            }
        }
    }

    // Fill remaining with recent posts
    for (const p of otherPosts) {
        if (!related.has(p.id)) {
            primary.push(p);
            if (primary.length >= limit) return primary.slice(0, limit);
        }
    }

    return primary;
}
```

### Anti-Patterns to Avoid

- **Separate route files for blog and pages at root level:** Two `[slug].astro`-like files cannot coexist. Merge into one.
- **Using `[...slug].astro` when `[slug].astro` suffices:** Rest parameters add complexity and have lower routing priority in Astro.
- **Hardcoding category slugs:** Extract dynamically from content -- categories may change.
- **Computing reading time at render time from rendered HTML:** Use raw markdown `body` in `getStaticPaths` for simplicity and accuracy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RSS feed | Custom XML generation | `@astrojs/rss` (already installed) | Handles escaping, proper RSS 2.0 format, date handling |
| Sitemap | Custom XML generation | `@astrojs/sitemap` (already installed) | Auto-discovers all routes, handles lastmod |
| Pagination | Manual page splitting | Astro's built-in `paginate()` | Handles page URLs, prev/next links, edge cases |
| Slug generation | Custom regex | Simple `toLowerCase().replace(/\s+/g, '-')` | Categories already have clean names; minimal transformation needed |

**Key insight:** The existing codebase already has RSS, sitemap, and pagination working. This phase is about reconfiguring routes and enhancing templates, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Blog Post ID Format with Glob Loader
**What goes wrong:** Assuming post IDs include file extensions or subdirectory paths
**Why it happens:** Astro 5's glob loader strips extensions and uses directory names for index files
**How to avoid:** Verify post IDs by logging them during development. For this project: `agent-ready-plugins/index.md` becomes `id: "agent-ready-plugins"`, and `blogging-about-not-seo.md` becomes `id: "blogging-about-not-seo"`. Both work perfectly as root-level slugs.
**Warning signs:** 404s on post URLs, double extensions in URLs

### Pitfall 2: Existing Links Still Pointing to /blog/{slug}/
**What goes wrong:** Internal links in components, RSS feed, homepage, and other posts still reference `/blog/{slug}/`
**Why it happens:** The codebase has many hardcoded `/blog/${post.id}/` references
**How to avoid:** Search-and-replace ALL occurrences:
- `PostPreview.astro` (2 occurrences of `/blog/${post.id}/`)
- `ReadNextPostPreview.astro` (2 occurrences)
- `FeaturedPostPreview.astro` (check for blog links)
- `rss.xml.js` (link generation)
- `index.astro` (homepage -- uses PostPreview so inherits fix)
**Warning signs:** Clicking a post from any listing leads to old `/blog/` URL (which will 404 after route change)

### Pitfall 3: The videos.md Page Conflict
**What goes wrong:** Both `src/content/pages/videos.md` and `src/pages/videos/index.astro` try to serve `/videos/`
**Why it happens:** There's an existing static `videos.md` page in the pages collection
**How to avoid:** Either exclude `videos` from the pages collection in the merged route, or delete/rename `src/content/pages/videos.md`. The CONTEXT.md decision is clear: videos hub should be auto-generated.
**Warning signs:** Build error about duplicate routes

### Pitfall 4: Category Slug Consistency
**What goes wrong:** Category names like "Search Opinion" need consistent slugification
**Why it happens:** Categories are stored as display strings in frontmatter
**How to avoid:** Create a single `slugify()` utility and use it everywhere -- route generation, link creation, filtering
**Warning signs:** Category archive at `/category/search-opinion/` but links go to `/category/Search%20Opinion/`

### Pitfall 5: postsPerPage Change Affects Pagination URLs
**What goes wrong:** Changing from 5 to 10 posts per page means page numbers change
**Why it happens:** With 75 posts at 5/page = 15 pages; at 10/page = 8 pages
**How to avoid:** This is intentional and expected. Just ensure the pagination component handles the new count correctly. No redirects needed since these are new URLs.

### Pitfall 6: Pages with Conflicting Slugs to Reserved Routes
**What goes wrong:** The pages collection includes `about.md` and `about-me.md`, `contact.md` and `contact-me.md`
**Why it happens:** Some pages may have been duplicated during migration
**How to avoid:** Verify all 13 pages render at expected URLs. Both `about` and `about-me` are legitimate pages -- no conflict with blog posts or reserved routes (`blog`, `category`, `videos`, `rss.xml`).

## Code Examples

### YouTube Embed for Video Pages
For Phase 3, use a simple iframe embed. Phase 4 will add the facade pattern (lite-youtube-embed).

```astro
<!-- Simple YouTube embed component -->
---
interface Props {
    youtubeId: string;
    title: string;
}
const { youtubeId, title } = Astro.props;
---
<div class="aspect-video w-full">
    <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
        title={title}
        class="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
    ></iframe>
</div>
```

### Category Slugify Utility

```typescript
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .trim();
}
```

### Updated RSS Feed Links

```typescript
// In rss.xml.js -- change link from /blog/ to root
items: posts.map((item) => ({
    title: item.data.title,
    description: item.data.excerpt,
    link: `/${item.id}/`,  // Changed from /blog/${item.id}/
    pubDate: item.data.publishDate.setUTCHours(0)
}))
```

### 404 Page

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Page Not Found" description="The page you're looking for doesn't exist.">
    <main class="px-4 py-12 grow sm:px-8 sm:py-16">
        <div class="max-w-3xl mx-auto text-center">
            <h1 class="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-4">404</h1>
            <p class="text-xl text-slate-600 dark:text-slate-400 mb-8">
                The page you are looking for does not exist or has been moved.
            </p>
            <a href="/" class="bg-primary hover:shadow-button inline-flex items-center justify-center rounded-full px-8 py-2.5 font-semibold text-white transition duration-300">
                Go Home
            </a>
        </div>
    </main>
</BaseLayout>
```

## Existing Content Inventory

Critical numbers for planning:

| Content Type | Count | Current URL | Target URL |
|-------------|-------|-------------|------------|
| Blog posts | 75 (66 directory, 9 flat) | `/blog/{slug}/` | `/{slug}/` |
| Pages | 13 | `/{slug}/` | `/{slug}/` (unchanged) |
| Videos | 8 | none (no route) | `/videos/{slug}/` |
| Categories | 11 unique | none | `/category/{slug}/` |

### Category Distribution
| Category | Post Count |
|----------|-----------|
| WordPress | 34 |
| Development | 15 |
| Search Opinion | 8 |
| Yoast | 7 |
| Open Source | 7 |
| Market Share Analysis | 5 |
| Productivity hacks | 4 |
| Personal stuff | 2 |
| Travel | 1 |
| Short | 1 |
| Post from Joost | 1 |

Note: Some posts have multiple categories, so the total exceeds 75. Total unique categories is 11 (not 10 as stated in requirements -- verify if "Post from Joost" and "Short" should remain separate).

### Files That Need URL Updates
These files contain hardcoded `/blog/${post.id}/` links that must change to `/${post.id}/`:
- `src/components/PostPreview.astro` (lines 33, 40)
- `src/components/ReadNextPostPreview.astro` (lines 25, 32) -- will be replaced entirely
- `src/components/FeaturedPostPreview.astro` (check for blog links)
- `src/pages/rss.xml.js` (line 15)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getCollection()` returns `slug` | Astro 5 glob loader uses `id` | Astro 5 (late 2024) | Use `post.id` not `post.slug` for routing |
| `src/content/config.ts` | `src/content.config.ts` | Astro 5 | Already using correct location |
| File-based collection IDs | Glob loader with configurable ID | Astro 5 | IDs are clean slugs by default |

## Discretion Recommendations

### YouTube Embed Approach
**Recommendation:** Use plain iframe with `youtube-nocookie.com` domain and `loading="lazy"`. Phase 4 explicitly handles facade pattern optimization. Keep it simple now.

### Related Posts Algorithm
**Recommendation:** Primary category match first, then other shared categories, then recent posts as fallback. This ensures every post gets 3 related posts even single-category posts like "Travel" (1 post) -- it will fall back to recent posts.

### 404 Page
**Recommendation:** Clean, minimal design matching the site's aesthetic. Show "404" heading, friendly message, and a link home. Optionally show 3 recent posts to help visitors find content.

### RSS/Sitemap Scope
**Recommendation:** Blog posts only for RSS (standard blog behavior). Sitemap should include everything (blog, pages, videos) since `@astrojs/sitemap` auto-discovers all routes. No extra configuration needed for sitemap.

## Open Questions

1. **11 vs 10 categories**
   - What we know: There are 11 unique category strings in the content. Requirements say "10 categories."
   - What's unclear: Whether "Post from Joost" (1 post) is intentional or a migration artifact
   - Recommendation: Generate archive pages for ALL categories found in content. The dynamic approach handles any count.

2. **Duplicate-looking pages (about/about-me, contact/contact-me)**
   - What we know: Both exist in the pages collection
   - What's unclear: Whether these are intentional (different content) or duplicates
   - Recommendation: Render all pages as-is. Content cleanup is not in Phase 3 scope.

3. **Post body access for reading time**
   - What we know: Astro 5 collection entries have a `body` property with raw markdown
   - What's unclear: Whether `body` is always populated with the glob loader (it should be for md/mdx)
   - Recommendation: Test with one post during implementation. Fallback: use `render()` and estimate from rendered content.

## Sources

### Primary (HIGH confidence)
- Project codebase inspection -- all existing files, components, routes, and content collections examined directly
- Astro 5.15.3 installed and build-tested -- route output verified in `/dist/`

### Secondary (MEDIUM confidence)
- Astro content collections API (glob loader behavior, `id` field format) -- verified via build output matching expectations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages needed, all already installed and working
- Architecture: HIGH -- routing approach verified against Astro 5 behavior and build output
- Pitfalls: HIGH -- identified from direct code inspection of hardcoded URLs and content conflicts
- Content inventory: HIGH -- counted from filesystem, categories extracted from frontmatter

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- Astro 5 is mature, no breaking changes expected)
