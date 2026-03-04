# Phase 4: SEO and Performance - Research

**Researched:** 2026-03-04
**Domain:** SEO metadata, structured data, OG image generation, YouTube facade embeds, performance optimization
**Confidence:** HIGH

## Summary

This phase adds production-quality SEO and performance optimizations to an Astro 5 blog. The existing codebase already has a solid SEO foundation in BaseHead.astro (OG tags, canonical URLs, meta descriptions, Twitter cards) -- this phase extends it with auto-generated OG images, JSON-LD structured data, a YouTube facade component, heading hierarchy enforcement, and a JS audit.

The primary technical challenge is build-time OG image generation using Satori + Sharp in Astro static endpoints. The approach uses `getStaticPaths()` in a `.png.ts` endpoint to generate one image per content entry at build time. For YouTube embeds, `@astro-community/astro-embed-youtube` is the clear choice -- it wraps `lite-youtube-embed`, uses `youtube-nocookie.com` by default (matching the existing privacy requirement), and ships zero JS until the user clicks play.

**Primary recommendation:** Use satori + satori-html + sharp for OG image generation via Astro static endpoints, astro-embed for YouTube facades, and hand-written JSON-LD components injected via `set:html` in BaseHead.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- OG images: Auto-generated at build time, 1200x675px, full-bleed featured image background with title text overlay, dark gradient scrim, "joost.blog" branding corner, fallback for posts without featured image (title on branded background)
- JSON-LD: Simple standalone blocks per page type -- Article on blog posts, VideoObject on video pages. No @graph approach yet
- Article schema fields: headline, author ("Joost de Valk", url: joost.blog), datePublished, dateModified, description, image
- VideoObject schema fields: name, description, thumbnailUrl, uploadDate, duration, embedUrl (from youtubeId/duration frontmatter)
- YouTube facade must maintain youtube-nocookie.com privacy-enhanced mode
- Heading hierarchy: strict -- no skipping levels, one h1 per page
- Existing SEO in BaseHead (canonical URLs, OG tags, meta descriptions) needs review/verification, not reimplementation
- Full Yoast-style @graph schema system deferred to separate phase

### Claude's Discretion
- YouTube facade library selection
- OG image typography and exact gradient treatment
- Fallback OG image design details
- JS audit approach for PERF-03 (zero unnecessary JS)
- Any minor SEO improvements discovered during implementation

### Deferred Ideas (OUT OF SCOPE)
- Full Yoast-style Schema.org module -- dedicated phase with @graph array, Organization, WebSite, WebPage, BreadcrumbList, SearchAction, Person pieces interconnected via @id references
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEO-01 | OpenGraph meta tags on all pages (title, description, image) | Already implemented in BaseHead.astro -- needs verification that all page types pass correct props |
| SEO-02 | Auto-generated OpenGraph images from post title/category at build time | Satori + Sharp endpoint pattern with getStaticPaths, documented in Architecture Patterns |
| SEO-03 | Canonical URLs on all pages | Already implemented in BaseHead.astro with formatCanonicalURL -- needs verification |
| SEO-04 | Meta descriptions from post excerpts/frontmatter | Already wired in BaseHead via description prop -- needs verification across all page types |
| SEO-05 | Structured data (Article JSON-LD) on blog posts | JSON-LD component pattern with set:html, documented in Architecture Patterns |
| SEO-06 | Proper heading hierarchy throughout templates | Audit all 7 page templates, documented in Common Pitfalls |
| PERF-02 | YouTube embeds use facade pattern | astro-embed YouTube component, documented in Standard Stack |
| PERF-03 | Zero unnecessary JavaScript shipped | JS audit of all pages, Astro islands pattern enforcement |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| satori | latest | Convert HTML/CSS to SVG for OG images | Vercel's official library, used by Next.js OG, de facto standard |
| satori-html | latest | Write HTML templates as template literals for satori | Needed because Astro endpoints don't support JSX/TSX |
| sharp | latest | Convert SVG to PNG/JPEG for OG images | Industry standard image processing, already used by Astro internally |
| @astro-community/astro-embed-youtube | latest | YouTube facade/lite embed component | Official Astro community package, wraps lite-youtube-embed, uses youtube-nocookie.com by default |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | -- | JSON-LD structured data | Hand-write as Astro component -- no library needed for simple standalone schemas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| astro-embed | lite-youtube-embed directly | astro-embed wraps lite-youtube-embed with Astro-native DX, auto-fetches poster images, and uses nocookie by default -- no reason to go lower level |
| astro-embed | Custom facade component | Would need to handle thumbnail fetching, play button, iframe lazy loading manually -- reinventing the wheel |
| satori-html | React JSX | Astro .ts endpoints don't support TSX; satori-html provides equivalent template literal approach |

