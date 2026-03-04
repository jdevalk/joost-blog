# Architecture Research

**Domain:** WordPress-to-Astro personal blog migration (joost.blog)
**Researched:** 2026-03-04
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
Build Time (Astro SSG)
======================

Content Layer                       Configuration
  src/content/                        src/data/
  +-----------+  +-----------+        +------------------+
  | blog/     |  | pages/    |        | site-config.ts   |
  | *.md      |  | *.md      |        | (nav, hero, SEO, |
  +-----------+  +-----------+        |  social, brand)  |
  | videos/   |                       +------------------+
  | *.md      |                              |
  +-----------+                              |
       |                                     |
       v                                     v
  +---------------------------------------------------+
  | content.config.ts (Zod schemas + glob loaders)     |
  +---------------------------------------------------+
       |
       v
  Routing Layer (src/pages/)
  +------------------+  +-------------------------+
  | index.astro      |  | blog/                   |
  | (homepage)       |  |   [...page].astro (list)|
  +------------------+  |   [id].astro (single)   |
  | [...id].astro    |  +-------------------------+
  | (pages catchall) |  | category/               |
  +------------------+  |   [category]/            |
  | 404.astro        |  |     [...page].astro      |
  +------------------+  +-------------------------+
  | rss.xml.js       |  | videos/                 |
  | sitemap (plugin) |  |   index.astro (hub)     |
  +------------------+  |   [id].astro (single)   |
                         +-------------------------+
       |
       v
  Layout + Components Layer
  +-----------------+  +------------------------------+
  | BaseLayout.astro|  | Components:                  |
  | (head, nav, ft) |  |   Header, Footer, Hero,      |
  +-----------------+  |   PostPreview, CustomImage,   |
                       |   FormattedDate, Giscus,      |
                       |   CategoryList, VideoEmbed    |
                       +------------------------------+
       |
       v
  Static Output (dist/)
  +---------------------------------------------------+
  | HTML + optimized images + CSS + RSS + sitemap      |
  +---------------------------------------------------+
       |
       v
  Cloudflare Pages CDN
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Content Collections | Store and validate all content (posts, pages, videos) | Markdown files with Zod-validated frontmatter via `content.config.ts` |
| Site Config | Centralize site-wide settings (nav, branding, hero, social) | Single `site-config.ts` TypeScript object |
| Routing Layer | Map URLs to pages, preserve WordPress slugs | File-based routing in `src/pages/` with dynamic `[id]` and `[...page]` patterns |
| BaseLayout | Provide consistent page shell (head, nav, footer, SEO meta) | Single Astro layout component wrapping all pages |
| Components | Reusable UI pieces (post cards, images, dates, icons) | Astro components in `src/components/` |
| Build Pipeline | Transform content + components into static HTML | Astro SSG build with image optimization |
| CDN | Serve static output globally | Cloudflare Pages with automatic deploys |

## Recommended Project Structure

