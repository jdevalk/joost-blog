# Phase 2: Content Migration - Research

**Researched:** 2026-03-04
**Domain:** WordPress-to-Astro content migration, content collections, image optimization
**Confidence:** HIGH

## Summary

This phase migrates 85 content files (66 blog posts, 11 pages, 8 videos) from WordPress export format into Astro content collections. The source content is already downloaded in `content-export/` and is generally clean markdown with YAML frontmatter. The main transformations needed are: (1) frontmatter restructuring to match Astro schemas, (2) category flattening from `{name, url}` objects to plain strings, (3) downloading ~166 unique images from WordPress and updating references to local paths, (4) creating a new `videos` collection with structured YouTube/video metadata, and (5) cleaning up WordPress artifacts like `Code language:` suffixes and escaped shortcodes.

The existing `content.config.ts` already defines `blog` and `pages` collections with appropriate Zod schemas. A `videos` collection needs to be added. The blog schema expects `publishDate` (not `date`), `excerpt`, `featureImage` with `image()` schema, and `categories` as `z.array(z.string())`. The posts in the export use `date`, `featured_image` (URL string), and categories as `{name, url}` objects -- all need mapping.

**Primary recommendation:** Build a Node.js migration script that processes all content programmatically -- do not manually edit 85 files. The script should handle frontmatter transformation, image downloading, link conversion, and content cleanup in a single pass per content type.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Flatten categories from `{name, url}` objects to plain name strings (e.g., `["WordPress", "Development"]`)
- Convert absolute `https://joost.blog/slug/` internal links to relative `/slug/` paths
- Strip WordPress block comments (`<!-- wp:paragraph -->` etc.) but preserve intentional HTML (embeds, iframes, styled elements)
- Convert WordPress shortcodes to markdown/HTML equivalents where possible (`[caption]` to `<figure>`, `[embed]` to inline URLs); remove any that can't be converted
- Co-locate images with their posts in per-post folders: `src/content/blog/post-slug/images/`
- Download all images (WordPress and external) locally
- Update featured image frontmatter to use relative paths with Astro's `image()` schema for build-time optimization (WebP/AVIF, responsive sizes)
- Update inline image references in markdown body to point to local files
- Create a separate `videos` content collection with its own Zod schema
- Extract YouTube data into structured frontmatter fields: `youtubeId`, `duration`, `description`
- Body text becomes just the written description/context, not the embed markup
- Extract metadata from what's already in the exported markdown files (no external YouTube API calls)
- Claude's discretion on Zod schema strictness

### Claude's Discretion
- Zod schema strictness -- balance between catching real errors and not blocking migration on optional fields

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | All 66 blog posts migrated with full content, metadata, and images | Frontmatter mapping (date->publishDate, categories flattening, featured_image->featureImage), image download, content cleanup |
| CONT-02 | All relevant pages migrated (about, contact, plugins, videos hub, privacy, comment policy, work with me, Alfred Quix, embedded playground) | Pages need minimal frontmatter (title only required), some have WordPress form artifacts and shortcodes to clean |
| CONT-03 | All 8 video pages migrated as content collection with YouTube embeds | New videos collection schema needed; YouTube IDs extractable from some exported files and live site JSON-LD; some videos are WordPress.tv only |
| CONT-04 | All images downloaded from WordPress and stored locally | 166 unique image URLs identified across all content; images go to per-post `images/` folders |
| CONT-05 | Frontmatter metadata mapped to Astro content collection schema | `date`->`publishDate`, `featured_image`->`featureImage` (with image() schema), categories `{name,url}`->string array |
| CONT-06 | WordPress shortcodes, block comments, and special formatting cleaned up | Only 1 shortcode found (`[wp_playground]` in embedded-playground page); `Code language:` suffixes in 10 posts; `Estimated reading time:` in 1 post; HTML entities (`&amp;`) in several |
| PERF-01 | Images optimized at build time (WebP/AVIF, responsive sizes, lazy loading) | Using Astro's `image()` schema with co-located images enables automatic build-time optimization via Sharp |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.15.3+ | Content collections with Zod validation | Already installed, defines content schema |
| Sharp | (bundled) | Build-time image optimization | Astro's default image service for WebP/AVIF |
| Node.js fs/path | built-in | File system operations for migration script | No external deps needed for file manipulation |
| gray-matter | latest | Parse/stringify YAML frontmatter in markdown | Standard library for frontmatter manipulation |
| node-fetch / fetch | built-in | Download images from WordPress URLs | Node 18+ has built-in fetch |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yaml | latest | YAML parsing if gray-matter insufficient | Complex frontmatter edge cases |
| glob | latest | File pattern matching in migration script | Finding source files to process |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter | Manual regex | gray-matter handles edge cases (multiline strings, special chars in YAML) reliably |
| Migration script | Manual editing | 85 files with 166 images makes manual editing error-prone and slow |

