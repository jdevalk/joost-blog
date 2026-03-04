# Phase 5: Engagement Features - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Readers can comment on blog posts via Giscus (GitHub Discussions-backed) and experience smooth view transitions between pages. Comments are scoped to blog posts only — no comments on static pages or video pages.

</domain>

<decisions>
## Implementation Decisions

### Giscus repository & mapping
- Use the same GitHub repository that hosts the joost.blog site code
- GitHub Discussions must be enabled on the repo before implementation
- Blog posts only — no comments on pages or videos

### Comment placement
- Order at bottom of blog post: Content > Share links > Comments > Related posts
- Comments section sits between the share links and the related posts block
- Integration point: `[slug].astro` blog post rendering branch

### Lazy loading
- Giscus iframe lazy-loads when the comment section scrolls into view
- Keeps initial page load fast — consistent with Phase 4's performance stance (PERF-03)

### View transitions
- Default crossfade transition (Astro's built-in)
- `ClientRouter` is already imported in BaseLayout.astro — verify it works correctly
- `astro:after-swap` handler for dark mode already in place
- Ensure Giscus iframe survives/reinitializes on view transitions

### Claude's Discretion
- Discussion category mapping strategy (pathname vs title vs number)
- Dark mode sync approach for Giscus (postMessage API vs page-load detection)
- Giscus theme selection (matching the site's slate palette)
- Lazy-load implementation method (IntersectionObserver, loading="lazy", or Astro island)
- Any view transition refinements needed for interactive components

</decisions>

<specifics>
## Specific Ideas

- Giscus must work with the existing dark mode toggle — theme should match light/dark state
- View transitions should feel subtle and fast, not flashy
- The site already ships zero unnecessary JS (Phase 4) — Giscus is an acceptable interactive island

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro`: Already has `ClientRouter` import and `astro:after-swap` dark mode handler
- `ThemeToggle.astro`: Dark mode toggle component — Giscus theme sync hooks into this
- `JsonLd.astro`: Pattern for injecting script tags into pages — similar pattern for Giscus script
- `Subscribe.astro`: Existing "below content" component pattern — Giscus component follows same placement approach

### Established Patterns
- Interactive components use Astro islands (`client:*` directives) or inline scripts
- SEO/meta data flows through BaseLayout props → BaseHead component
- Blog vs page rendering is branched in `[slug].astro` via `isBlog` flag — comments only in blog branch

### Integration Points
- Giscus component goes in `[slug].astro` blog branch, between share links div and related posts section
- Dark mode sync needs to coordinate with existing `ThemeToggle.astro` click handler
- View transitions already active — verify all pages transition smoothly, especially pages with YouTube facade embeds

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-engagement-features*
*Context gathered: 2026-03-04*