```
joost.blog/
├── public/
│   ├── favicon.svg
│   └── images/            # Non-optimized static images (OG fallbacks)
├── src/
│   ├── assets/
│   │   └── images/        # Optimized images (feature images, hero, avatar)
│   ├── components/
│   │   ├── BaseHead.astro         # <head> meta, OG tags, canonical
│   │   ├── Header.astro           # Site navigation
│   │   ├── HeaderNavLink.astro    # Individual nav link
│   │   ├── Footer.astro           # Footer with secondary nav, social
│   │   ├── Hero.astro             # Homepage hero section
│   │   ├── PostPreview.astro      # Blog post card for listings
│   │   ├── FeaturedPostPreview.astro  # Enhanced featured post card
│   │   ├── ReadNextPostPreview.astro  # Prev/next post navigation
│   │   ├── FormattedDate.astro    # Consistent date formatting
│   │   ├── CustomImage.astro      # Responsive image with srcset
│   │   ├── Icon.astro             # SVG icon system
│   │   ├── SocialLink.astro       # Social media link
│   │   ├── CategoryList.astro     # Category links display (NEW)
│   │   ├── VideoEmbed.astro       # YouTube embed wrapper (NEW)
│   │   └── Giscus.astro           # Comment widget (NEW)
│   ├── content/
│   │   ├── blog/                  # Blog posts (66 markdown files)
│   │   │   ├── my-post-slug.md
│   │   │   └── ...
│   │   ├── pages/                 # Static pages (about, contact, etc.)
│   │   │   ├── about.md
│   │   │   ├── contact.md
│   │   │   ├── plugins.md
│   │   │   ├── privacy.md
│   │   │   └── comment-policy.md
│   │   └── videos/                # Video content collection (NEW)
│   │       ├── talk-title.md
│   │       └── ...
│   ├── data/
│   │   └── site-config.ts         # All site-wide configuration
│   ├── layouts/
│   │   └── BaseLayout.astro       # Single layout wrapping all pages
│   ├── pages/
│   │   ├── index.astro            # Homepage (hero + featured + recent)
│   │   ├── [...id].astro          # Catch-all for pages collection
│   │   ├── blog/
│   │   │   ├── [...page].astro    # Paginated blog listing
│   │   │   └── [id].astro         # Individual blog post
│   │   ├── category/
│   │   │   └── [category]/
│   │   │       └── [...page].astro  # Category archive with pagination (NEW)
│   │   ├── videos/
│   │   │   ├── index.astro        # Videos hub page (NEW)
│   │   │   └── [id].astro         # Individual video page (NEW)
│   │   ├── 404.astro              # Custom 404 page
│   │   └── rss.xml.js             # RSS feed generation
│   ├── styles/
│   │   └── global.css             # Tailwind directives + custom styles
│   ├── utils/
│   │   └── post-utils.ts          # Sort, filter, category helpers
│   ├── content.config.ts          # Collection definitions + Zod schemas
│   └── types.ts                   # Shared TypeScript types
├── astro.config.mjs               # Astro configuration
├── tailwind.config.mjs            # Tailwind CSS configuration
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`src/content/blog/`:** Flat directory of 66 markdown files. Each file's name becomes its slug. No subdirectories -- the slug IS the filename. This matches WordPress's flat permalink structure (`/post-slug/`) and makes content easy to find.
- **`src/content/pages/`:** Separate collection for static pages (about, contact, etc.). The `[...id].astro` catch-all renders these at root-level URLs (`/about/`, `/contact/`), matching WordPress.
- **`src/content/videos/`:** New collection for video content. Keeps video-specific schema (YouTube URL, duration, event name) separate from blog posts. Renders under `/videos/`.
- **`src/data/site-config.ts`:** Single source of truth for all configuration. Ovidius pattern -- proven and clean. Avoids scattered config across components.
- **`src/pages/`:** File-based routing mirrors URL structure. Easy to reason about "where does `/category/wordpress/` come from?" -- look in `src/pages/category/`.
- **`src/components/`:** Flat directory works for ~15 components. No need for subdirectory nesting at this scale.
- **`src/assets/images/`:** Images here get Astro's automatic optimization (resizing, format conversion, srcset). Feature images should be referenced from frontmatter using relative paths.

## Architectural Patterns

### Pattern 1: Content Collections with Typed Schemas

**What:** Define Zod schemas for each content type in `content.config.ts`. Astro validates all frontmatter at build time and provides full TypeScript inference.
**When to use:** Always -- this is Astro 5's core content management pattern.
**Trade-offs:** Requires strict frontmatter in every markdown file (good discipline), but build fails on schema violations (catches errors early rather than producing broken pages).

**Example:**
```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    featureImage: z.object({
      src: image(),
      alt: z.string().default(''),
      caption: z.string().optional(),
    }).optional(),
    isFeatured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    featureImage: z.object({
      src: image(),
      alt: z.string().default(''),
    }).optional(),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date(),
    youtubeId: z.string(),
    event: z.string().optional(),
    duration: z.string().optional(),
  }),
});

