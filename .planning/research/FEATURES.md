# Feature Landscape

**Domain:** Personal blog migration (WordPress to Astro static site)
**Researched:** 2026-03-04

## Table Stakes

Features users expect. Missing = product feels incomplete or the migration is a regression.

### Content Preservation (Migration-Critical)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All 66 blog posts with full content | Core content cannot be lost in migration | Medium | Use `.md` endpoint on current site to export. Manual cleanup likely needed for shortcodes, embeds, special formatting |
| All pages (about, contact, plugins, videos hub, privacy, comment policy) | These are linked externally and from navigation | Medium | Pages have varied structures -- about page is especially rich with social links, speaking CTA, professional history |
| All images downloaded and optimized | Posts reference images that must continue working | Medium | Download from WordPress, store in `src/assets/` for Astro optimization. Rewrite image paths in markdown |
| Frontmatter metadata (title, date, excerpt, categories, featured image) | SEO and content organization depend on this | Low | Map WordPress metadata to Astro content collection schema |
| URL preservation (all existing slugs work) | Breaking URLs = losing SEO equity and external links | Low | Astro file-based routing matches slugs. Use `_redirects` on Cloudflare Pages for any structural changes (e.g., `/feed/` to `/rss.xml`) |
| 8 video pages as content collection | Existing content type on the site | Low | YouTube embeds with title, thumbnail. Use `astro-embed` YouTube component for performance (lite-youtube-embed under the hood) |

### Core Blog Functionality

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Homepage with hero/bio and recent posts grid | First impression; current site has this pattern | Low | Ovidius theme includes hero section and post grid out of the box |
| Blog post listing with pagination | Standard blog navigation | Low | Ovidius includes pagination. Configure posts-per-page in `site-config.ts` |
| Individual post pages with date, category, author | Basic blog post display | Low | Ovidius handles this. Add reading time calculation as enhancement |
| Category pages for all 10 categories | Current site has category filtering; readers use these | Medium | Need to generate category archive pages. Astro `getStaticPaths()` with content collection filtering |
| RSS feed at a discoverable URL | Subscribers depend on this; current site has `/feed/` | Low | `@astrojs/rss` integration. Add `_redirects` rule: `/feed/ /rss.xml 301` to preserve existing subscriber URLs |
| XML sitemap | SEO table stakes | Low | `@astrojs/sitemap` integration included in Ovidius theme |
| Custom 404 page | Broken links should show a helpful page, not a blank error | Low | Create `src/pages/404.astro`. For static Cloudflare Pages, ensure output is `404.html` not `404/index.html` |
| Navigation menu (about, plugins, contact, videos) | Site navigation must work | Low | Ovidius has nav config in `site-config.ts` |

### SEO (Non-Negotiable for Joost de Valk's Site)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OpenGraph meta tags (title, description, image) | Social sharing previews. Joost literally founded Yoast SEO -- this must be flawless | Medium | Per-page OG tags from frontmatter. Generate or provide OG images for each post |
| Canonical URLs | Prevent duplicate content in search engines | Low | Ovidius supports this. Construct via `new URL(Astro.url.pathname, Astro.site)` |
| Meta descriptions from post excerpts | Control search result snippets | Low | Map WordPress excerpts/meta descriptions to frontmatter `description` field |
| Structured data (Article schema) | Current site has schema markup; search engines rely on it | Medium | JSON-LD in post layout: headline, author, datePublished, dateModified, image. Article schema helps with rich results |
| Proper heading hierarchy (h1-h6) | Accessibility and SEO fundamental | Low | Enforce in content and templates |
| Clean HTML output (no JavaScript bloat) | Astro's core value proposition -- zero JS by default | Low | Default Astro behavior. Only ship JS for interactive components (comments, dark mode toggle) |

