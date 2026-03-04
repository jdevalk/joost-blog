---
phase: 01-project-scaffolding-and-theme-setup
plan: 02
subsystem: ui
tags: [dark-mode, theme-toggle, hero-section, navigation, social-links, localStorage, FOUC-prevention]

# Dependency graph
requires:
  - phase: 01-01
    provides: Astro 5 project with Ovidius theme, Mona Sans font, Tailwind 4 brand colors, Shiki dual themes
provides:
  - Homepage hero with Joost's bio, profile photo, and 4 social links
  - Navigation menu with Blog, About, Plugins, Videos, Contact
  - Dark mode toggle with localStorage persistence and OS preference detection
  - FOUC prevention via inline head script
  - Dark mode classes on all components
  - Minimal footer with copyright and social links
affects: [02-content-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [class-based-dark-mode, tailwind-custom-variant, inline-script-fouc-prevention, astro-after-swap-theme-persistence]

key-files:
  created: [src/components/ThemeToggle.astro, src/assets/images/joost-profile.jpg]
  modified: [src/data/site-config.ts, src/components/Header.astro, src/components/Footer.astro, src/components/Hero.astro, src/components/PostPreview.astro, src/components/FeaturedPostPreview.astro, src/components/ReadNextPostPreview.astro, src/layouts/BaseLayout.astro, src/styles/global.css, src/pages/index.astro, src/pages/blog/[id].astro, src/pages/blog/[...page].astro, src/pages/[...id].astro]

key-decisions:
  - "Used correct Ovidius property names (primaryNavLinks/secondaryNavLinks) instead of plan's suggested names (primaryLinks/secondaryLinks)"
  - "Added dark mode classes to all components including blog post pages, pagination, and content pages for complete coverage"
  - "Used dark prose CSS variable overrides rather than per-element dark: classes for content typography"

patterns-established:
  - "Dark mode toggle: ThemeToggle.astro component with sun/moon SVG icons, click toggles .dark class on <html>"
  - "FOUC prevention: is:inline script in <head> reads localStorage/prefers-color-scheme before first paint"
  - "View transitions: astro:after-swap re-applies dark class from localStorage after page swap"
  - "Dark color palette: slate-900 bg, slate-200 text, accent (#96e1e9) for links, slate-700 borders"

requirements-completed: [THEME-02, THEME-03, THEME-05]

# Metrics
duration: 5min
completed: 2026-03-04
---

# Phase 1 Plan 02: Site Config, Hero, Navigation, and Dark Mode Summary

**Joost's hero/bio/social links configured with dark mode toggle using inline FOUC prevention and localStorage persistence across all components**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-04T12:14:55Z
- **Completed:** 2026-03-04T12:20:15Z
- **Tasks:** 2 (of 3; Task 3 is visual verification checkpoint)
- **Files modified:** 15

## Accomplishments
- Homepage hero displays "Hi! I'm Joost de Valk" with bio, optimized profile photo, and 4 social links (X, GitHub, LinkedIn, Bluesky)
- Navigation configured with Blog, About, Plugins, Videos, Contact in correct order
- Site title renders as text "joost.blog" (no logo image)
- Footer simplified to copyright notice and social links only
- Dark mode toggle (sun/moon icon) in header with localStorage persistence
- FOUC prevention via inline script that reads theme before first paint
- All components (Header, Hero, Footer, PostPreview, FeaturedPostPreview, blog post pages, pagination) have dark: variants
- Dark mode prose overrides for readable content typography
- View transitions preserve dark mode state via astro:after-swap

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure site-config.ts with hero, navigation, and social links** - `0f49d40` (feat)
2. **Task 2: Build dark mode toggle with FOUC prevention and localStorage persistence** - `8677e28` (feat)

## Files Created/Modified
- `src/data/site-config.ts` - Joost's hero content, navigation links, social links, site metadata
- `src/assets/images/joost-profile.jpg` - Optimized profile photo (25KB, auto-optimized to 3KB webp)
- `src/components/ThemeToggle.astro` - Dark mode toggle with sun/moon icons and click handler
- `src/components/Header.astro` - ThemeToggle added, dark mode classes for nav menu
- `src/components/Footer.astro` - Simplified to copyright + social links, dark mode classes
- `src/components/Hero.astro` - Dark mode classes for title, text, social links
- `src/components/PostPreview.astro` - Dark mode classes for dates, titles
- `src/components/FeaturedPostPreview.astro` - Dark mode classes for dates, titles
- `src/components/ReadNextPostPreview.astro` - Dark mode classes for dates, titles
- `src/layouts/BaseLayout.astro` - Inline theme scripts, dark body/header classes
- `src/styles/global.css` - @custom-variant dark, dark prose overrides
- `src/pages/index.astro` - Dark mode for hero section background, dividers, headings
- `src/pages/blog/[id].astro` - Dark mode for blog post pages, share links
- `src/pages/blog/[...page].astro` - Dark mode for pagination
- `src/pages/[...id].astro` - Dark mode for content pages

## Decisions Made
- Used correct Ovidius property names (primaryNavLinks/secondaryNavLinks) from types.ts instead of the plan's suggested names (primaryLinks/secondaryLinks) which would have caused type errors
- Added dark: variants to all components for complete coverage, not just the ones specifically mentioned in the plan
- Used CSS variable overrides for prose dark mode rather than per-element classes, which is cleaner and more maintainable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected property names in site-config.ts**
- **Found during:** Task 1
- **Issue:** Plan specified `primaryLinks` and `secondaryLinks` but the SiteConfig type uses `primaryNavLinks` and `secondaryNavLinks`
- **Fix:** Used correct property names from types.ts
- **Files modified:** src/data/site-config.ts
- **Committed in:** 0f49d40

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for type safety. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 1 is functionally complete: branded Astro site with hero, navigation, dark mode toggle
- Awaiting visual verification (Task 3 checkpoint) before marking phase done
- Ready for Phase 2 content migration once verified

## Self-Check: PASSED

- All 7 key files verified present on disk
- Both commits verified in git log (0f49d40, 8677e28)

---
*Phase: 01-project-scaffolding-and-theme-setup*
*Completed: 2026-03-04*
