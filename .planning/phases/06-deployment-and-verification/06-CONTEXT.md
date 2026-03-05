# Phase 6: Deployment and Verification - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the Astro site to Cloudflare Pages at joost.blog with custom domain, redirects for legacy URLs, reserved CMS paths, and verified URL preservation for all migrated content.

</domain>

<decisions>
## Implementation Decisions

### CMS Path Handling
- /cms/* and /cms-market-share/* should return the standard custom 404 page (which already shows recent posts)
- No dedicated placeholder page needed — clean 404 is sufficient
- These URL paths remain reserved for future CMS directory rebuild (v2)

### Redirect Rules
- /feed/ redirects to /rss.xml (301)
- /wp-admin/ and /wp-login.php redirect to homepage (stops bot/scanner traffic)
- All redirects go in Cloudflare Pages _redirects file
- No need for old /?p=123 numeric ID redirects

### Deployment Method
- Git integration with Cloudflare Pages (auto-deploy on push to main)
- Preview deploys available for branches
- Build command: `npm run build`, output directory: `dist/`

### Domain Configuration
- joost.blog domain DNS is already on Cloudflare
- Add CNAME record pointing to Cloudflare Pages deployment
- HTTPS handled automatically by Cloudflare

### URL Verification
- Automated crawl script that checks all known URLs (66 blog posts, pages, videos, feeds, sitemap, category pages)
- Reports HTTP status codes for each URL
- Keep as reusable npm script (`npm run verify`) for future content changes
- Manual spot-check of critical pages after automated crawl passes

### Claude's Discretion
- Exact _redirects file syntax and ordering
- Verification script implementation (curl, fetch, or other approach)
- Build configuration details for Cloudflare Pages
- Whether to add additional common WordPress redirect rules beyond /wp-admin/ and /wp-login.php

</decisions>

<specifics>
## Specific Ideas

- The site already has `site: 'https://joost.blog'` configured in astro.config.mjs
- Static output is the default Astro adapter (no SSR needed for Cloudflare Pages)
- Custom 404 page already exists from Phase 3 (shows 3 recent blog posts)
- Sitemap and RSS already configured via Astro integrations

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `astro.config.mjs`: Already configured with `site: 'https://joost.blog'`, sitemap, MDX
- Custom 404 page: Already built in Phase 3, suitable for CMS path fallback
- RSS feed: Already at /rss.xml via @astrojs/rss

### Established Patterns
- Static site generation (no SSR adapter configured)
- Build via `npm run build` producing static output in `dist/`
- All content in Astro content collections with Zod schema validation

### Integration Points
- `public/_redirects`: New file needed for Cloudflare Pages redirect rules
- Cloudflare Pages: Git integration with GitHub repository
- DNS: CNAME record for joost.blog pointing to Pages deployment

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-deployment-and-verification*
*Context gathered: 2026-03-05*
