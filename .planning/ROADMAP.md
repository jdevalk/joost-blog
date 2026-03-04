# Roadmap: joost.blog

## Overview

Migrate joost.blog from WordPress to a static Astro site using the Ovidius theme, deployed on Cloudflare Pages. The work flows through six phases: scaffold the project with branding, migrate all content, wire up routing and core pages, layer SEO and performance, add engagement features, then deploy and verify. Content migration is the highest-risk phase; deployment verification is the final gate. Every existing URL must survive the transition.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Scaffolding and Theme Setup** - Working Astro project with Ovidius theme, branding, navigation, and homepage
- [x] **Phase 2: Content Migration** - All blog posts, pages, videos, and images migrated as validated Astro content collections (completed 2026-03-04)
- [x] **Phase 3: Routing and Core Pages** - All content rendered at correct URLs with blog listing, categories, and video pages (completed 2026-03-04)
- [ ] **Phase 4: SEO and Performance** - Production-quality SEO metadata, feeds, sitemap, and optimized asset delivery
- [ ] **Phase 5: Engagement Features** - Comments and view transitions for an interactive reading experience
- [ ] **Phase 6: Deployment and Verification** - Live on Cloudflare Pages with custom domain and verified URL preservation

## Phase Details

### Phase 1: Project Scaffolding and Theme Setup
**Goal**: A browsable Astro site with Ovidius theme, Joost's branding, homepage hero, and navigation -- ready to receive content
**Depends on**: Nothing (first phase)
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04, THEME-05
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` serves a local Astro site with the Ovidius theme applied
  2. The homepage displays a hero section with Joost's bio, photo, and social links
  3. Navigation menu includes About, Plugins, Videos, and Contact links
  4. Site colors and typography reflect Joost's brand (not Ovidius defaults)
  5. Dark mode toggle works and remembers the user's preference across page loads
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Clone Ovidius theme, swap font to Mona Sans, update brand colors, configure Shiki dual themes
- [x] 01-02-PLAN.md -- Configure hero/nav/social links, download profile photo, build dark mode toggle with FOUC prevention

### Phase 2: Content Migration
**Goal**: All 66 blog posts, static pages, 8 video pages, and all images exist as validated Astro content collections with clean markdown and correct frontmatter
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, PERF-01
**Success Criteria** (what must be TRUE):
  1. All 66 blog posts exist as markdown files with title, date, excerpt, categories, and featured image in frontmatter
  2. All static pages (about, contact, plugins, videos hub, privacy, comment policy, work with me, Alfred Quix, embedded playground) exist as markdown files
  3. All 8 video pages exist as a separate content collection with YouTube embed data
  4. All images are downloaded locally and referenced with relative paths (no WordPress URLs remain)
  5. Running `astro build` succeeds with zero content validation errors against Zod schemas
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md -- Build Node.js migration script and add videos collection schema to content.config.ts
- [ ] 02-02-PLAN.md -- Execute migration for all 85 content files, download ~166 images, validate against Astro schemas
- [ ] 02-03-PLAN.md -- Generate migration audit report and human review of content quality

### Phase 3: Routing and Core Pages
**Goal**: Every piece of migrated content renders at its correct URL, with blog listing, category archives, video pages, and a custom 404
**Depends on**: Phase 2
**Requirements**: URL-01, URL-02, URL-05, BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06, BLOG-07
**Success Criteria** (what must be TRUE):
  1. Every blog post is accessible at its original WordPress slug (e.g., /post-slug/)
  2. Every static page is accessible at its original URL (e.g., /about-me/, /contact-me/, /plugins/)
  3. Video pages are accessible at /videos/video-slug/ and the videos hub page works
  4. Blog listing page shows posts with pagination, and each post displays date, category, and reading time
  5. All 10 category archive pages exist and show the correct posts filtered by category
  6. RSS feed is generated at /rss.xml, XML sitemap is generated, and a custom 404 page displays
  7. Related posts (up to 3, category-based) appear at the bottom of each blog post
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Rewire routing from /blog/{slug}/ to /{slug}/, add utilities (slugify, readingTime, relatedPosts), update RSS
- [ ] 03-02-PLAN.md -- Enhance PostPreview with categories and reading time, update blog listing page
- [ ] 03-03-PLAN.md -- Create category archives, video pages (hub + individual), YouTube embed, and 404 page

### Phase 4: SEO and Performance
**Goal**: Every page has production-quality SEO metadata, structured data, and optimized asset delivery -- befitting the blog of the Yoast SEO founder
**Depends on**: Phase 3
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. Every page has OpenGraph meta tags (title, description, image) and canonical URLs in the HTML head
  2. Blog posts include Article JSON-LD structured data with author, date, and description
  3. Meta descriptions are populated from post excerpts or frontmatter on all pages
  4. OpenGraph images are auto-generated at build time from post title and category
  5. Proper heading hierarchy (single h1, logical h2-h6) is maintained across all page templates
  6. YouTube embeds use a facade/lite pattern (no iframe loaded until user clicks)
  7. Zero unnecessary JavaScript is shipped -- only Astro islands for interactive components
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Engagement Features
**Goal**: Readers can comment on posts and experience smooth page transitions
**Depends on**: Phase 3
**Requirements**: ENG-01, ENG-02
**Success Criteria** (what must be TRUE):
  1. Blog posts display a Giscus comment section that loads comments from GitHub Discussions
  2. Users can write and submit comments via their GitHub account
  3. Navigating between pages uses view transitions for smooth, app-like feel
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Deployment and Verification
**Goal**: The site is live on Cloudflare Pages at joost.blog with all URLs verified and redirects working
**Depends on**: Phase 4, Phase 5
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, URL-03, URL-04
**Success Criteria** (what must be TRUE):
  1. The site builds and deploys successfully to Cloudflare Pages with static output
  2. joost.blog resolves to the Cloudflare Pages deployment with HTTPS
  3. /feed/ redirects to /rss.xml via _redirects file
  4. /cms/* and /cms-market-share/* URLs return a placeholder or 404 (reserved for future use)
  5. A full crawl of all known WordPress URLs confirms every one resolves correctly on the new site
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4/5 (parallel possible) > 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding and Theme Setup | 2/2 | Complete | 2026-03-04 |
| 2. Content Migration | 3/3 | Complete   | 2026-03-04 |
| 3. Routing and Core Pages | 3/3 | Complete   | 2026-03-04 |
| 4. SEO and Performance | 0/? | Not started | - |
| 5. Engagement Features | 0/? | Not started | - |
| 6. Deployment and Verification | 0/? | Not started | - |