export const collections = { blog, pages, videos };
```

### Pattern 2: Slug-Based URL Preservation

**What:** Use the markdown filename as the URL slug, matching WordPress permalink structure. The blog post `src/content/blog/my-post-title.md` produces the URL `/blog/my-post-title/`.
**When to use:** WordPress migration where existing URLs must be preserved for SEO.
**Trade-offs:** Filenames must exactly match WordPress slugs. No room for filename conventions that differ from URLs.

**Example:**
```typescript
// src/pages/blog/[id].astro
export async function getStaticPaths() {
  const posts = (await getCollection('blog')).sort(sortPostsByDateDesc);
  return posts.map((post, index) => ({
    params: { id: post.id },
    props: {
      post,
      prevPost: posts[index + 1] ?? null,
      nextPost: posts[index - 1] ?? null,
    },
  }));
}
```

**Important:** WordPress uses `/post-slug/` at the root by default, but Ovidius puts posts under `/blog/post-slug/`. If the current WordPress site uses root-level post URLs, a `_redirects` file or restructured routing is needed. Check the current WordPress permalink structure and adapt accordingly.

### Pattern 3: Category Pages via Dynamic Routing

**What:** Extract unique categories from blog posts at build time and generate paginated archive pages for each.
**When to use:** When posts have a `category` field and you need category archive pages.
**Trade-offs:** Categories are derived from content, not a separate data source. Adding a category requires at least one post in it.

**Example:**
```typescript
// src/pages/category/[category]/[...page].astro
export async function getStaticPaths({ paginate }) {
  const posts = (await getCollection('blog')).sort(sortPostsByDateDesc);
  const categories = [...new Set(posts.map(p => p.data.category))];

  return categories.flatMap(category => {
    const categoryPosts = posts.filter(p => p.data.category === category);
    return paginate(categoryPosts, {
      params: { category: slugify(category) },
      pageSize: 10,
    });
  });
}
```

### Pattern 4: Giscus as Client-Side Island

**What:** Load Giscus comments as a client-side component using Astro's islands architecture. The comment widget hydrates independently without blocking page render.
**When to use:** On individual blog post pages.
**Trade-offs:** Requires readers to have GitHub accounts. Comments live in GitHub Discussions, not on the site itself.

**Example:**
```astro
<!-- src/components/Giscus.astro -->
<section class="giscus-wrapper mt-12">
  <script
    src="https://giscus.app/client.js"
    data-repo="joostdevalk/joost.blog"
    data-repo-id="[REPO_ID]"
    data-category="Comments"
    data-category-id="[CATEGORY_ID]"
    data-mapping="pathname"
    data-strict="0"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="top"
    data-theme="light"
    data-lang="en"
    crossorigin="anonymous"
    async
  ></script>
</section>
```

## Data Flow

### Build-Time Content Flow

```
Markdown files (src/content/)
    |
    v
content.config.ts (Zod validation + glob loader)
    |
    v
getCollection('blog') / getCollection('pages') / getCollection('videos')
    |
    v
getStaticPaths() in page components
    |
    v
Astro renders each route:
  - Frontmatter data --> component props
  - Markdown body --> render() --> <Content /> component
  - Images --> Astro image pipeline (resize, format, srcset)
    |
    v
Static HTML + optimized assets (dist/)
    |
    v
Cloudflare Pages (git push triggers build + deploy)
```

### Homepage Data Flow

```
getCollection('blog')
    |
    v
sort by date descending
    |
    +--> filter(isFeatured) --> FeaturedPostPreview components
    |
    +--> filter(!isFeatured).slice(0,3) --> PostPreview components
    |
site-config.ts --> Hero component (title, bio, avatar, background)
```

### Blog Post Data Flow

```
getCollection('blog')
    |
    v
sort by date, map to routes with prev/next
    |
    v