### Performance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Image optimization (WebP/AVIF, responsive sizes, lazy loading) | Images are 60-70% of page weight. Lighthouse scores matter for credibility | Low | Astro's `<Image>` and `<Picture>` components handle this. Store images in `src/assets/` for build-time optimization |
| Fast page loads (static HTML) | Core reason for migrating from WordPress to Astro | Low | Inherent to static site generation. Target Lighthouse 100 |
| Efficient YouTube embeds | Current site has video embeds; they should not tank performance | Low | Use `astro-embed` YouTube component (facade pattern -- loads iframe only on click) |

## Differentiators

Features that set the site apart. Not strictly expected, but improve the experience and show craft.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dark mode toggle | Reduces eye strain, shows modern design sensibility. Increasingly expected on tech blogs | Medium | CSS custom properties + small JS toggle. Store preference in localStorage. Ovidius may not include this -- needs theme customization |
| Reading time estimate | Helps readers decide whether to commit. Improves time-on-site (measured 13.8% improvement in one study) | Low | Calculate `Math.ceil(wordCount / 200)` at build time. Display in post header |
| View transitions (page animations) | Polished feel; the current WordPress site already has view transition animations | Low | Astro has built-in View Transitions API support. Add `<ViewTransitions />` to layout |
| Related posts at bottom of articles | Reduces bounce rate, increases engagement. Category-based matching is simple and effective | Medium | Filter content collection by matching category, exclude current post, limit to 3. Display at bottom of post layout |
| Social sharing links | Let readers share content easily | Low | Static links (no JS needed) to Twitter/X, LinkedIn, Bluesky with pre-filled URL and title |
| Code syntax highlighting | Tech blog with development content needs readable code blocks | Low | Astro includes Shiki syntax highlighting out of the box for Markdown code fences |
| Table of contents for long posts | Aids navigation in long-form essays | Medium | Generate from heading elements at build time. Optional per-post via frontmatter flag |
| Newsletter subscribe form (front-end only) | Captures interested readers. Ovidius includes subscribe form component | Low | Ovidius has this built in. Connect to Mailchimp/ConvertKit/Formspree as needed |
| Open Graph images (auto-generated) | Consistent, branded social preview images for every post | High | Use `@vercel/og` or `satori` to generate OG images from post title/category at build time. Alternatively, use a template in Figma and export manually for 66 posts |
| Previous/Next post navigation | Helps readers discover adjacent content chronologically | Low | Sort content collection by date, find adjacent entries, render links at bottom of post |

## Anti-Features

Features to explicitly NOT build. These add complexity without proportional value for a personal blog.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full-text search | Adds JS weight (Pagefind ~40KB), unnecessary for 66 posts. The current WordPress site does not prominently feature search | Let users use browser Ctrl+F or Google `site:joost.blog query` |
| CMS admin panel / headless WordPress | Adds deployment complexity, defeats purpose of migration to static. Content is authored in markdown files | Edit `.md` files directly in code editor or GitHub |
| Email subscription backend | Out of scope per PROJECT.md. Backend requires server infrastructure | Front-end-only form that posts to third-party service (Mailchimp, ConvertKit, Buttondown) |
| Multi-author support | Single-author blog. Adding author management is unnecessary overhead | Hardcode author info in site config |
| Tag system beyond categories | Current site has 1 tag ("GitHub") across all content. Tags add UI complexity for no value | Use the 10 existing categories only |
| Server-side rendering (SSR) | Static output required for Cloudflare Pages. SSR adds complexity and cost | Pure static generation (`output: 'static'` in Astro config) |
| Analytics dashboard / tracking | Not a feature of the blog itself. Separate concern | Add PostHog, Plausible, or Cloudflare Web Analytics as a simple script tag |
| CMS directory (465 entries) | Explicitly out of scope per PROJECT.md. Complex data-driven feature that will be rebuilt separately later | Reserve `/cms/*` URL space with placeholder or redirect |
| CMS market share pages | Explicitly out of scope per PROJECT.md. Requires data pipeline and charts | Reserve `/cms-market-share/*` URL space with placeholder or redirect |
| Internationalization (i18n) | English-only personal blog. No current or planned need for multiple languages | Single-language site |
| User accounts / authentication | Static site, no user state needed | Comments via Giscus (GitHub auth, handled externally) |