**Installation:**
```bash
npm install satori satori-html sharp @astro-community/astro-embed-youtube
```

## Architecture Patterns

### OG Image Generation Endpoint

**File:** `src/pages/og/[...slug].png.ts`

**What:** A static Astro endpoint that generates PNG OG images for every content entry at build time using getStaticPaths.

**Pattern:**
```typescript
// src/pages/og/[...slug].png.ts
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { html } from 'satori-html';
import sharp from 'sharp';

export async function getStaticPaths() {
    const posts = await getCollection('blog');
    const pages = await getCollection('pages');
    // Return paths for all content that needs OG images
    return [
        ...posts.map(post => ({
            params: { slug: post.id },
            props: { title: post.data.title, image: post.data.featureImage }
        })),
        ...pages.map(page => ({
            params: { slug: page.id },
            props: { title: page.data.title, image: page.data.featureImage }
        })),
    ];
}

export async function GET({ props }: APIContext) {
    const { title } = props;
    // Load font as Buffer (satori requires TTF/OTF, NOT woff2)
    const fontData = readFileSync(`${process.cwd()}/public/fonts/YourFont-Bold.ttf`);

    // For background images: read as Buffer and pass to img src
    // For featured image: read from filesystem, convert to base64 data URL

    const markup = html`
        <div style="width: 1200px; height: 675px; display: flex; position: relative; background: #1e293b;">
            <!-- Background image if available -->
            <!-- Dark gradient scrim -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50%; background: linear-gradient(transparent, rgba(0,0,0,0.8)); display: flex;"></div>
            <!-- Title text -->
            <div style="position: absolute; bottom: 60px; left: 60px; right: 60px; color: white; font-size: 48px; display: flex;">
                ${title}
            </div>
            <!-- Branding -->
            <div style="position: absolute; top: 30px; right: 40px; color: white; font-size: 24px; display: flex;">
                joost.blog
            </div>
        </div>
    `;

    const svg = await satori(markup, {
        width: 1200,
        height: 675,
        fonts: [{ name: 'YourFont', data: fontData, style: 'normal', weight: 700 }],
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(png, {
        headers: { 'Content-Type': 'image/png' },
    });
}
```

**How to reference from BaseHead:**
```typescript
// In BaseHead.astro or the page that calls BaseHead
// For blog posts: /og/{post-id}.png
// For pages: /og/{page-id}.png
const ogImageUrl = new URL(`/og/${entry.id}.png`, Astro.site).toString();
```

### JSON-LD Component Pattern

**File:** `src/components/JsonLd.astro`

**What:** A reusable component that accepts a schema object and injects it safely into the page head.

