# Requirements: joost.blog

**Defined:** 2026-03-04
**Core Value:** All existing blog content must be migrated with working URLs, clean markdown, and proper metadata -- nothing gets lost in the move.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Content Migration

- [x] **CONT-01**: All 66 blog posts migrated with full content, metadata, and images
- [x] **CONT-02**: All relevant pages migrated (about, contact, plugins, videos hub, privacy, comment policy, work with me, Alfred Quix, embedded playground)
- [x] **CONT-03**: All 8 video pages migrated as a content collection with YouTube embeds
- [x] **CONT-04**: All images downloaded from WordPress and stored locally for Astro optimization
- [x] **CONT-05**: Frontmatter metadata mapped to Astro content collection schema (title, date, excerpt, categories, featured image)
- [x] **CONT-06**: WordPress shortcodes, block comments, and special formatting cleaned up in all markdown files

### URL Preservation

- [x] **URL-01**: All existing blog post slugs work at their current URLs (root-level: /post-slug/)
- [x] **URL-02**: All existing page URLs work (/about-me/, /contact-me/, /plugins/, etc.)
- [ ] **URL-03**: /feed/ redirects to /rss.xml via Cloudflare Pages _redirects
- [ ] **URL-04**: /cms/* and /cms-market-share/* URL space reserved for future use
- [x] **URL-05**: Video page URLs preserved at /videos/video-slug/

### Theme and Branding

- [x] **THEME-01**: Ovidius theme installed and configured as project base
- [x] **THEME-02**: Homepage hero section with Joost's bio, photo, and social links
- [x] **THEME-03**: Navigation menu with About, Plugins, Videos, Contact links
- [x] **THEME-04**: Site colors and typography customized to match Joost's brand
- [x] **THEME-05**: Dark mode toggle with localStorage preference persistence

### Blog Functionality

- [x] **BLOG-01**: Blog post listing page with pagination
- [x] **BLOG-02**: Individual post pages with date, category, reading time
- [x] **BLOG-03**: Category archive pages for all 10 categories
- [x] **BLOG-04**: Related posts displayed at bottom of each article (category-based, limit 3)
- [x] **BLOG-05**: RSS feed generated at /rss.xml
- [x] **BLOG-06**: XML sitemap generated automatically
- [x] **BLOG-07**: Custom 404 page

### SEO

- [x] **SEO-01**: OpenGraph meta tags on all pages (title, description, image)
- [x] **SEO-02**: Auto-generated OpenGraph images from post title/category at build time
- [x] **SEO-03**: Canonical URLs on all pages
- [x] **SEO-04**: Meta descriptions from post excerpts/frontmatter
- [x] **SEO-05**: Structured data (Article JSON-LD) on blog posts
- [x] **SEO-06**: Proper heading hierarchy throughout templates

### Performance

- [x] **PERF-01**: Images optimized at build time (WebP/AVIF, responsive sizes, lazy loading)
- [x] **PERF-02**: YouTube embeds use facade pattern (lite-youtube-embed or astro-embed)
- [x] **PERF-03**: Zero unnecessary JavaScript shipped (Astro islands only for interactive components)

### Engagement

- [x] **ENG-01**: Giscus comment system integrated on blog posts
- [x] **ENG-02**: View transitions between pages for smooth navigation

### Deployment

- [ ] **DEPLOY-01**: Site builds and deploys to Cloudflare Pages
- [ ] **DEPLOY-02**: Custom domain (joost.blog) configured
- [ ] **DEPLOY-03**: _redirects file for feed URL and future CMS space

### Schema (Structured Data)

- [x] **SCHEMA-01**: Every page has single JSON-LD block with @context and @graph array (Yoast-style)
- [x] **SCHEMA-02**: Blog posts output Article + WebPage + BreadcrumbList + ImageObject in graph
- [x] **SCHEMA-03**: Rich Person entity with sameAs (12 profiles), worksFor (5 EmployeeRoles), spouse, children
- [x] **SCHEMA-04**: All @id cross-references resolve correctly within the graph
- [x] **SCHEMA-05**: Breadcrumbs follow specified hierarchy per page type (Home > Blog > Category > Post, etc.)
- [x] **SCHEMA-06**: Video pages output VideoObject + WebPage + BreadcrumbList in graph
- [x] **SCHEMA-07**: WebSite and SiteNavigationElement pieces included on all pages
- [x] **SCHEMA-08**: Page-type-specific subtypes: CollectionPage (homepage, blog listing, categories), ProfilePage (about)

### Site Search

- [x] **SEARCH-01**: Pagefind integration generates search index at build time
- [x] **SEARCH-02**: Only article content indexed (not nav, footer, comments, schema markup)
- [x] **SEARCH-03**: Blog post categories available as Pagefind filter metadata
- [x] **SEARCH-04**: Dedicated search page at /search/ with Pagefind default UI
- [x] **SEARCH-05**: Search UI styled for both light and dark mode matching site theme

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content

- **CONT-V2-01**: CMS directory rebuilt with new data (465+ entries)
- **CONT-V2-02**: CMS market share data pages with interactive charts
- **CONT-V2-03**: Newsletter subscribe form connected to email provider backend

### Features

- **FEAT-V2-01**: Previous/next post navigation
- **FEAT-V2-02**: Social sharing links (Twitter/X, LinkedIn, Bluesky)
- **FEAT-V2-03**: Table of contents for long posts

## Out of Scope

| Feature | Reason |
|---------|--------|
| CMS admin panel / headless WordPress | Defeats purpose of static site migration |
| Server-side rendering (SSR) | Static output required for Cloudflare Pages |
| Multi-author support | Single-author blog |
| Tag system beyond categories | Only 1 tag exists across all content |
| User accounts / authentication | Static site, no user state |
| Internationalization (i18n) | English-only personal blog |
| Email subscription backend | Front-end form only; backend is third-party concern |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 2: Content Migration | Complete |
| CONT-02 | Phase 2: Content Migration | Complete |
| CONT-03 | Phase 2: Content Migration | Complete |
| CONT-04 | Phase 2: Content Migration | Complete |
| CONT-05 | Phase 2: Content Migration | Complete |
| CONT-06 | Phase 2: Content Migration | Complete |
| URL-01 | Phase 3: Routing and Core Pages | Complete |
| URL-02 | Phase 3: Routing and Core Pages | Complete |
| URL-03 | Phase 6: Deployment and Verification | Pending |
| URL-04 | Phase 6: Deployment and Verification | Pending |
| URL-05 | Phase 3: Routing and Core Pages | Complete |
| THEME-01 | Phase 1: Project Scaffolding and Theme Setup | Complete |
| THEME-02 | Phase 1: Project Scaffolding and Theme Setup | Complete |
| THEME-03 | Phase 1: Project Scaffolding and Theme Setup | Complete |
| THEME-04 | Phase 1: Project Scaffolding and Theme Setup | Complete |
| THEME-05 | Phase 1: Project Scaffolding and Theme Setup | Complete |
| BLOG-01 | Phase 3: Routing and Core Pages | Complete |
| BLOG-02 | Phase 3: Routing and Core Pages | Complete |
| BLOG-03 | Phase 3: Routing and Core Pages | Complete |
| BLOG-04 | Phase 3: Routing and Core Pages | Complete |
| BLOG-05 | Phase 3: Routing and Core Pages | Complete |
| BLOG-06 | Phase 3: Routing and Core Pages | Complete |
| BLOG-07 | Phase 3: Routing and Core Pages | Complete |
| SEO-01 | Phase 4: SEO and Performance | Complete |
| SEO-02 | Phase 4: SEO and Performance | Complete |
| SEO-03 | Phase 4: SEO and Performance | Complete |
| SEO-04 | Phase 4: SEO and Performance | Complete |
| SEO-05 | Phase 4: SEO and Performance | Complete |
| SEO-06 | Phase 4: SEO and Performance | Complete |
| PERF-01 | Phase 2: Content Migration | Complete |
| PERF-02 | Phase 4: SEO and Performance | Complete |
| PERF-03 | Phase 4: SEO and Performance | Complete |
| ENG-01 | Phase 5: Engagement Features | Complete |
| ENG-02 | Phase 5: Engagement Features | Complete |
| DEPLOY-01 | Phase 6: Deployment and Verification | Pending |
| DEPLOY-02 | Phase 6: Deployment and Verification | Pending |
| DEPLOY-03 | Phase 6: Deployment and Verification | Pending |
| SCHEMA-01 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-02 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-03 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-04 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-05 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-06 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-07 | Phase 7: Yoast-like Schema | Complete |
| SCHEMA-08 | Phase 7: Yoast-like Schema | Complete |
| SEARCH-01 | Phase 8: Add site search | Complete |
| SEARCH-02 | Phase 8: Add site search | Complete |
| SEARCH-03 | Phase 8: Add site search | Complete |
| SEARCH-04 | Phase 8: Add site search | Complete |
| SEARCH-05 | Phase 8: Add site search | Complete |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-05 after Phase 8 planning*
