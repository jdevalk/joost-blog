# Phase 7: Yoast like Schema - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the full Yoast-style Schema.org structured data system using a single `@graph` array with `@id` cross-references between interconnected schema pieces. Replaces the current standalone Article and VideoObject JSON-LD blocks with a comprehensive, interconnected graph. Every page outputs full schema. This is the "Yoast SEO founder's blog should have best-in-class schema" phase.

</domain>

<decisions>
## Implementation Decisions

### Graph format
- Single JSON-LD block per page with `@graph` array
- All pieces reference each other via `@id` URIs (e.g., `"@id": "https://joost.blog/#/schema.org/Person"`)
- Matches the Yoast SEO output format: https://developer.yoast.com/features/schema/

### Schema types to include
- **Person** (Joost de Valk) — root entity, very rich (see Person details below)
- **WebSite** — name, url, description, inLanguage, publisher → Person
- **WebPage** (and subtypes) — every page gets at minimum a WebPage piece
- **Article** — blog posts, linked to author Person and WebPage
- **VideoObject** — video pages, linked to WebPage
- **BreadcrumbList** — every page (see breadcrumb structure below)
- **ImageObject** — for featured images on posts
- **SiteNavigationElement** — main nav items (About, Plugins, Videos, Contact)
- Beyond Yoast: Claude decides which additional subtypes are useful (e.g., ProfilePage for /about-me/, CollectionPage for blog listing/category archives)
- **No SearchAction** — skip until search functionality exists (v2 feature)

### Person entity (very rich — match current WordPress implementation)
- `@type`: ["Person", "Organization"]
- `name`: "Joost de Valk"
- `familyName`: "de Valk"
- `birthDate`: "1982-02-16"
- `gender`: "https://schema.org/Male"
- `nationality`: Netherlands
- `description`: "Internet entrepreneur from Wijchen, the Netherlands. Investor at Emilia Capital and actively working on Progress Planner. Founder of Yoast."
- `jobTitle`: "Partner"
- `knowsLanguage`: ["Dutch", "English", "German", "French", "Italian"]
- `image`: profile picture
- `url`: "https://joost.blog/about-me/"
- `sameAs`: Facebook, Instagram, LinkedIn, X/Twitter, Bluesky, YouTube, Wikipedia, Mastodon, GitHub, WordPress.org, Emilia Capital (12 profiles)
- `worksFor`: EmployeeRole history — Emilia Capital (Partner), Post Status (Partner and CTO), WordProof (Advisor), Blokjes (CEO), Yoast (CEO, ended 2019)
- `spouse`, `children`, `colleague` references via `@id`

### Breadcrumb structure
- Blog posts: Home > Blog > Category > Post title
- Videos: Home > Videos > Video title
- Category pages: Home > Blog > Category name
- Other pages: Home > Page title (e.g., Home > About)
- Every page gets a BreadcrumbList in the graph

### Coverage
- Every page gets full schema — no exceptions
- Blog posts: WebPage + Article + BreadcrumbList + ImageObject
- Video pages: WebPage + VideoObject + BreadcrumbList
- Blog listing/category archives: CollectionPage + BreadcrumbList (if Claude determines useful)
- About page: ProfilePage + BreadcrumbList (if Claude determines useful)
- Other pages: WebPage + BreadcrumbList

### Claude's Discretion
- Which WebPage subtypes to use beyond the ones discussed (ProfilePage, CollectionPage, etc.)
- Architecture of the schema generation system (helpers, utilities, component structure)
- How to handle pages without categories in breadcrumbs
- Whether to include referenced Organization entities (Yoast, Emilia Capital, Post Status) inline or as stubs
- ImageObject detail level

</decisions>

<specifics>
## Specific Ideas

- This is the Yoast SEO founder's blog — schema should be best-in-class, a reference implementation
- Current WordPress site already outputs very rich schema — the Astro version should match or exceed it
- Yoast schema spec: https://developer.yoast.com/features/schema/
- Current WordPress schema uses `@id` patterns like `https://joost.blog/about-me/#/schema.org/Person` and `https://joost.blog/#/schema.org/WebSite`
- Person entity data sourced from current production site (see decisions above for full details)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/JsonLd.astro`: Simple component that renders `<script type="application/ld+json">` — will need to be extended or replaced to output `@graph` arrays
- `src/components/BaseHead.astro`: Handles all SEO meta tags, canonical URLs, OG tags — schema integration point
- `src/content.config.ts`: Blog schema has title, excerpt, publishDate, updatedDate, categories, featureImage, seo fields; Videos have youtubeId, duration, videoPressId

### Established Patterns
- SEO data flows through page template → BaseLayout props → BaseHead component
- Article JSON-LD currently generated inline in `src/pages/[slug].astro` (lines 57-70)
- VideoObject JSON-LD currently generated inline in `src/pages/videos/[slug].astro` (lines 33-42)
- Both use the `<JsonLd schema={...} />` component

### Integration Points
- Replace current per-page inline schema generation with a centralized graph builder
- `[slug].astro` handles both blog posts and pages (distinguished by `isBlog` flag)
- Category data available via frontmatter `categories` array
- Navigation links defined in site config (for SiteNavigationElement)
- Profile photo already downloaded locally

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-yoast-like-schema*
*Context gathered: 2026-03-05*