**Pattern:**
```astro
---
// src/components/JsonLd.astro
interface Props {
    schema: Record<string, unknown>;
}
const { schema } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

**Usage in blog post pages:**
```astro
---
// In [slug].astro for blog posts
const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blogData.title,
    "author": {
        "@type": "Person",
        "name": "Joost de Valk",
        "url": "https://joost.blog"
    },
    "datePublished": blogData.publishDate.toISOString(),
    ...(blogData.updatedDate && {
        "dateModified": blogData.updatedDate.toISOString()
    }),
    "description": blogData.excerpt ?? blogData.seo?.description ?? "",
    "image": ogImageUrl
};
---
<JsonLd schema={articleSchema} />
```

**Usage in video pages:**
```astro
---
const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.data.title,
    "description": video.data.title,  // videos have limited description
    "thumbnailUrl": `https://img.youtube.com/vi/${video.data.youtubeId}/maxresdefault.jpg`,
    "uploadDate": video.data.publishDate.toISOString(),
    ...(video.data.duration && { "duration": video.data.duration }),
    ...(video.data.youtubeId && {
        "embedUrl": `https://www.youtube-nocookie.com/embed/${video.data.youtubeId}`
    })
};
---
<JsonLd schema={videoSchema} />
```

### YouTube Facade Replacement

**What:** Replace the current `YouTubeEmbed.astro` iframe component with astro-embed's YouTube component.

**Current (YouTubeEmbed.astro):**
```astro
<iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} ... />
```

**New pattern:**
```astro
---
import { YouTube } from 'astro-embed';
---
<YouTube id={youtubeId} title={title} />
```

**Key facts about astro-embed YouTube:**
- Uses `youtube-nocookie.com` by default (matches existing privacy requirement)
- Shows static thumbnail until user clicks (no iframe loaded initially)
- Based on lite-youtube-embed custom element
- Supports `posterQuality` prop ('max', 'high', 'default', 'low')
- Supports `params` prop for player parameters (string, URL search params format)
- Zero JS shipped until interaction

### Recommended File Structure
```
src/
├── components/
│   ├── JsonLd.astro              # Reusable JSON-LD injection component
│   └── YouTubeEmbed.astro        # Replace contents with astro-embed wrapper
├── pages/
│   └── og/
│       └── [...slug].png.ts      # OG image generation endpoint
└── utils/
    └── og-image.ts               # Satori markup helpers, font loading, shared config
