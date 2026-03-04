---
phase: 03-routing-and-core-pages
plan: 01
subsystem: routing
tags: [astro, routing, utilities, rss, typescript]

# Dependency graph
requires:
  - phase: 02-content-migration
    provides: Blog posts and pages content collections
provides:
  - Merged [slug].astro route serving blog posts and pages at root level
  - Utility functions: slugify, getReadingTime, getRelatedPosts
  - Root-level URL pattern for all blog posts and pages
  - postsPerPage set to 10
affects: [03-02, 03-03, 04-seo-metadata]

# Tech tracking
tech-stack:
  added: []
  patterns: [merged dynamic route for posts+pages, related posts algorithm]

key-files:
  created:
    - src/pages/[slug].astro
  modified:
    - src/utils/post-utils.ts
    - src/data/site-config.ts
    - src/components/PostPreview.astro
    - src/components/FeaturedPostPreview.astro
    - src/components/ReadNextPostPreview.astro
    - src/pages/rss.xml.js

key-decisions:
  - "Kept videos.md in pages collection, excluded via getStaticPaths filter instead of underscore prefix"
  - "Related posts algorithm: primary category first, then other shared categories, then recent"
  - "Reading time based on 225 words/minute with ceil and min 1"

patterns-established:
  - "Root-level routing: all blog posts and pages served at /{slug}/ via merged [slug].astro"
  - "Utility pattern: shared functions in post-utils.ts for cross-plan reuse"

requirements-completed: [URL-01, URL-02, BLOG-05, BLOG-06, BLOG-04]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 3 Plan 1: Root-Level Routing Summary

**Merged [slug].astro route serving blog posts and pages at /{slug}/, with slugify/getReadingTime/getRelatedPosts utilities and postsPerPage=10**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T15:53:44Z
- **Completed:** 2026-03-04T15:57:15Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All blog posts now served at root-level /{slug}/ instead of /blog/{slug}/
- All static pages served at /{slug}/ via same merged route
- Added reading time display, category links, and related posts section to blog template
- RSS feed updated to root-level URLs
- postsPerPage changed from 5 to 10
- Three utility functions (slugify, getReadingTime, getRelatedPosts) available for Plans 02 and 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Add utility functions and update site config** - `4d497a8` (feat)
2. **Task 2: Create merged root-level route and update all link references** - `036c509` (feat)

## Files Created/Modified
- `src/pages/[slug].astro` - Merged dynamic route serving both blog posts and pages at root level
- `src/utils/post-utils.ts` - Added slugify, getReadingTime, getRelatedPosts functions
- `src/data/site-config.ts` - Changed postsPerPage from 5 to 10
- `src/components/PostPreview.astro` - Updated links from /blog/{id}/ to /{id}/
- `src/components/FeaturedPostPreview.astro` - Updated links from /blog/{id}/ to /{id}/
- `src/components/ReadNextPostPreview.astro` - Updated links from /blog/{id}/ to /{id}/
- `src/pages/rss.xml.js` - Updated RSS links to root-level URLs
- `src/pages/blog/[id].astro` - Deleted (replaced by [slug].astro)
- `src/pages/[...id].astro` - Deleted (replaced by [slug].astro)

## Decisions Made
- Kept videos.md in pages collection but excluded it via getStaticPaths filter (id !== 'videos') rather than renaming with underscore prefix, since Astro's glob loader would still match underscore-prefixed files
- Related posts algorithm prioritizes shared categories (primary first), then fills with recent posts
- Reading time uses 225 words/minute, consistent with typical reading speed estimates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Astro template fragment syntax**
- **Found during:** Task 2 (merged route creation)
- **Issue:** Initial template used JSX shorthand fragment syntax (`<>...</>`) inside conditional expressions, which Astro's compiler rejects with "Unable to assign attributes when using Fragment shorthand syntax"
- **Fix:** Restructured template to extract data in frontmatter script, use explicit `<Fragment>` tags, and simplified conditional rendering
- **Files modified:** src/pages/[slug].astro
- **Verification:** Build passes with zero errors
- **Committed in:** 036c509 (part of Task 2 commit)

**2. [Rule 1 - Bug] Kept videos.md as-is instead of underscore rename**
- **Found during:** Task 2 Step 1
- **Issue:** Plan suggested renaming videos.md to _videos.md to exclude from collection, but Astro's glob loader (`**/*.{md,mdx}`) matches underscore-prefixed files
- **Fix:** Kept file as videos.md, excluded via `page.id !== 'videos'` filter in getStaticPaths
- **Files modified:** src/pages/[slug].astro
- **Verification:** Build succeeds, no /videos/ route conflict
- **Committed in:** 036c509 (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correct build. No scope creep.

## Issues Encountered
- Content-level `/blog/` references exist in some markdown body text (internal links written by the author). These are out of scope for this routing task and will need redirects or content updates separately.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Root-level routing foundation complete for Plans 02 (category/tag pages) and 03 (videos hub, search)
- Utility functions (slugify, getRelatedPosts) ready for category page generation
- postsPerPage=10 ready for pagination in blog listing

---
*Phase: 03-routing-and-core-pages*
*Completed: 2026-03-04*
