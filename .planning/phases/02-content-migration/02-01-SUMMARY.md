---
phase: 02-content-migration
plan: 01
subsystem: migration
tags: [gray-matter, node-scripts, content-collections, wordpress, astro]

# Dependency graph
requires:
  - phase: 01-project-scaffolding
    provides: "Astro project with blog and pages content collections, content.config.ts"
provides:
  - "Migration script (scripts/migrate.mjs) for WordPress-to-Astro content transformation"
  - "Videos content collection schema in content.config.ts"
affects: [02-content-migration, 03-routing-layouts]

# Tech tracking
tech-stack:
  added: [gray-matter]
  patterns: [two-phase-cleanup, concurrent-image-download, cli-migration-tooling]

key-files:
  created:
    - scripts/migrate.mjs
    - src/content/videos/.gitkeep
  modified:
    - src/content.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Two-phase body cleanup: phase 1 before image extraction (keeps absolute URLs), phase 2 after (converts internal links)"
  - "Linked images simplified to keep full-size URL only, drop thumbnail"
  - "Contact page form HTML stripped entirely (form replacement is Phase 3+ concern)"
  - "Videos hub page (videos.md) migrated as-is since it has meaningful custom content"

patterns-established:
  - "Migration CLI: node scripts/migrate.mjs --type={posts|pages|videos|all} [--dry-run]"
  - "Blog posts use per-slug directories with co-located images: src/content/blog/{slug}/index.md"
  - "Pages use flat files: src/content/pages/{slug}.md"
  - "Videos use flat files: src/content/videos/{slug}.md"

requirements-completed: [CONT-05, CONT-06]

# Metrics
duration: 5min
completed: 2026-03-04
---

# Phase 2 Plan 1: Migration Script and Videos Schema Summary

**Node.js migration script with frontmatter transformation, content cleanup, image downloading, and videos collection schema using gray-matter**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-04T14:34:02Z
- **Completed:** 2026-03-04T14:39:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Videos content collection added to content.config.ts with youtubeId, duration, videoUrl fields
- Migration script handles all 3 content types: 66 posts, 10 pages (blog.md skipped), 8 videos
- Two-phase cleanup ensures image URLs are extracted before internal link conversion
- Script handles frontmatter transformation, content cleanup, concurrent image downloading, and dry-run mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Add videos collection to content.config.ts** - `8febe8d` (feat)
2. **Task 2: Build Node.js migration script** - `12d081f` (feat)

## Files Created/Modified
- `src/content.config.ts` - Added videos collection with youtubeId, duration, videoUrl schema fields
- `src/content/videos/.gitkeep` - Empty directory for glob loader
- `scripts/migrate.mjs` - Full migration script (400+ lines) with CLI, cleanup, image download
- `package.json` - Added gray-matter dependency
- `package-lock.json` - Lock file updated

## Decisions Made
- **Two-phase body cleanup:** Phase 1 runs all text transformations except internal URL conversion (so image URLs remain absolute for extraction). Phase 2 converts remaining `https://joost.blog/` links to relative and trims whitespace. This fixes a bug where inline images hosted on joost.blog were being converted to relative paths before they could be downloaded.
- **Linked images simplified:** `[![alt](thumb)](full)` patterns collapsed to `![alt](full)` -- keeps only the full-size image, simplifying the markup while preserving the best quality image.
- **Contact page cleanup:** Gravity Forms HTML remnants removed entirely from the "Contact me" section. Actual form replacement is a Phase 3+ concern.
- **Videos.md migrated as page:** The videos hub page has meaningful content (speaker info, thumbnails, links) worth preserving as a page.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed image extraction before internal URL conversion**
- **Found during:** Task 2 (migration script)
- **Issue:** Initial implementation converted all `https://joost.blog/` URLs to relative paths before extracting inline image URLs. This caused WordPress-hosted images (at `joost.blog/wp-content/uploads/`) to become relative paths that couldn't be downloaded. traveling-to-peru post showed 1 image instead of 19.
- **Fix:** Split cleanupBody into cleanupBodyPhase1 (everything except URL conversion) and cleanupBodyPhase2 (URL conversion + whitespace trimming). Image extraction runs between the two phases.
- **Files modified:** scripts/migrate.mjs
- **Verification:** Dry-run now correctly shows 19 images for traveling-to-peru and proper counts for all posts
- **Committed in:** 12d081f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Bug fix was essential for correct image downloading. No scope creep.

## Issues Encountered
- `npx astro check` requires installing `@astrojs/check` dependency interactively. Used `npx astro build` instead for verification -- build succeeded, confirming the videos collection schema is valid.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Migration script ready to execute (plan 02-02 will run the actual migration)
- Videos collection schema in place for video content
- All cleanup patterns implemented and verified via dry-run
- Script is idempotent -- safe to re-run

---
*Phase: 02-content-migration*
*Completed: 2026-03-04*
