---
phase: 05-engagement-features
plan: 01
subsystem: ui
tags: [giscus, comments, github-discussions, view-transitions, dark-mode, lazy-loading]

# Dependency graph
requires:
  - phase: 03-routing-and-core-pages
    provides: Blog post template with share links and related posts
provides:
  - Giscus comment section component with lazy loading, dark mode sync, and view transition support
  - Blog posts render comments between share links and related posts
affects: [06-deployment-and-verification]

# Tech tracking
tech-stack:
  added: [giscus]
  patterns: [inline-script-for-view-transitions, intersection-observer-lazy-load, mutation-observer-dark-mode-sync]

key-files:
  created: [src/components/Giscus.astro]
  modified: [src/pages/[slug].astro]

key-decisions:
  - "Giscus uses is:inline script to survive Astro view transitions (bundled scripts get deduplicated)"
  - "IntersectionObserver with 200px rootMargin for lazy loading the Giscus iframe"
  - "MutationObserver on documentElement class attribute for dark mode sync via postMessage"
  - "Placeholder repo/category IDs -- user must configure via giscus.app before comments work"

patterns-established:
  - "View transition reinitialization: listen for astro:page-load, clear container, re-observe"
  - "Dark mode sync for third-party iframes: MutationObserver + postMessage"

requirements-completed: [ENG-01, ENG-02]

# Metrics
duration: 12min
completed: 2026-03-05
---

# Phase 5 Plan 1: Giscus Comments Summary

**Giscus comment section on blog posts with lazy loading, dark mode sync, and view transition reinitialization**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-05
- **Completed:** 2026-03-05
- **Tasks:** 2
- **Files modified:** 29 (including deviation fixes)

## Accomplishments
- Giscus comment section component with IntersectionObserver lazy loading
- Dark mode sync via MutationObserver and postMessage to Giscus iframe
- View transition support via astro:page-load reinitialization
- Comments section placed between share links and related posts on blog posts only

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Giscus component and wire into blog posts** - `46c5359` (feat)
2. **Task 2: Verify Giscus integration and view transitions** - human-verify checkpoint (approved)

**Deviation fix commits during verification:**
- `09d17de` fix(videos): add WordPress.tv embed fallback for videos without youtubeId
- `f5fb2a6` fix(videos): use VideoPress embed for WordPress.tv videos
- `704c6a6` fix(videos): show play icon placeholder for videos without YouTube thumbnail
- `828017b` fix(videos): add local thumbnail images for all video listings
- `b50618d` fix(nav): highlight active menu item with primary color
- `b9c297c` fix(content): add line breaks before headings in about-me page
- `b3c1ae2` fix(content): display speaking engagements in compact grid on about page
- `c1873c2` fix(content): use public paths for about page video thumbnails

## Files Created/Modified
- `src/components/Giscus.astro` - Self-contained comment section with lazy loading, dark mode sync, view transition support
- `src/pages/[slug].astro` - Blog post template updated to render Giscus component

## Decisions Made
- Used `is:inline` script directive so Astro does not bundle/deduplicate -- required for view transition reinitialization
- Placeholder IDs for data-repo-id and data-category-id -- user must configure via giscus.app
- IntersectionObserver with 200px rootMargin triggers Giscus load before user scrolls to comments
- MutationObserver watches document.documentElement class changes for dark mode sync

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] WordPress.tv video embeds broken**
- **Found during:** Task 2 verification
- **Issue:** Videos without youtubeId had no embed fallback; WordPress.tv videos needed VideoPress embed
- **Fix:** Added WordPress.tv embed support and local thumbnail images for all video listings
- **Files modified:** src/pages/videos/[slug].astro, src/pages/videos/index.astro, multiple video content files
- **Committed in:** 09d17de, f5fb2a6, 704c6a6, 828017b

**2. [Rule 1 - Bug] Active menu item not visually highlighted**
- **Found during:** Task 2 verification
- **Issue:** Navigation did not indicate the current page
- **Fix:** Highlight active menu item with primary color
- **Files modified:** Navigation component
- **Committed in:** b50618d

**3. [Rule 1 - Bug] About page formatting issues**
- **Found during:** Task 2 verification
- **Issue:** Missing line breaks before headings, speaking engagements not in grid, video thumbnail paths wrong
- **Fix:** Added line breaks, compact grid layout, corrected public paths for thumbnails
- **Files modified:** src/content/blog/about-me page, about page template
- **Committed in:** b9c297c, b3c1ae2, c1873c2

---

**Total deviations:** 8 auto-fixed commits (all Rule 1 - Bug fixes)
**Impact on plan:** All fixes addressed pre-existing display issues discovered during visual verification. No scope creep -- all were correctness fixes.

## Issues Encountered
- Giscus requires GitHub Discussions enabled and placeholder IDs replaced before comments actually load. Component is wired correctly but awaits user configuration.

## User Setup Required

**External services require manual configuration:**
- Enable GitHub Discussions on the repository (Settings > General > Features > Discussions)
- Create a "Blog Comments" category in Discussions (format: Announcement)
- Visit https://giscus.app, enter repo name, select "Blog Comments" category
- Copy data-repo-id and data-category-id values into src/components/Giscus.astro (replace REPO_ID and CATEGORY_ID placeholders)

## Next Phase Readiness
- Phase 5 complete -- Giscus component ready, view transitions verified
- Phase 6 (Deployment) can proceed once Phase 4 is also marked complete
- Giscus placeholder IDs need to be configured before deployment for comments to work

## Self-Check: PASSED

- FOUND: src/components/Giscus.astro
- FOUND: commit 46c5359
- FOUND: 05-01-SUMMARY.md

---
*Phase: 05-engagement-features*
*Completed: 2026-03-05*