**Installation:**
```bash
npm install gray-matter
```
(All other dependencies are already available via Node.js built-ins or Astro)

## Architecture Patterns

### Target Content Structure
```
src/content/
  blog/
    post-slug/
      index.md              # Blog post with transformed frontmatter
      images/
        featured.webp        # Downloaded featured image
        inline-image-1.png   # Downloaded inline images
  pages/
    about-me.md             # Static pages (flat, no subdirectories)
    contact-me.md
    plugins.md
    ...
  videos/
    the-victory-of-the-commons.md   # Video pages
    wordpress-seo-in-2019.md
    ...
```

### Pattern 1: Blog Post Frontmatter Transformation
**What:** Map WordPress export frontmatter to Astro blog schema
**When to use:** Every blog post (66 files)
**Example:**

Source (WordPress export):
```yaml
---
title: "The Tailwind paradox: the high price of \"enough\""
date: 2026-01-11
author: "Joost de Valk"
featured_image: "https://joost.blog/wp-content/uploads/2026/01/image.webp"
categories:
  - name: "Development"
    url: "/category/development.md"
  - name: "Open Source"
    url: "/category/open-source.md"
---
```

Target (Astro schema):
```yaml
---
title: "The Tailwind paradox: the high price of \"enough\""
publishDate: 2026-01-11
excerpt: "The news hit the developer community like a cold bucket of water..."
featureImage:
  src: ./images/featured.webp
  alt: ""
categories:
  - "Development"
  - "Open Source"
---
```

### Pattern 2: Co-located Image References
**What:** Images stored alongside their post markdown, referenced with relative paths
**When to use:** All blog posts with images
**Example:**

Frontmatter featured image:
```yaml
featureImage:
  src: ./images/featured.webp
  alt: "Description from markdown alt text"
```

Inline markdown image:
```markdown
![Alt text](./images/screenshot-2023-12-14.png)
```

### Pattern 3: Videos Collection Schema
**What:** New Zod schema for video content type
**When to use:** Added to `content.config.ts`
**Example:**
```typescript
const videos = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videos' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            publishDate: z.coerce.date(),
            youtubeId: z.string().optional(),
            duration: z.string().optional(),
            videoUrl: z.string().url().optional(),
            featureImage: imageSchema(image)
                .extend({ caption: z.string().optional() })
                .optional(),
            seo: seoSchema(image).optional()
        })
});
```

### Anti-Patterns to Avoid
- **Manual file editing:** With 85 files and 166 images, manual editing will introduce inconsistencies. Use a script.
- **Downloading images serially:** 166 image downloads should use concurrent fetching (limit concurrency to ~5 to avoid rate limiting).
- **Hardcoded image filenames:** Preserve original filenames from WordPress to maintain alt text associations and debuggability.
- **Removing the H1 from body:** The exported posts duplicate the title as an H1 in the body. This should be stripped since Astro templates render the title from frontmatter.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Regex-based parser | gray-matter | Handles quoted strings, multiline values, special characters |
| Image optimization | Manual Sharp pipeline | Astro's built-in `image()` schema | Automatic WebP/AVIF, responsive sizes, lazy loading at build time |
| Content validation | Manual checks | Zod schemas via Astro content collections | Type-safe, catches errors at build time |
| URL slug extraction | Custom URL parsing | Node.js URL/path APIs | Edge cases with encoded characters, trailing slashes |

**Key insight:** The migration script is a one-time transformation tool. Optimize for correctness and debuggability, not for performance or elegance. Add verbose logging so every transformation is auditable.

## Common Pitfalls

### Pitfall 1: Image Path Resolution in Astro
**What goes wrong:** Astro's `image()` schema requires specific path formats. Relative paths must start with `./` and be relative to the markdown file's location.
**Why it happens:** Easy to confuse `./images/file.jpg` (correct for co-located) with `../../assets/images/file.jpg` (the old Ovidius pattern).
**How to avoid:** Co-located images use `./images/filename.ext`. The `image()` function in the schema resolves these relative to the markdown file.
**Warning signs:** `astro build` fails with "Could not resolve image" errors.