## Feature Dependencies

```
Content Migration (posts, pages, images)
  --> Blog Post Pages (need content to display)
    --> Category Pages (need posts with categories)
    --> RSS Feed (needs post collection)
    --> Sitemap (needs all pages)
    --> Related Posts (needs post collection with categories)
    --> Previous/Next Navigation (needs sorted post collection)

Astro Content Collections Schema
  --> Blog Posts (schema validates frontmatter)
  --> Video Pages (separate collection, own schema)
  --> Category Pages (derive from post categories)

SEO Meta Tags
  --> OpenGraph Tags (depends on frontmatter metadata)
  --> Structured Data (depends on frontmatter metadata)
  --> Canonical URLs (depends on site config)

Theme Customization (Ovidius)
  --> Homepage Hero (site-config.ts)
  --> Navigation (site-config.ts)
  --> Dark Mode (requires CSS + JS additions to theme)
  --> Reading Time (add to post layout)

URL Preservation
  --> _redirects file for Cloudflare Pages (old feed URL, any changed paths)
  --> Blog post slugs must match WordPress slugs exactly

Giscus Comments
  --> GitHub repository with Discussions enabled
  --> Giscus app installed on repo
  --> React component with client:only directive
```

## MVP Recommendation

**Phase 1 -- Foundation and Content Migration (must ship first):**
1. Ovidius theme setup with branding (hero, nav, social links, colors)
2. Content collection schema for blog posts and video pages
3. Download and migrate all 66 posts + pages + images via `.md` endpoints
4. URL preservation (file routing + `_redirects` for feed URL)
5. Category archive pages

**Phase 2 -- SEO and Polish (ship shortly after):**
1. OpenGraph meta tags on all pages
2. Structured data (Article JSON-LD)
3. RSS feed (with redirect from `/feed/`)
4. Sitemap
5. Custom 404 page
6. Reading time display

**Phase 3 -- Engagement Features:**
1. Giscus comments integration
2. Dark mode toggle
3. Related posts
4. View transitions
5. Previous/next post navigation
6. Social sharing links

**Defer indefinitely:**
- Full-text search: 66 posts do not justify the added JS weight
- CMS directory / market share pages: explicitly deferred per project scope
- OG image generation: nice-to-have but High complexity; use manual images or a simple template initially

## Sources

- [Astro WordPress Migration Guide](https://docs.astro.build/en/guides/migrate-to-astro/from-wordpress/)
- [Ovidius Astro Theme GitHub](https://github.com/JustGoodUI/ovidius-astro-theme)
- [Ovidius Theme on Astro](https://astro.build/themes/details/ovidius/)
- [Giscus Setup in Astro](https://ericjinks.com/blog/2025/giscus/)
- [Astro Comment Systems Guide](https://eastondev.com/blog/en/posts/dev/20251204-astro-comment-systems-guide/)
- [Astro Embed YouTube Component](https://astro-embed.netlify.app/components/youtube/)
- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Astro Image Optimization Guide](https://eastondev.com/blog/en/posts/dev/20251203-astro-image-optimization-guide/)
- [Astro SEO Complete Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/)
- [WordPress to Astro Migration Journey (100 Lighthouse)](https://kashifaziz.me/blog/wordpress-to-astro-migration-journey/)
- [WordPress to Astro Content Migration](https://blog.hompus.nl/2025/01/27/migrating-from-wordpress-to-astro-how-i-moved-my-blog-content/)
- [Astro Cloudflare Redirects Integration](https://kristianfreeman.com/astro-cloudflare-redirects)
- [Current site: joost.blog](https://joost.blog) -- features audit performed 2026-03-04