```

### Anti-Patterns to Avoid
- **Don't use `is:inline` script tags for JSON-LD:** Use `set:html` directive on `<script type="application/ld+json">` -- it prevents double-escaping while maintaining safety
- **Don't use woff2 fonts with Satori:** Satori only supports TTF and OTF font formats. The project uses Mona Sans woff2 for web display, but you need the TTF version for OG images
- **Don't generate OG images at runtime:** This is a static site for Cloudflare Pages -- all images must be generated at build time via `getStaticPaths()`
- **Don't use string interpolation for JSON-LD:** Always use `JSON.stringify()` with `set:html` to prevent XSS and ensure proper escaping

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YouTube facade/lite embed | Custom thumbnail + click-to-load iframe | @astro-community/astro-embed-youtube | Handles poster image fetching, play button styling, accessible labels, nocookie mode, and progressive enhancement |
| SVG-to-image conversion | Canvas rendering or browser automation | satori + sharp | Satori handles HTML/CSS-to-SVG without a browser; sharp handles format conversion efficiently |
| HTML template for satori | React JSX in .ts files | satori-html | Provides template literal syntax that outputs satori-compatible VNodes without needing TSX support |

**Key insight:** OG image generation seems simple but has many edge cases: font embedding (must be TTF/OTF buffers), image embedding (must be base64 data URLs or Buffers for background images), CSS subset support (satori only supports a subset of CSS -- mainly flexbox layout), and text wrapping/overflow. Using satori + satori-html handles these correctly.

## Common Pitfalls

### Pitfall 1: Satori CSS Limitations
**What goes wrong:** Satori only supports a subset of CSS. Grid layout, CSS variables, `calc()`, advanced selectors, and many properties don't work.
**Why it happens:** Satori renders to SVG without a browser engine -- it implements its own CSS layout (flexbox only).
**How to avoid:** Use only flexbox layouts (`display: flex`), absolute positioning, and basic properties (color, fontSize, fontWeight, padding, margin, border, borderRadius, background, backgroundImage, position). Every container that has children needs `display: flex`.
**Warning signs:** Blank or broken OG images, elements not appearing.

### Pitfall 2: Font Format for Satori
**What goes wrong:** Satori silently fails or throws errors when given woff2 fonts.
**Why it happens:** Satori requires raw TTF or OTF font data as ArrayBuffer/Buffer. It cannot decode woff2.
**How to avoid:** Download the TTF version of Mona Sans (or chosen font) and store in `public/fonts/`. The project already uses `@fontsource-variable/mona-sans` for web display -- the OG generator needs the TTF separately.
**Warning signs:** OG images render with no visible text.

### Pitfall 3: Background Image Embedding in Satori
**What goes wrong:** Images referenced by URL don't work in satori at build time.
**Why it happens:** Satori runs in Node.js at build time -- it can't fetch remote URLs or resolve Astro asset pipeline paths.
**How to avoid:** Read images from the filesystem with `fs.readFileSync()`, convert to base64 data URL or pass raw Buffer to `img` src. For featured images from content collections, resolve the image path at build time.
**Warning signs:** OG images render with no background image.

### Pitfall 4: Missing Descriptions on Non-Blog Pages
**What goes wrong:** Pages without explicit descriptions get empty meta description tags.
**Why it happens:** Only blog posts have `excerpt` in frontmatter. Category pages, blog listing, videos index, and 404 may pass empty descriptions.
**How to avoid:** Audit every page template to ensure a meaningful description is always passed to BaseLayout. The current category page passes `Posts in the ${categoryName} category` which is fine. Check videos/index.astro and 404.astro.
**Warning signs:** Empty `<meta name="description" content="" />` in rendered HTML.

### Pitfall 5: Heading Hierarchy Violations
**What goes wrong:** Skipped heading levels (h1 directly to h3) or multiple h1 tags on a page.
**Why it happens:** Markdown content inside blog posts can use any heading level, and components may introduce their own headings.
**How to avoid:** Audit all page templates for correct heading nesting. The 404 page currently uses h1 + h2 + h3 (correct). Blog posts use h1 for title, h2 for "Related Posts" -- but markdown content may start with h2 or jump levels. Consider documenting heading conventions rather than trying to enforce at build time.
**Warning signs:** Accessibility audit tools flagging heading hierarchy issues.

### Pitfall 6: OG Image Dimensions
**What goes wrong:** CONTEXT.md specifies 1200x675 but standard OG image size is 1200x630 (1.91:1 ratio).
**Why it happens:** 1200x675 is 16:9 ratio which is also common for social sharing.
**How to avoid:** Use 1200x675 as specified in the locked decisions. Both dimensions work fine for social platforms. Facebook/LinkedIn prefer 1.91:1 (1200x630) but will crop/letterbox 16:9 acceptably.
**Warning signs:** Images appearing cropped on some social platforms.

## Code Examples

### Verified: JSON-LD injection with set:html
```astro
<!-- Source: Astro community pattern, verified across multiple sources -->
<script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "author": { "@type": "Person", "name": "Joost de Valk", "url": "https://joost.blog" },
    "datePublished": publishDate.toISOString(),
    "description": description,
    "image": ogImageUrl
})} />
```

### Verified: astro-embed YouTube usage
```astro
<!-- Source: https://astro-embed.netlify.app/components/youtube/ -->
---
import { YouTube } from 'astro-embed';

interface Props {
    youtubeId: string;
    title: string;
}

const { youtubeId, title } = Astro.props;
---
<div class="aspect-video w-full">
    <YouTube id={youtubeId} title={title} posterQuality="max" />
</div>
```

### Verified: Satori with background image
```typescript
// Source: https://mvlanga.com/blog/generating-open-graph-images-in-astro/
import { readFileSync } from 'node:fs';

// Read image as Buffer for satori img element
const bgBuffer = readFileSync(`${process.cwd()}/path/to/image.png`);

// Use in satori markup (object notation):
const bgElement = {
    type: 'img',
    props: {
        src: bgBuffer.buffer,
        style: { position: 'absolute', width: '1200px', height: '675px', objectFit: 'cover' },
    },
};

