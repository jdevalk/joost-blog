# Project Research Summary

**Project:** joost.blog
**Domain:** WordPress-to-Astro static blog migration
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

This project migrates joost.blog from WordPress to a statically generated Astro site hosted on Cloudflare Pages. The site has 66 blog posts, several static pages, and 8 video pages. The established expert approach is to use the Ovidius Astro theme (GPL-3.0, Tailwind v4, MDX support) as a foundation and customize it rather than building from scratch. The theme already includes most table-stakes functionality: blog listing with pagination, RSS, sitemap, SEO meta tags, image optimization, and a hero section. The primary work is content migration and customization, not framework engineering.

The recommended approach is a phased build starting with project scaffolding and content migration, then layering on routing, SEO, engagement features, and deployment. Content migration is the highest-risk phase -- WordPress exports produce markdown with absolute image URLs, missing Yoast SEO metadata, broken shortcodes, and inconsistent frontmatter. A dedicated migration script with validation against Astro's Zod schemas is essential. The Giscus comment system (GitHub Discussions-backed) replaces WordPress comments without requiring any backend infrastructure.

The primary risks are: (1) broken URLs destroying SEO equity -- every WordPress URL must either resolve or 301-redirect on the new site; (2) trailing slash mismatches between Astro, Cloudflare Pages, and WordPress causing redirect loops or duplicate content; (3) image references remaining as absolute WordPress URLs that will break once the old site is decommissioned. All three risks are well-documented with clear prevention strategies. Given that this is Joost de Valk's personal blog (founder of Yoast SEO), the SEO implementation must be flawless -- structured data, OpenGraph tags, canonical URLs, and meta descriptions are non-negotiable.

## Key Findings

### Recommended Stack

The stack is entirely determined by the Ovidius theme choice and Cloudflare Pages hosting. Every core dependency is already included in Ovidius; only Giscus (comments), wrangler (deployment), and the React integration (for Giscus) need to be added.

**Core technologies:**
- **Astro 5.x** (^5.15.3): Static site generator with content collections, image optimization, and island architecture for selective hydration
- **Ovidius theme**: Blog-ready Astro theme with hero, pagination, RSS, sitemap, SEO meta -- customize rather than build from scratch
- **Tailwind CSS v4** via `@tailwindcss/vite`: Already in Ovidius; utility-first CSS with `@tailwindcss/typography` for markdown prose styling
- **Astro Content Collections** (v5 Content Layer API): Type-safe Zod-validated content management for blog posts, pages, and videos
- **Giscus** (`@giscus/react`): GitHub Discussions-backed comments, loaded as a client-side island -- no backend needed
- **Cloudflare Pages**: Static hosting with global CDN, no adapter required for static output, free tier sufficient
- **sharp** (^0.34.5): Build-time image optimization (WebP/AVIF, responsive srcset)

**Critical version requirements:** Node.js >= 22.x (Astro 5.8+ dropped Node 18). Do NOT install `@astrojs/cloudflare` adapter (triggers Workers instead of Pages deployment).

### Expected Features

**Must have (table stakes):**
- All 66 blog posts migrated with full content, images, and metadata
- All static pages (about, contact, plugins, videos hub, privacy, comment policy)
- URL preservation -- every existing slug must work or redirect
- 10 category archive pages with pagination
- RSS feed with redirect from `/feed/` to `/rss.xml`
- XML sitemap, custom 404 page
- OpenGraph meta tags, canonical URLs, meta descriptions, structured data (Article JSON-LD)
- Image optimization (WebP/AVIF, responsive sizes, lazy loading)
- 8 video pages as a content collection with YouTube embeds

**Should have (differentiators):**
- Dark mode toggle (CSS custom properties + localStorage)
- Reading time estimates (build-time calculation)
- View transitions (Astro built-in ViewTransitions API)
- Related posts by category
- Previous/next post navigation
- Social sharing links (static, no JS)
- Code syntax highlighting (Shiki, built into Astro)
- Newsletter subscribe form (front-end only, third-party backend)

**Defer (v2+):**
- Auto-generated OpenGraph images (satori + sharp -- high complexity, use manual images initially)
- Full-text search (66 posts do not justify the JS weight)
- CMS directory and market share pages (explicitly out of scope per PROJECT.md)
- Table of contents for long posts

### Architecture Approach

The architecture is a standard Astro static site generator pattern: markdown content files validated by Zod schemas at build time, rendered through file-based routing into static HTML served by Cloudflare Pages CDN. Three content collections (blog, pages, videos) with separate schemas keep type safety tight. A single `site-config.ts` centralizes branding, navigation, hero content, and social links. The Ovidius theme provides the layout and component layer; customizations add category pages, video pages, and the Giscus comment widget.

