# joost.blog

## What This Is

A personal blog for Joost de Valk (founder of Yoast, internet entrepreneur), rebuilt from WordPress to a static Astro site using the Ovidius theme. The site covers WordPress, open source, development, SEO, productivity, and personal topics. Deployed on Cloudflare Pages.

## Core Value

All existing blog content must be migrated with working URLs, clean markdown, and proper metadata — nothing gets lost in the move.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Migrate all 66 blog posts with full content, metadata, and images
- [ ] Migrate all relevant pages (about, contact, plugins, blog, videos hub, privacy, comment policy)
- [ ] Migrate 8 video pages as a content collection
- [ ] Preserve all existing post/page URL slugs (no broken links)
- [ ] Set up Ovidius theme with Joost's branding (colors, bio, social links)
- [ ] Homepage with hero/bio section and recent posts grid
- [ ] Category pages for all 10 categories
- [ ] Comment system (Giscus or similar)
- [ ] RSS feed
- [ ] Sitemap generation
- [ ] SEO: OpenGraph images, canonical URLs, meta descriptions
- [ ] Deploy to Cloudflare Pages
- [ ] Reserve /cms/* and /cms-market-share/* URL space for future data (placeholder or 404 for now)
- [ ] Download all content from joost.blog using .md endpoints

### Out of Scope

- CMS directory (465 entries) — will be rebuilt as a separate feature later
- CMS market share data pages with interactive charts — will be replaced with new data later
- WordPress admin/backend functionality
- Email subscription backend (front-end form only if theme includes it)
- Search functionality beyond what Astro/theme provides out of the box

## Context

- Current site is WordPress with Yoast SEO, custom theme, custom post types
- The site has a markdown export endpoint: append `.md` to any URL to get clean markdown
- Ovidius theme: Astro 5.x + Tailwind CSS, supports Markdown/MDX, has hero section, RSS, sitemap
- Theme source: https://justgoodui.com/astro-themes/ovidius/
- Content spans 2022–2026, mix of long-form essays, short posts, and video embeds
- 10 categories: Development, Market Share Analysis, Open Source, Personal Stuff, Post from Joost, Productivity Hacks, Search Opinion, Short, Travel, WordPress
- 1 tag: GitHub (minimal tag usage)
- Videos are embedded talks/presentations (YouTube embeds likely)

## Constraints

- **Theme**: Ovidius Astro theme as the base — customize, don't rewrite
- **Hosting**: Cloudflare Pages — static output required
- **URLs**: All existing blog post and page URLs must work unchanged
- **Content format**: Markdown/MDX via Astro content collections
- **Comments**: Need a static-site-compatible comment system (Giscus recommended)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro over other SSGs | User's choice, modern, fast, great DX | — Pending |
| Ovidius theme | Clean, content-focused, single-author blog design | — Pending |
| Cloudflare Pages | Fast CDN, free tier, good Astro support | — Pending |
| Drop CMS directory for now | 465 entries add complexity, will rebuild with new data later | — Pending |
| Drop market share pages for now | Data-driven pages need new approach, rebuild later | — Pending |
| Giscus for comments | GitHub-based, works with static sites, free | — Pending |

---
*Last updated: 2026-03-03 after initialization*
