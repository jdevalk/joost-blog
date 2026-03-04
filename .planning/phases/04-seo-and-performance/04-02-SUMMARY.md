---
phase: 04-seo-and-performance
plan: 02
subsystem: seo
tags: [json-ld, structured-data, schema-org, youtube-facade, astro-embed, heading-hierarchy]

# Dependency graph
requires:
  - phase: 04-seo-and-performance
    provides: "OG image generation endpoint for Article schema image field"
provides:
  - "Article JSON-LD on all blog post pages"
  - "VideoObject JSON-LD on video pages with youtubeId"
  - "YouTube facade embed component (zero JS until interaction)"
  - "Verified heading hierarchy across all page templates"
  - "JS audit confirming minimal footprint"
affects: [05-engagement]

# Tech tracking
tech-stack:
  added: ["@astro-community/astro-embed-youtube"]
  patterns: ["JSON-LD injection via set:html component", "YouTube facade pattern via astro-embed"]

key-files:
  created:
    - "src/components/JsonLd.astro"
  modified:
    - "src/components/YouTubeEmbed.astro"
    - "src/pages/[slug].astro"
    - "src/pages/videos/[slug].astro"
    - "src/pages/404.astro"

key-decisions:
  - "JSON-LD placed in body (Astro does not auto-hoist script tags with set:html) -- valid per Google docs"
  - "VideoObject JSON-LD only for videos with youtubeId (videos with only videoUrl skipped)"
  - "404 page h3 changed to h2 for correct heading hierarchy"

patterns-established:
  - "JsonLd component: reusable schema injection via set:html and JSON.stringify"
  - "YouTube facade: astro-embed wraps lite-youtube-embed, preserves youtubeId/title props interface"

requirements-completed: [SEO-05, SEO-06, PERF-02, PERF-03]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 4 Plan 2: Structured Data, YouTube Facade, and Content Audit Summary

**Article and VideoObject JSON-LD on all content pages, YouTube facade via astro-embed replacing iframes, heading hierarchy verified, and JS audit confirming minimal footprint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T21:10:31Z
- **Completed:** 2026-03-04T21:12:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Article JSON-LD with headline, author (Joost de Valk), datePublished, dateModified, description, and OG image on all blog posts
- VideoObject JSON-LD with name, thumbnailUrl, uploadDate, duration, and embedUrl on all YouTube video pages
- YouTube embeds replaced with astro-embed facade pattern (static thumbnail, no iframe until click, youtube-nocookie.com maintained)
- Heading hierarchy audited and fixed across all 7 page templates (404 page h3 corrected to h2)
- JS audit confirmed only necessary scripts ship: dark mode (2 inline), view transitions, nav toggle, theme toggle, and YouTube facade on interaction

## Task Commits

Each task was committed atomically:

1. **Task 1: Install astro-embed and create JSON-LD + YouTube facade components** - `c84b02a` (feat)
2. **Task 2: Wire JSON-LD into blog and video pages, audit headings and JS** - `4bf0d2b` (feat)

## Files Created/Modified
- `src/components/JsonLd.astro` - Reusable JSON-LD injection component using set:html
- `src/components/YouTubeEmbed.astro` - YouTube facade using astro-embed (replaces iframe)
- `src/pages/[slug].astro` - Article JSON-LD added for blog posts
- `src/pages/videos/[slug].astro` - VideoObject JSON-LD added for YouTube videos
- `src/pages/404.astro` - Fixed heading hierarchy (h3 to h2)
- `package.json` - Added @astro-community/astro-embed-youtube dependency

## Decisions Made
- JSON-LD renders in body rather than head -- Google explicitly supports JSON-LD anywhere in the document, and Astro's set:html directive on script tags does not auto-hoist to head
- VideoObject JSON-LD only added for videos with a youtubeId -- videos with only videoUrl (wordpress.tv) lack embed URLs and thumbnail data needed for rich results
- 404 page "Recent Posts" heading changed from h3 to h2 -- it is a sibling section to the 404 message, not a child

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 404 page heading hierarchy**
- **Found during:** Task 2 (heading audit)
- **Issue:** 404 page used h3 for "Recent Posts" section, skipping h2 level since it's a sibling to "Page Not Found" h2
- **Fix:** Changed h3 to h2
- **Files modified:** src/pages/404.astro
- **Verification:** All page templates now have correct heading hierarchy
- **Committed in:** 4bf0d2b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Heading fix was part of the planned audit scope. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All SEO and performance requirements complete for Phase 4
- Article and VideoObject structured data ready for Google Search Console validation
- YouTube facade pattern reduces page weight significantly (no iframe until click)
- Ready for Phase 5 engagement features (Giscus comments, newsletter, etc.)

---
*Phase: 04-seo-and-performance*
*Completed: 2026-03-04*