**Major components:**
1. **Content Collections** (blog, pages, videos) -- Zod-validated markdown with typed frontmatter, glob-loaded
2. **Routing Layer** (`src/pages/`) -- file-based routing preserving WordPress URL structure, dynamic routes for blog posts, categories, and videos
3. **Site Config** (`src/data/site-config.ts`) -- single source of truth for all site-wide configuration
4. **BaseLayout + Components** -- Astro components for page shell, post cards, images, navigation, comments
5. **Build Pipeline** -- Astro SSG with sharp image optimization, output to `dist/`
6. **CDN** -- Cloudflare Pages serving static output, `_redirects` in `public/` for URL preservation

### Critical Pitfalls

1. **Broken URLs destroying SEO rankings** -- Crawl all WordPress URLs pre-migration, match Astro routes exactly, use `_redirects` for any changes, diff old vs new URL lists post-deployment
2. **Trailing slash mismatch** -- Set `trailingSlash` explicitly in `astro.config.mjs`, verify Cloudflare Pages behavior, test both variants of every URL pattern
3. **Image references breaking** -- Download ALL images before migration, place in `src/assets/` (not `public/`), rewrite all paths to relative references, verify image count matches
4. **Cloudflare deploying to Workers instead of Pages** -- Do NOT install `@astrojs/cloudflare` adapter, set `output: 'static'`, verify `*.pages.dev` URL
5. **Content conversion producing broken markdown** -- Test a few posts first, build cleanup script for WordPress artifacts (shortcodes, block comments, encoding), validate all frontmatter against schema

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Scaffolding and Theme Setup
**Rationale:** Everything depends on the Astro project existing with correct configuration. Content collections, schemas, and site config must be in place before content can be migrated or pages can render.
**Delivers:** Working Astro project with Ovidius theme, content collection schemas (blog, pages, videos), site-config.ts with branding/nav/hero, BaseLayout with Header/Footer, Tailwind v4 styling, astro.config.mjs with correct site URL and trailingSlash setting.
**Addresses:** Homepage hero, navigation, core site structure
**Avoids:** Pitfall #2 (trailing slash -- configure correctly from the start), Pitfall #11 (missing site URL)

### Phase 2: Content Migration
**Rationale:** Content must exist before any page rendering, SEO, or feature work can proceed. This is the highest-risk phase and should be isolated so problems are caught early.
**Delivers:** All 66 blog posts as validated markdown, all static pages, all images downloaded and relocated to `src/assets/`, 8 video pages as a content collection, frontmatter normalized to match Zod schemas.
**Addresses:** Content preservation (all table stakes), image optimization pipeline
**Avoids:** Pitfall #3 (image references), Pitfall #5 (broken markdown), Pitfall #6 (schema mismatches), Pitfall #7 (missing SEO metadata -- extract Yoast data here), Pitfall #10 (YouTube embeds)

### Phase 3: Routing and Core Pages
**Rationale:** With content in place, build the pages that render it. Routing must match WordPress URL structure exactly. This phase produces a browsable site.
**Delivers:** Blog listing with pagination, individual post pages, static pages via catch-all route, category archive pages (new), video hub and individual video pages (new), custom 404 page.
**Addresses:** Blog post listing, category pages, video pages, 404 page, URL preservation
**Avoids:** Pitfall #1 (broken URLs -- design routes to match WordPress), Pitfall #9 (category pages missing)

### Phase 4: SEO, Feeds, and Polish
**Rationale:** SEO and feeds depend on pages existing. This phase layers metadata, structured data, and discovery features onto the working site. For Joost de Valk's blog, SEO must be production-quality before launch.
**Delivers:** OpenGraph meta tags on all pages, Article JSON-LD structured data, RSS feed with redirect from `/feed/`, XML sitemap, canonical URLs, meta descriptions, reading time display, code syntax highlighting.
**Addresses:** All SEO table stakes, RSS feed, sitemap, reading time differentiator
**Avoids:** Pitfall #7 (SEO metadata -- implement here), Pitfall #8 (RSS feed URL -- redirect here)

### Phase 5: Engagement Features
**Rationale:** Interactive and engagement features are additive -- they enhance the site but don't block launch. Giscus requires GitHub Discussions setup which is a separate concern from content.
**Delivers:** Giscus comments on blog posts, dark mode toggle, related posts, view transitions, previous/next post navigation, social sharing links, newsletter subscribe form.
**Addresses:** All differentiator features
**Avoids:** No critical pitfalls -- these are low-risk additions