Single post page:
    +--> render(post) --> <Content /> (markdown body as HTML)
    +--> post.data --> title, date, category, feature image
    +--> prevPost/nextPost --> ReadNextPostPreview
    +--> Giscus component (loads client-side, uses pathname for mapping)
```

### Key Data Flows

1. **Content to Pages:** Markdown files are loaded by glob loaders, validated by Zod schemas, queried by `getCollection()`, and rendered by page components via `render()`. This is entirely build-time -- no runtime data fetching.
2. **Configuration to Components:** `site-config.ts` is imported directly by components that need site-wide data (Header, Hero, Footer, BaseHead). No prop drilling through layouts needed.
3. **Images to Optimized Output:** Feature images referenced in frontmatter via `image()` schema helper get processed by Astro's image pipeline. Inline markdown images from remote URLs (Astro 5.4+) are also auto-optimized.
4. **Comments (Client-Side):** Giscus loads asynchronously in the browser. Uses `pathname` mapping so each post URL maps to a GitHub Discussion thread. No build-time data flow.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (66 posts) | Ovidius as-is with added category/video collections. Build time under 30 seconds. No optimization needed. |
| 200-500 posts | Consider incremental builds if available. Add pagination to category pages. Build still under 2 minutes. |
| 1000+ posts | Content Layer's 5x Markdown performance matters. May want to split images into remote storage. Build 3-5 minutes. |

### Scaling Priorities

1. **First bottleneck:** Image processing. 66 posts with feature images is fine, but image count grows faster than post count (inline images). Keep images in `src/assets/` for optimization but monitor build times.
2. **Second bottleneck:** Build time on Cloudflare Pages. Free tier has 500 builds/month, 20 concurrent builds. At current scale this is irrelevant. At 500+ posts, consider caching strategies.

## Anti-Patterns

### Anti-Pattern 1: Putting Blog Posts at Root-Level Routes

**What people do:** Create `src/pages/[slug].astro` for blog posts to match a WordPress root-level permalink structure (e.g., `/my-post/`).
**Why it's wrong:** Conflicts with the pages collection catch-all `[...id].astro`. Both routes try to claim the same URL space. Astro cannot resolve which dynamic route should handle `/about/` vs `/my-post/`.
**Do this instead:** Keep blog posts under `/blog/[id]`. If the WordPress site uses root-level post URLs, add a `_redirects` file for Cloudflare Pages to redirect old URLs. Alternatively, if root-level slugs are critical, remove the pages catch-all and create individual page files directly in `src/pages/` (e.g., `src/pages/about.astro`).

### Anti-Pattern 2: Storing Images in public/

**What people do:** Put all migrated WordPress images in `public/images/` for simplicity.
**Why it's wrong:** Images in `public/` are served as-is with no optimization -- no resizing, no WebP/AVIF conversion, no srcset generation. This defeats one of Astro's key advantages for content sites.
**Do this instead:** Put feature images and content images in `src/assets/images/`. Reference them from frontmatter using relative paths with the `image()` schema helper. Astro handles optimization automatically.

### Anti-Pattern 3: One Giant Content Collection

**What people do:** Put posts, pages, and videos all in a single `blog` collection with a `type` discriminator field.
**Why it's wrong:** Different content types have different schemas (videos need `youtubeId`, pages don't need `publishDate`). A union schema with lots of optionals loses type safety and makes queries complex.
**Do this instead:** Use separate collections (`blog`, `pages`, `videos`) with focused schemas. Query each independently.

### Anti-Pattern 4: Dynamic Category Data Source

**What people do:** Create a separate `categories.json` or `categories` collection to define all categories, then reference them from posts.
**Why it's wrong:** Over-engineering for a personal blog with 10 categories. Creates a synchronization problem (category exists in list but no posts use it, or post references non-existent category).
**Do this instead:** Derive categories from the posts themselves using `[...new Set(posts.map(p => p.data.category))]`. The category list is always in sync with actual content. Validate the category field with `z.enum()` if you want a fixed set.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudflare Pages | Git-triggered static deploys | Push to GitHub triggers build. Set `output: 'static'` in Astro config. No adapter needed for pure static. |
| Giscus (GitHub Discussions) | Client-side script tag on post pages | Requires GitHub repo with Discussions enabled. `data-mapping="pathname"` maps comments to URLs. |
| YouTube | Iframe embeds in video collection content | Use a `VideoEmbed` component for consistent styling. `youtubeId` in frontmatter, component builds embed URL. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Content Collections <-> Page Components | `getCollection()` / `getEntry()` API | Always async. Returns typed data per schema. |
| Page Components <-> Layout | Astro slot-based composition | Pages render inside `<BaseLayout>` via default slot. Layout receives `title`, `description`, `image` as props for `<head>`. |
| Site Config <-> Components | Direct TypeScript import | `import siteConfig from '../data/site-config'` -- no prop threading needed. |
| Blog Schema <-> Category Routes | Derived at build time | Categories are extracted from blog collection data, not stored separately. |

## Build Order (Dependencies)

The following build order reflects component dependencies. Earlier items must be complete before later items can work.

```
Phase 1: Foundation (no content dependencies)
  ├── Astro project setup + Ovidius theme installation
  ├── site-config.ts (branding, nav, hero, social links)
  ├── content.config.ts (schemas for blog, pages, videos)
  └── BaseLayout + core components (Header, Footer, Hero)