// Or with satori-html template literal:
// Convert to base64 data URL first
const base64 = bgBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;
// Then use as background-image or img src
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| puppeteer/playwright for OG images | satori + sharp (no browser needed) | 2022+ | 10x faster, no browser dependency, works in serverless/edge |
| Full YouTube iframe on page load | lite-youtube-embed / astro-embed facade | 2020+ | Eliminates ~500KB+ initial JS/network per embed |
| Schema.org microdata in HTML | JSON-LD script blocks | 2015+ Google recommendation | Cleaner separation, easier to maintain, Google prefers JSON-LD |
| getEntryBySlug() in Astro 4 | getEntry(collection, id) in Astro 5 | Astro 5.0 (2024) | API changed from slug-based to id-based |

**Deprecated/outdated:**
- `getEntryBySlug()`: Removed in Astro 5 -- use `getEntry()` or `getCollection()` with `.id`
- Schema.org microdata: Still valid but JSON-LD is Google's recommended format
- Direct YouTube iframe embeds: Massive performance cost, facade pattern is standard practice

## Open Questions

1. **Featured image resolution for OG backgrounds**
   - What we know: Featured images are processed by Astro's asset pipeline (ImageMetadata objects). Satori needs raw file buffers.
   - What's unclear: How to resolve Astro's ImageMetadata to a filesystem path at build time for reading with `fs.readFileSync()`. The image `src` property contains a hashed URL after processing.
   - Recommendation: For OG generation, resolve the original source path from the content directory (e.g., `./src/content/blog/{post-id}/images/{filename}`) rather than going through Astro's image pipeline. Alternatively, read the source image and use sharp to resize within the OG endpoint.

2. **Font file for OG images**
   - What we know: The site uses Mona Sans (woff2 via @fontsource-variable). Satori needs TTF.
   - What's unclear: Whether the @fontsource-variable package includes a TTF version that can be referenced.
   - Recommendation: Download Mona Sans TTF from the GitHub Releases (github.com/github/mona-sans) and place in `public/fonts/`. This is separate from the web font.

3. **Videos without youtubeId**
   - What we know: Some video entries have `videoUrl` (wordpress.tv) instead of `youtubeId`. These cannot use the YouTube facade or get VideoObject schema with embedUrl.
   - What's unclear: Whether these should get any special treatment.
   - Recommendation: Only add VideoObject schema for videos with youtubeId. Videos with only videoUrl can link out but won't benefit from facade or structured data.

## Sources

### Primary (HIGH confidence)
- [Astro Embed YouTube docs](https://astro-embed.netlify.app/components/youtube/) - Installation, props, nocookie default behavior
- [Astro content collections API](https://docs.astro.build/en/reference/modules/astro-content/) - Astro 5 getCollection/getEntry API

### Secondary (MEDIUM confidence)
- [Static OG Images in Astro (arne.me)](https://arne.me/blog/static-og-images-in-astro/) - Satori + Sharp endpoint pattern, font handling
- [OG Images in Astro (mvlanga.com)](https://mvlanga.com/blog/generating-open-graph-images-in-astro/) - Background image handling, getStaticPaths pattern
- [Dynamic OG images using Satori (rumaan.dev)](https://rumaan.dev/blog/open-graph-images-using-satori) - satori-html usage, endpoint structure
- [Adding structured data in Astro (frodeflaten.com)](https://frodeflaten.com/posts/adding-structured-data-to-blog-posts-using-astro/) - JSON-LD component pattern, set:html usage
- [JSON-LD in Astro (johndalesandro.com)](https://johndalesandro.com/blog/astro-add-json-ld-structured-data-to-your-website-for-rich-search-results/) - Article schema fields

### Tertiary (LOW confidence)
- Satori CSS support limitations: Based on community reports and satori GitHub README, not exhaustively verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - satori/sharp/astro-embed are well-established, widely documented
- Architecture: HIGH - Patterns verified across multiple independent sources, compatible with existing codebase
- Pitfalls: HIGH - Font format, CSS limitations, image embedding issues are consistently reported
- OG image background image resolution: MEDIUM - Multiple approaches documented but Astro 5 content collection image path resolution needs implementation-time verification

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable domain, libraries are mature)