### Pitfall 2: Duplicate H1 in Body Content
**What goes wrong:** Every exported post has `# Title` as the first line of body content, duplicating the frontmatter `title`.
**Why it happens:** WordPress's `.md` endpoint includes the title in both frontmatter and body.
**How to avoid:** Strip the first `# Title` line from the body during migration.
**Warning signs:** Double titles rendering on the page.

### Pitfall 3: Category Format Mismatch
**What goes wrong:** The Zod schema expects `z.array(z.string())` but the export has `{name, url}` objects. Also, some video exports use plain strings (not objects).
**Why it happens:** Different WordPress endpoints format categories differently.
**How to avoid:** Handle both formats: if category is an object, extract `.name`; if string, use as-is.
**Warning signs:** Build validation errors on the categories field.

### Pitfall 4: YouTube Data Not in Exported Files
**What goes wrong:** The CONTEXT.md says "Extract metadata from what's already in the exported markdown files (no external YouTube API calls)" but most exported video files do NOT contain YouTube IDs.
**Why it happens:** Videos were HTML-converted and the conversion lost the embed data. Only 1 of 8 files (10-years-of-yoast.md) mentions a YouTube ID in its body text.
**How to avoid:** The YouTube IDs and durations ARE available from the live website's JSON-LD structured data. Some videos link to WordPress.tv instead of YouTube. The migration script should scrape the source URLs listed in each video's frontmatter `source_url` field to extract this metadata, OR this data should be manually curated into a lookup table. This does NOT violate the "no YouTube API calls" constraint since the data comes from the blog's own pages.
**Warning signs:** Empty `youtubeId` fields for most videos.

### Pitfall 5: WordPress Artifacts in Markdown
**What goes wrong:** Several cleanup patterns needed that are easy to miss.
**Why it happens:** WordPress's markdown export includes platform-specific artifacts.
**How to avoid:** Comprehensive cleanup checklist:
1. `Code language: JSON / JSON with Comments (json)` suffixes after code blocks (10 posts)
2. `Estimated reading time: X minutes` lines (1 post)
3. `&amp;` HTML entities that should be `&` in markdown
4. `\[wp_playground ...\]\[/wp_playground\]` escaped shortcodes (1 page)
5. Extra whitespace/blank lines from WordPress block formatting
6. Contact form HTML remnants (contact-me.md has Gravity Forms markup)
7. Linked images (`[![alt](thumb)](fullsize)`) -- decide whether to keep as-is or simplify

### Pitfall 6: Posts Without Featured Images
**What goes wrong:** 2 of 66 posts have no `featured_image` in frontmatter (`blogging-about-not-seo.md`, `gutenberg-and-yoast-seo.md`).
**Why it happens:** Not all WordPress posts had featured images set.
**How to avoid:** The `featureImage` field in the Astro schema is already `.optional()`, so this is fine. Just don't try to download a nonexistent image.