Phase 2: Content Migration (depends on Phase 1 schemas)
  ├── Download posts from WordPress (.md endpoints)
  ├── Transform frontmatter to match Zod schemas
  ├── Download and organize images into src/assets/
  ├── Migrate pages (about, contact, etc.)
  └── Migrate video content

Phase 3: Routing + Pages (depends on Phase 1 + 2)
  ├── Homepage (hero + featured + recent posts)
  ├── Blog listing with pagination
  ├── Individual blog post pages
  ├── Static pages via catch-all route
  ├── Category archive pages (NEW -- not in Ovidius)
  └── Video hub + individual video pages (NEW -- not in Ovidius)

Phase 4: Features + Polish (depends on Phase 3)
  ├── Giscus comment integration
  ├── RSS feed
  ├── Sitemap
  ├── SEO (OG images, canonical URLs, meta descriptions)
  ├── 404 page
  └── URL redirects / verification

Phase 5: Deploy (depends on Phase 4)
  ├── Cloudflare Pages setup
  ├── Custom domain configuration
  ├── URL redirect rules (if needed for WordPress URL compat)
  └── Final URL verification
```

**Dependency rationale:** Schemas must exist before content can be validated. Content must exist before routing pages can render it. Core pages must work before layering on features like comments and RSS. Everything must be verified before deploying to production.

## Sources

- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) -- HIGH confidence
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- HIGH confidence
- [Astro Routing Guide](https://docs.astro.build/en/guides/routing/) -- HIGH confidence
- [Astro 5.0 Release (Content Layer API)](https://astro.build/blog/astro-5/) -- HIGH confidence
- [Ovidius Theme GitHub Repository](https://github.com/JustGoodUI/ovidius-astro-theme) -- HIGH confidence (direct source inspection)
- [Astro WordPress Migration Guide](https://docs.astro.build/en/guides/migrate-to-astro/from-wordpress/) -- HIGH confidence
- [Astro Cloudflare Pages Deployment](https://docs.astro.build/en/guides/deploy/cloudflare/) -- HIGH confidence
- [Astro Images Guide](https://docs.astro.build/en/guides/images/) -- HIGH confidence
- [Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/) -- HIGH confidence
- [Giscus Integration Guides](https://astro-paper.pages.dev/posts/how-to-integrate-giscus-comments/) -- MEDIUM confidence (community source)

---
*Architecture research for: WordPress-to-Astro blog migration (joost.blog)*
*Researched: 2026-03-04*