### Phase 6: Deployment and Verification
**Rationale:** Deployment is the final gate. URL verification, redirect testing, and production configuration must happen last, after all content and features are in place.
**Delivers:** Cloudflare Pages deployment, custom domain configuration, `_redirects` file with all required redirects, full URL audit (old vs new), sitemap submission to Google Search Console, feed validation.
**Addresses:** Production readiness, URL preservation verification
**Avoids:** Pitfall #1 (URL verification), Pitfall #2 (trailing slash -- verify in production), Pitfall #4 (Workers vs Pages), Pitfall #13 (`_redirects` placement), Pitfall #15 (reserved URL space)

### Phase Ordering Rationale

- **Phases 1-2-3 are strictly sequential:** schemas before content, content before pages. No parallelism possible.
- **Phase 4 (SEO) before Phase 5 (engagement):** SEO is a launch requirement; engagement features are not. If time pressure forces a cut, Phase 5 can be deferred.
- **Phase 6 must be last:** deployment verification requires all content and features to be present. Deploying incrementally would create a period of broken URLs.
- **Content migration (Phase 2) is the schedule risk:** it involves the most unknowns (WordPress export quality, image cleanup, metadata extraction). Budget extra time here.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Content Migration):** The `.md` endpoint on joost.blog needs to be tested to determine exactly what frontmatter and content it produces. Yoast SEO metadata extraction method is unknown. Image inventory needs assessment. A migration script must be designed.
- **Phase 3 (Routing):** WordPress permalink structure needs to be verified (root-level vs `/blog/` prefix). Ovidius category page routing needs comparison against WordPress category URLs.

Phases with standard patterns (skip deep research):
- **Phase 1 (Scaffolding):** Well-documented Astro + Ovidius setup. Follow theme README.
- **Phase 4 (SEO):** Standard Astro patterns for meta tags, structured data, RSS. Ovidius already has most of this built in.
- **Phase 5 (Engagement):** Each feature is independent and well-documented (Giscus, ViewTransitions, dark mode).
- **Phase 6 (Deployment):** Standard Cloudflare Pages deployment. Follow Astro official docs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are established, well-documented, and already integrated in the Ovidius theme. No experimental dependencies. |
| Features | HIGH | Feature landscape is clear -- 66 posts, 10 categories, 8 videos. Table stakes vs differentiators are well-defined. Scope is bounded by PROJECT.md. |
| Architecture | HIGH | Standard Astro SSG pattern with official documentation. Content collections, file-based routing, and static output are Astro's primary use case. |
| Pitfalls | HIGH | Every critical pitfall is documented across multiple independent migration case studies and official issue trackers. Prevention strategies are concrete. |

**Overall confidence:** HIGH

### Gaps to Address

- **WordPress `.md` endpoint output quality:** Needs hands-on validation. What frontmatter does it include? Does it handle images, embeds, and special formatting? Test with 3-5 representative posts before committing to this migration path.
- **Yoast SEO metadata extraction:** Method for extracting custom meta descriptions, OG images, and SEO titles from WordPress is not determined. May require WP REST API, WP-CLI, or direct database export. Must be resolved before Phase 2 planning.
- **WordPress permalink structure:** Need to verify whether joost.blog uses root-level slugs (`/post-slug/`) or prefixed slugs (`/blog/post-slug/`). This determines routing strategy and redirect requirements.
- **Ovidius theme category routing:** Need to verify the theme's category page URL pattern matches WordPress's `/category/slug/` structure. If not, redirects or route customization are needed.
- **Giscus repository setup:** GitHub Discussions must be enabled on the joost.blog repository. The repo ID and category ID are needed for the Giscus component configuration.

## Sources

### Primary (HIGH confidence)
- [Astro Official Documentation](https://docs.astro.build/) -- content collections, routing, images, deployment, migration
- [Ovidius Theme Repository](https://github.com/JustGoodUI/ovidius-astro-theme) -- theme structure, dependencies, configuration
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/) -- deployment, redirects, build configuration
- [Tailwind CSS v4 Astro Guide](https://tailwindcss.com/docs/installation/framework-guides/astro) -- `@tailwindcss/vite` setup
- [Astro GitHub Releases](https://github.com/withastro/astro/releases) -- version compatibility

### Secondary (MEDIUM confidence)
- [Giscus Integration Guides](https://ericjinks.com/blog/2025/giscus/) -- React component with `client:only` directive
- [WordPress-to-Astro Migration Case Studies](https://kashifaziz.me/blog/wordpress-to-astro-migration-journey/) -- real-world migration patterns and pitfalls
- [Astro Trailing Slash Issues](https://github.com/withastro/astro/issues/13165) -- known Cloudflare Pages behavior
- [Cloudflare Workers vs Pages Confusion](https://www.gmkennedy.com/blog/deploy-astro-cloudflare-pages/) -- deployment targeting

### Tertiary (LOW confidence)
- OG image generation approach (satori + sharp for Astro static builds) -- pattern is documented but has known edge cases with CI builds; deferred to v2+

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