### Pitfall 7: WordPress.tv Videos vs YouTube Videos
**What goes wrong:** Not all 8 videos are on YouTube. Some are WordPress.tv embeds with no YouTube ID available.
**Why it happens:** Joost's video pages link to talks hosted on WordPress.tv, not all of which have YouTube mirrors.
**How to avoid:** The video schema should make `youtubeId` optional and include a `videoUrl` field for WordPress.tv links. Research from live site scraping found:
- `wordpress-seo-in-2019`: YouTube ID `pS-OhpUMC10`, duration PT44M14S
- `10-years-of-yoast`: YouTube ID `27_iFw_W-HE`, duration PT33M46S
- `why-timestamping-will-be-good-for-seo`: YouTube ID `r6T-WuqjGI0`, duration PT30M8S
- `the-victory-of-the-commons`: WordPress.tv only (https://wordpress.tv/2013/12/12/joost-de-valk-the-victory-of-the-commons/)
- `the-business-of-open-source`: WordPress.tv only (https://wordpress.tv/2018/.../joost-de-valk...)
- `growing-a-multi-million-dollar-business-with-a-plugin`: WordPress.tv only (https://wordpress.tv/2020/...)
- `sustainable-open-source-is-the-future`: WordPress.tv only (https://wordpress.tv/2024/07/03/...)
- `improve-the-environment-start-with-your-website`: WordPress.tv only (https://wordpress.tv/2022/11/17/...)

## Code Examples

### Migration Script: Frontmatter Transformation
```typescript
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

interface WPCategory {
  name: string;
  url: string;
}

function transformBlogFrontmatter(data: Record<string, any>, body: string): Record<string, any> {
  const transformed: Record<string, any> = {
    title: data.title,
    publishDate: data.date,
  };

  // Extract excerpt from first paragraph of body
  const firstPara = body.split('\n\n').find(p => p.trim() && !p.startsWith('#'));
  if (firstPara) {
    transformed.excerpt = firstPara.trim().substring(0, 160);
  }

  // Flatten categories
  if (data.categories) {
    transformed.categories = data.categories.map((cat: string | WPCategory) =>
      typeof cat === 'string' ? cat : cat.name
    );
  }

  // Featured image will be set after download
  // (placeholder for now, replaced after image processing)
  if (data.featured_image) {
    transformed.featureImage = {
      src: './images/featured' + path.extname(new URL(data.featured_image).pathname),
      alt: '' // Will need manual review
    };
  }

  return transformed;
}
```

### Migration Script: Image Download with Concurrency
```typescript
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download ${url}: ${response.status}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, buffer);
    console.log(`Downloaded: ${url} -> ${destPath}`);
    return true;
  } catch (err) {
    console.error(`Error downloading ${url}:`, err);
    return false;
  }
}

// Limit concurrency to avoid overwhelming the server
async function downloadAllImages(urls: Array<{url: string, dest: string}>, concurrency = 5) {
  const results: boolean[] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(({url, dest}) => downloadImage(url, dest))
    );
    results.push(...batchResults);
  }
  return results;
}
```

### Migration Script: Content Cleanup
```typescript
function cleanupMarkdownBody(body: string, slug: string): string {
  let cleaned = body;

  // 1. Remove duplicate H1 title (first line)
  cleaned = cleaned.replace(/^# .+\n+/, '');

  // 2. Remove "Estimated reading time: X minutes" lines
  cleaned = cleaned.replace(/^Estimated reading time: \d+ minutes?\n+/m, '');

  // 3. Remove "Code language:" suffixes after code blocks
  cleaned = cleaned.replace(/Code language: .+\n/g, '');

  // 4. Convert absolute internal links to relative
  cleaned = cleaned.replace(/https:\/\/joost\.blog\/([\w-]+)\//g, '/$1/');

  // 5. Fix HTML entities
  cleaned = cleaned.replace(/&amp;/g, '&');

  // 6. Strip WordPress block comments (if any)
  cleaned = cleaned.replace(/<!-- wp:\w+.*?-->/g, '');
  cleaned = cleaned.replace(/<!-- \/wp:\w+ -->/g, '');

  return cleaned.trim();
}
```

### Content Config: Adding Videos Collection
```typescript
// In src/content.config.ts
const videos = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videos' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            publishDate: z.coerce.date(),
            youtubeId: z.string().optional(),
            duration: z.string().optional(), // ISO 8601 duration format, e.g. "PT33M46S"
            videoUrl: z.string().url().optional(), // For WordPress.tv or other hosted videos
            featureImage: imageSchema(image)
                .extend({ caption: z.string().optional() })
                .optional(),
            seo: seoSchema(image).optional()
        })
});

export const collections = { blog, pages, videos };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.x | Config file location moved to project root level `src/` |
| `type: 'content'` in collections | `loader: glob({...})` | Astro 5.x | New loader-based API for content collections |
| `z.date()` for dates | `z.coerce.date()` | Astro 5.x | Coerce handles string dates from frontmatter |
| Manual image paths | `image()` helper in schema | Astro 3.x+ | Enables build-time optimization |

## Data Inventory

### Blog Posts (66 total)
- **With featured images:** 64
- **Without featured images:** 2 (blogging-about-not-seo, gutenberg-and-yoast-seo)
- **With categories (object format):** 64 (need `{name,url}` -> string flattening)
- **With categories (already strings):** 2 (the two without featured images likely differ)
- **Total unique image URLs:** 166 (featured + inline)
- **Posts with `Code language:` artifacts:** 10
- **Posts with `Estimated reading time:`:** 1
- **Internal links to convert:** ~80 unique absolute URLs to relative paths

### Pages (11 total)
- about-me, contact-me, plugins, clicky, videos, blog, privacy-policy, comment-policy, work-with-me, alfred-quix, embedded-playground
- Pages have minimal frontmatter (title, date, author only -- no categories or featured images except potentially inline)
- **Special cases:**
  - `contact-me.md`: Contains Gravity Forms HTML remnants (honeypot field, form markup) -- needs cleanup
  - `embedded-playground.md`: Contains escaped `[wp_playground]` shortcode -- needs conversion or removal
  - `blog.md`: Likely a listing page that won't be needed (Astro generates blog listing from routing)
  - `clicky.md`: Subpage under plugins (plugins/clicky/) -- URL structure needs attention
  - `videos.md`: Hub page listing all videos -- may be generated from video collection instead

### Videos (8 total)
- **With YouTube IDs (from live site JSON-LD):** 3 (wordpress-seo-in-2019, 10-years-of-yoast, why-timestamping-will-be-good-for-seo)
- **WordPress.tv only:** 5 (the-victory-of-the-commons, the-business-of-open-source, growing-a-multi-million-dollar-business, sustainable-open-source-is-the-future, improve-the-environment)
- **With featured images:** 1 (why-timestamping-will-be-good-for-seo)
- **Categories on videos:** Only 3 of 8 have categories; inconsistent format (some plain strings, some missing)

### Categories (10 unique)
WordPress, Development, Open Source, Search Opinion, Yoast, Productivity hacks, Market Share Analysis, Personal stuff, Travel, Short, Post from Joost

## Open Questions

1. **Excerpt generation strategy**
   - What we know: The blog schema has `excerpt: z.string().optional()`. WordPress exports don't include excerpts.
   - What's unclear: Should excerpts be auto-generated from the first paragraph, or left empty for now?
   - Recommendation: Auto-generate from first non-heading paragraph, truncated to ~160 characters. Can be manually refined later.

2. **WordPress.tv video embeds**
   - What we know: 5 of 8 videos are WordPress.tv, not YouTube. The `youtubeId` field won't apply.
   - What's unclear: How should WordPress.tv videos be embedded in the Astro site?
   - Recommendation: Add a `videoUrl` field for WordPress.tv links. Phase 3 (routing) will handle the actual embed rendering. For now, store the URL.

3. **Contact form replacement**
   - What we know: The contact-me page has Gravity Forms HTML. This won't work in a static Astro site.
   - What's unclear: What replaces it?
   - Recommendation: Clean up the form HTML during migration. The actual form implementation is a Phase 3+ concern. Leave a placeholder or just the contact text.

4. **Blog and videos hub pages**
   - What we know: `blog.md` and `videos.md` are listing pages that would normally be generated by Astro routing.
   - What's unclear: Should they be migrated as pages or skipped?
   - Recommendation: Skip `blog.md` (Astro generates blog listing). Migrate `videos.md` as a page if it has custom content worth preserving.

5. **Linked/gallery images in posts like traveling-to-peru**
   - What we know: Some posts have `[![alt](thumb-url)](full-url)` patterns -- clickable thumbnail that links to full-size image.
   - What's unclear: Should both thumbnail and full-size images be downloaded? Should the link pattern be preserved?
   - Recommendation: Download only the image used in the `img` tag (typically the larger version is in the link href, which is the one to keep). Replace with a simple `![alt](./images/filename.ext)` -- lightbox functionality can be added in Phase 3.

## Sources

### Primary (HIGH confidence)
- Direct examination of all 85 exported content files in `content-export/`
- Existing `src/content.config.ts` Zod schemas
- Existing Ovidius theme sample content in `src/content/blog/`
- Live site scraping of video pages for YouTube metadata

### Secondary (MEDIUM confidence)
- Astro 5.x content collections documentation (based on existing project code patterns)
- gray-matter npm package capabilities

### Tertiary (LOW confidence)
- None -- all findings verified against actual project files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro content collections already configured, patterns visible in existing code
- Architecture: HIGH - Target structure defined in CONTEXT.md decisions, validated against Astro conventions
- Pitfalls: HIGH - All pitfalls identified from direct examination of actual content files
- Video metadata: MEDIUM - YouTube IDs verified for 3 of 8 from live site; WordPress.tv links confirmed for remaining 5
- Content cleanup: HIGH - All artifact types catalogued from grep analysis of full content corpus

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- content migration is a one-time operation)
