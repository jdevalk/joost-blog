# Requirements: joost.blog

**Defined:** 2026-03-04
**Core Value:** All existing blog content must be migrated with working URLs, clean markdown, and proper metadata -- nothing gets lost in the move.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Content Migration

- [ ] **CONT-01**: All 66 blog posts migrated with full content, metadata, and images
- [ ] **CONT-02**: All relevant pages migrated (about, contact, plugins, videos hub, privacy, comment policy, work with me, Alfred Quix, embedded playground)
- [ ] **CONT-03**: All 8 video pages migrated as a content collection with YouTube embeds
- [ ] **CONT-04**: All images downloaded from WordPress and stored locally for Astro optimization
- [ ] **CONT-05**: Frontmatter metadata mapped to Astro content collection schema (title, date, excerpt, categories, featured image)
- [ ] **CONT-06**: WordPress shortcodes, block comments, and special formatting cleaned up in all markdown files

### URL Preservation

- [ ] **URL-01**: All existing blog post slugs work at their current URLs (root-level: /post-slug/)
- [ ] **URL-02**: All existing page URLs work (/about-me/, /contact-me/, /plugins/, etc.)
- [ ] **URL-03**: /feed/ redirects to /rss.xml via Cloudflare Pages _redirects
- [ ] **URL-04**: /cms/* and /cms-market-share/* URL space reserved for future use
- [ ] **URL-05**: Video page URLs preserved at /videos/video-slug/

### Theme and Branding

- [ ] **THEME-01**: Ovidius theme installed and configured as project base
- [ ] **THEME-02**: Homepage hero section with Joost's bio, photo, and social links
- [ ] **THEME-03**: Navigation menu with About, Plugins, Videos, Contact links
- [ ] **THEME-04**: Site colors and typography customized to match Joost's brand
- [ ] **THEME-05**: Dark mode toggle with localStorage preference persistence

### Blog Functionality

- [ ] **BLOG-01**: Blog post listing page with pagination
- [ ] **BLOG-02**: Individual post pages with date, category, reading time
- [ ] **BLOG-03**: Category archive pages for all 10 categories
- [ ] **BLOG-04**: Related posts displayed at bottom of each article (category-based, limit 3)
- [ ] **BLOG-05**: RSS feed generated at /rss.xml
- [ ] **BLOG-06**: XML sitemap generated automatically
- [ ] **BLOG-07**: Custom 404 page

### SEO

- [ ] **SEO-01**: OpenGraph meta tags on all pages (title, description, image)
- [ ] **SEO-02**: Auto-generated OpenGraph images from post title/category at build time
- [ ] **SEO-03**: Canonical URLs on all pages
- [ ] **SEO-04**: Meta descriptions from post excerpts/frontmatter
- [ ] **SEO-05**: Structured data (Article JSON-LD) on blog posts
- [ ] **SEO-06**: Proper heading hierarchy throughout templates

### Performance

- [ ] **PERF-01**: Images optimized at build time (WebP/AVIF, responsive sizes, lazy loading)
- [ ] **PERF-02**: YouTube embeds use facade pattern (lite-youtube-embed or astro-embed)
- [ ] **PERF-03**: Zero unnecessary JavaScript shipped (Astro islands only for interactive components)

### Engagement

- [ ] **ENG-01**: Giscus comment system integrated on blog posts
- [ ] **ENG-02**: View transitions between pages for smooth navigation

### Deployment

- [ ] **DEPLOY-01**: Site builds and deploys to Cloudflare Pages
- [ ] **DEPLOY-02**: Custom domain (joost.blog) configured
- [ ] **DEPLOY-03**: _redirects file for feed URL and future CMS space

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
- **FEAT-V2-04**: Full-text search (Pagefind)

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
| CONT-01 | Phase 2: Content Migration | Pending |
| CONT-02 | Phase 2: Content Migration | Pending |
| CONT-03 | Phase 2: Content Migration | Pending |
| CONT-04 | Phase 2: Content Migration | Pending |
| CONT-05 | Phase 2: Content Migration | Pending |
| CONT-06 | Phase 2: Content Migration | Pending |
| URL-01 | Phase 3: Routing and Core Pages | Pending |
| URL-02 | Phase 3: Routing and Core Pages | Pending |
| URL-03 | Phase 6: Deployment and Verification | Pending |
| URL-04 | Phase 6: Deployment and Verification | Pending |
| URL-05 | Phase 3: Routing and Core Pages | Pending |
| THEME-01 | Phase 1: Project Scaffolding and Theme Setup | Pending |
| THEME-02 | Phase 1: Project Scaffolding and Theme Setup | Pending |
| THEME-03 | Phase 1: Project Scaffolding and Theme Setup | Pending |
| THEME-04 | Phase 1: Project Scaffolding and Theme Setup | Pending |
| THEME-05 | Phase 1: Project Scaffolding and Theme Setup | Pending |
| BLOG-01 | Phase 3: Routing and Core Pages | Pending |
| BLOG-02 | Phase 3: Routing and Core Pages | Pending |
| BLOG-03 | Phase 3: Routing and Core Pages | Pending |
| BLOG-04 | Phase 3: Routing and Core Pages | Pending |
| BLOG-05 | Phase 3: Routing and Core Pages | Pending |
| BLOG-06 | Phase 3: Routing and Core Pages | Pending |
| BLOG-07 | Phase 3: Routing and Core Pages | Pending |
| SEO-01 | Phase 4: SEO and Performance | Pending |
| SEO-02 | Phase 4: SEO and Performance | Pending |
| SEO-03 | Phase 4: SEO and Performance | Pending |
| SEO-04 | Phase 4: SEO and Performance | Pending |
| SEO-05 | Phase 4: SEO and Performance | Pending |
| SEO-06 | Phase 4: SEO and Performance | Pending |
| PERF-01 | Phase 2: Content Migration | Pending |
| PERF-02 | Phase 4: SEO and Performance | Pending |
| PERF-03 | Phase 4: SEO and Performance | Pending |
| ENG-01 | Phase 5: Engagement Features | Pending |
| ENG-02 | Phase 5: Engagement Features | Pending |
| DEPLOY-01 | Phase 6: Deployment and Verification | Pending |
| DEPLOY-02 | Phase 6: Deployment and Verification | Pending |
| DEPLOY-03 | Phase 6: Deployment and Verification | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after roadmap creation*
