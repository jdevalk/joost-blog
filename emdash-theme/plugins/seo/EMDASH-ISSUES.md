# EmDash Issues Needed for SEO Plugin

## Issue 1: page:metadata hooks should run for anonymous visitors (blocker)

**Problem**: The EmDash middleware (`src/astro/middleware.ts` lines 200-228) skips
runtime initialization for anonymous visitors on public pages. This means
`page:metadata` plugin hooks never fire for the audience that matters most —
search engine crawlers and regular visitors.

`EmDashHead.astro` checks for the runtime via `getPageRuntime(Astro.locals)` and
falls back to base-only contributions when it's absent. The plugin's SEO
contributions (schema graph, robots directives, og:title without site name, etc.)
are only visible to logged-in editors.

**Current behavior**: For anonymous visitors on public pages:
```
middleware → no runtime init → locals.emdash not set → EmDashHead falls back → base SEO only
```

**Expected behavior**: `page:metadata` hooks should run for ALL visitors so
plugins can contribute SEO tags that search engines actually see.

**Suggested fix**: Either:
1. Always initialize the runtime for public pages (lazy/cached so no perf hit)
2. Add a lightweight code path that only runs `page:metadata` hooks without full
   runtime init
3. Add a config flag like `alwaysInitRuntime: true` for sites that use SEO plugins

**Affected code**:
- `src/astro/middleware.ts` lines 200-228 (early return for anonymous visitors)
- `src/components/EmDashHead.astro` line 35-48 (runtime check + fallback)
- `src/page/index.ts` `getPageRuntime()` (returns undefined without runtime)

## Issue 2: Base SEO contributions need og:title without site name (enhancement)

**Problem**: `generateBaseSeoContributions()` sets `og:title` to
`page.seo?.ogTitle || page.title`. Since `page.title` is the full title
(e.g. "Post Title — Site Name"), the og:title includes the site name.

Per Open Graph and Yoast best practices, `og:title` should be just the page
title without the site name suffix. The site name is already conveyed via
`og:site_name`.

**Suggested fix**: Add an `ogTitle` field to `PublicPageContext` that templates
can set to just the page title, separate from the full `<title>` tag value.
Or strip the site name suffix automatically in `generateBaseSeoContributions`.
