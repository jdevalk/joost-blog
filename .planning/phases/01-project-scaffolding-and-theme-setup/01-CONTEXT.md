# Phase 1: Project Scaffolding and Theme Setup - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

A browsable Astro site with the Ovidius theme, Joost's branding (colors, typography, hero), navigation menu, and dark mode toggle -- ready to receive content in Phase 2. No content migration happens here; this is the shell and brand foundation.

</domain>

<decisions>
## Implementation Decisions

### Brand identity
- Match the current joost.blog palette: muted teal accent, white backgrounds, gray tones
- Typography: Mona Sans (variable font from GitHub) -- maintain visual continuity with current site
- Generous whitespace throughout -- content-focused, minimal clutter (aligns with Ovidius defaults)
- Code syntax highlighting: GitHub-style (GitHub Light theme in light mode, GitHub Dark in dark mode)

### Homepage hero
- Medium-detail bio: 3-4 sentences covering Yoast founding, current work at Emilia Capital, and Progress Planner
- Use the current profile photo (cropped-joost-de-valk-profile-picture-web.jpg) -- download and optimize
- Social links in hero: X (Twitter), GitHub, LinkedIn, Bluesky (4 platforms)
- Below the hero: recent blog posts grid with dates and categories (card-based, matching Ovidius pattern)

### Navigation
- Header nav items in order: Blog, About, Plugins, Videos, Contact
- Site title displayed as text: "joost.blog" (no logo), linking to homepage
- Footer: minimal -- copyright notice + social links only

### Dark mode
- Default: respect visitor's OS preference via prefers-color-scheme
- Toggle placement: header/nav bar (sun/moon icon), always accessible
- Preference persisted in localStorage across page loads
- Code blocks adapt: GitHub Light in light mode, GitHub Dark in dark mode

### Claude's Discretion
- Exact dark mode color palette (complement the teal/white/gray light theme)
- Toggle icon design and animation
- Exact spacing and typography scale values
- Mobile nav behavior (hamburger menu, breakpoints)
- Footer layout details

</decisions>

<specifics>
## Specific Ideas

- The current site uses Mona Sans typeface -- keep this for continuity
- Current site has generous whitespace and a "modern, readable aesthetic" -- Ovidius is already designed this way
- Social links: X, GitHub, LinkedIn, Bluesky -- just these four, not all 8 from the about page
- Bio should mention Yoast, Emilia Capital, and Progress Planner in 3-4 sentences

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `content-export/` directory: contains all exported markdown (posts, pages, videos) -- not used in Phase 1 but informs schema design
- About page markdown (`content-export/pages/about-me.md`): contains full bio text and social links for reference when writing hero content
- Profile photo URL: `https://joost.blog/wp-content/uploads/2022/07/cropped-joost-de-valk-profile-picture-web.jpg`

### Established Patterns
- No existing Astro code -- this is a greenfield project
- Ovidius theme provides: hero section, post grid, navigation, pagination, RSS, sitemap out of the box
- Ovidius uses `site-config.ts` for hero content, nav links, and social links

### Integration Points
- Astro content collections schema will be defined here for use by Phase 2 (content migration)
- Navigation config in `site-config.ts` is the central place for menu items
- Dark mode toggle is an addition to the Ovidius theme (not included by default)
- Tailwind CSS config will hold the brand color palette

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-project-scaffolding-and-theme-setup*
*Context gathered: 2026-03-04*
