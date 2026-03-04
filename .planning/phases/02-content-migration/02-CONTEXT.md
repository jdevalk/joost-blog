# Phase 2: Content Migration - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

All 66 blog posts, 11 static pages, 8 video pages, and all images migrated as validated Astro content collections with clean markdown and correct frontmatter. No routing or rendering happens here -- this phase produces the raw content files that Phase 3 will wire up.

</domain>

<decisions>
## Implementation Decisions

### Markdown cleanup
- Flatten categories from `{name, url}` objects to plain name strings (e.g., `["WordPress", "Development"]`) -- matches existing `z.array(z.string())` schema
- Convert absolute `https://joost.blog/slug/` internal links to relative `/slug/` paths
- Strip WordPress block comments (`<!-- wp:paragraph -->` etc.) but preserve intentional HTML (embeds, iframes, styled elements)
- Convert WordPress shortcodes to markdown/HTML equivalents where possible (`[caption]` to `<figure>`, `[embed]` to inline URLs); remove any that can't be converted

### Image handling
- Co-locate images with their posts in per-post folders: `src/content/blog/post-slug/images/`
- Download all images (WordPress and external) locally
- Update featured image frontmatter to use relative paths with Astro's `image()` schema for build-time optimization (WebP/AVIF, responsive sizes)
- Update inline image references in markdown body to point to local files

### Video collection
- Create a separate `videos` content collection with its own Zod schema
- Extract YouTube data into structured frontmatter fields: `youtubeId`, `duration`, `description`
- Body text becomes just the written description/context, not the embed markup
- Extract metadata from what's already in the exported markdown files (no external YouTube API calls)

### Content validation
- Claude's discretion on Zod schema strictness -- balance between catching real errors and not blocking migration on optional fields

</decisions>

<specifics>
## Specific Ideas

- The `content-export/` directory already has all 85 files downloaded (66 posts, 11 pages, 8 videos)
- Posts were fetched via native `.md` endpoint -- generally clean markdown with YAML frontmatter
- Videos were HTML-converted -- less structured, YouTube IDs embedded in body text with duration info
- Pages have minimal frontmatter (title, date, author only)
- The `date` field in exports needs mapping to `publishDate` in the blog schema

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `content-export/` directory: all source content already downloaded and ready for transformation
- `content-export/MANIFEST.md`: complete inventory of all 85 files with source URLs and status
- Existing blog schema in `src/content.config.ts`: title, excerpt, publishDate, categories, featureImage, seo fields

### Established Patterns
- Blog collection uses `glob` loader from `src/content/blog/` directory
- Pages collection uses `glob` loader from `src/content/pages/` directory
- Image schema expects `{src: image(), alt: z.string().optional()}`
- Feature image schema extends image with optional `caption`

### Integration Points
- New `videos` collection needs to be added to `src/content.config.ts` alongside blog and pages
- Blog posts go to `src/content/blog/{slug}/index.md` (with co-located images in same folder)
- Pages go to `src/content/pages/{slug}.md`
- Videos go to `src/content/videos/{slug}.md`

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-migration*
*Context gathered: 2026-03-04*
