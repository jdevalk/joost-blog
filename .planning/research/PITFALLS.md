# Domain Pitfalls

**Domain:** WordPress-to-Astro blog migration (joost.blog)
**Researched:** 2026-03-04

## Critical Pitfalls

Mistakes that cause rewrites, SEO damage, or major content loss.

### Pitfall 1: Broken URLs Destroying SEO Rankings

**What goes wrong:** WordPress URL structures (post slugs, category pages, pagination) don't map 1:1 to Astro's file-based routing. Any URL that changes without a 301 redirect is treated by Google as a brand-new unranked page. For a site with 66 posts built over 4 years, this means losing all accumulated link equity and search rankings overnight.

**Why it happens:** WordPress uses database-driven permalinks (`/post-slug/`, `/category/name/`) while Astro uses file-based routing (`src/pages/blog/[slug].astro`). Developers set up the new routes, test that pages render, and declare victory -- without verifying that every single old URL still resolves. Internal links within content also break silently.

**Consequences:** Months of SEO recovery. Broken inbound links from other sites. 404 errors in Google Search Console. Lost referral traffic.

**Prevention:**
1. Crawl the live WordPress site before migration to capture every URL (posts, pages, categories, feeds, sitemaps, image URLs)
2. Build Astro routes to match WordPress permalink structure exactly -- not "close enough"
3. For any URL that must change, add to Cloudflare Pages `_redirects` file as 301
4. Post-migration: crawl the new site and diff against the old URL list. Every URL must either resolve or redirect
5. Submit updated sitemap to Google Search Console immediately after go-live

**Detection:** Run `curl -s -o /dev/null -w "%{http_code}"` against every known URL after deployment. Any 404 is a failure.

**Phase relevance:** Content migration phase AND deployment phase. URL mapping must be designed during content migration but verified during deployment.

**Confidence:** HIGH -- documented across multiple migration case studies and SEO best practices.

---

### Pitfall 2: Trailing Slash Mismatch Between Astro and Cloudflare Pages

**What goes wrong:** WordPress URLs typically include trailing slashes (`/my-post/`). Astro defaults to no trailing slash (`/my-post`). Cloudflare Pages has its own trailing slash behavior: `/about.html` is served at `/about` (no slash), while `/contact/index.html` is served at `/contact/` (with slash). When these three systems disagree, you get redirect loops, duplicate content, or 404s.

**Why it happens:** Astro's `trailingSlash` config, Cloudflare's serving behavior, and the original WordPress URL structure are three independent systems that must agree. Developers configure one and assume the others follow.

**Consequences:** Redirect loops (page never loads), duplicate content penalties from Google (same page at `/post` and `/post/`), broken internal links, incorrect canonical URLs.

**Prevention:**
1. Set `trailingSlash: 'never'` in `astro.config.mjs` (or `'always'` -- but pick one and be consistent)
2. Verify Cloudflare Pages serves pages at the expected URLs by testing after first deployment
3. If WordPress used trailing slashes and you choose `trailingSlash: 'never'`, add redirect rules for the trailing-slash variants
4. Set canonical URLs explicitly in every page's `<head>` to prevent duplicate indexing

**Detection:** After deployment, test both `/post-slug` and `/post-slug/` for every URL pattern. Both should resolve (one via redirect to the other), never both returning 200 with different URLs.

**Phase relevance:** Theme setup phase (Astro config) AND deployment phase (Cloudflare behavior).

**Confidence:** HIGH -- known bug reports in Astro GitHub (issues #12532, #13165, #13690) and multiple Cloudflare community threads.

---

### Pitfall 3: Image References Breaking After Migration

**What goes wrong:** WordPress stores images with absolute URLs pointing to `wp-content/uploads/YYYY/MM/filename.jpg`. After export to markdown, these references remain as absolute URLs to the old WordPress server. Once the WordPress site goes down or changes, every image in every post breaks.

**Why it happens:** Markdown export tools (including the `.md` endpoint on joost.blog) output image references as they exist in WordPress -- absolute URLs. Developers migrate the text content but forget to download, reorganize, and rewrite all image paths. Images with spaces in filenames cause additional breakage.

**Consequences:** Broken images across all posts. Missing alt text (if not preserved). Large images served unoptimized (no Astro image optimization). Potential copyright issues if hotlinking to old CDN.

**Prevention:**
1. Download ALL images from the WordPress site before migration (use `wget --mirror` or script the downloads from the markdown content)
2. Place images in `src/assets/` (not `public/`) so Astro can optimize them via its `image()` schema
3. Rewrite all image paths in markdown files to use relative references
4. Handle edge cases: images with spaces in filenames (rename them), images hosted on external services (download copies), missing images (check Wayback Machine)
5. Verify image count: count images in WordPress, count images downloaded, ensure they match

**Detection:** After build, grep all markdown files for `http://` and `https://` image references -- any remaining absolute URLs to the old domain are bugs.

**Phase relevance:** Content migration phase. Must be done as part of content export, not deferred.

**Confidence:** HIGH -- every migration case study mentions this as a major time sink.

---

### Pitfall 4: Cloudflare Pages Deploying to Workers Instead of Pages

**What goes wrong:** Cloudflare's platform silently routes Astro sites to Workers infrastructure instead of Pages infrastructure. The build succeeds, deployment succeeds, the site appears live -- but it's on `*.workers.dev` instead of `*.pages.dev`, with different behavior, limitations, and configuration options.

**Why it happens:** If the `@astrojs/cloudflare` adapter is installed (even if you only want static output), Astro defaults to server mode, which triggers Workers deployment. Cloudflare's UI doesn't make the distinction obvious. Since April 2025, Cloudflare has been pushing Workers as the default, with Pages in "maintenance mode."

**Consequences:** Unexpected runtime behavior, missing static-site features, confusion about where the site actually lives, potential cost implications.

**Prevention:**
1. For a static blog, do NOT install `@astrojs/cloudflare` adapter at all
2. Explicitly set `output: 'static'` in `astro.config.mjs`
3. Verify deployment URL is `*.pages.dev` after first deploy
4. If misrouted, use the hidden "Shift to Pages" link in Cloudflare dashboard settings

**Detection:** Check the deployment URL domain. If it says `workers.dev`, you're on the wrong platform.

**Phase relevance:** Deployment phase. Get this right on first deploy.

**Confidence:** HIGH -- documented by multiple developers and in Cloudflare community forums.

---

### Pitfall 5: Content Conversion Producing Broken or Ugly Markdown

**What goes wrong:** WordPress content contains shortcodes (`[caption]`, `[gallery]`), Gutenberg block comments (`<!-- wp:paragraph -->`), inline styles (`<span style="...">`), and HTML that doesn't convert cleanly to markdown. The exported markdown looks acceptable at a glance but renders incorrectly in Astro.

**Why it happens:** WordPress's content model is HTML-first with shortcodes layered on top. No automated tool handles every WordPress content pattern perfectly. The `.md` endpoint on joost.blog likely handles the basics but may not strip all WordPress-specific markup. Character encoding issues (especially for non-ASCII characters) add another layer of corruption.

**Consequences:** Visual rendering bugs (double-wrapped elements, broken layouts). Build failures from malformed frontmatter. Time-consuming manual cleanup of 66 posts.

**Prevention:**
1. Export a few posts first, render them in Astro, and inspect the output carefully before batch-converting all 66
2. Build a cleanup script that handles known WordPress artifacts: strip block comments, convert shortcodes, remove unnecessary `<span>` wrappers, fix character encoding
3. Handle YouTube embeds explicitly -- either convert to Astro Embed component (requires MDX) or use raw HTML `<iframe>` tags
4. Validate every post's frontmatter against the Astro content collection schema before considering migration complete

**Detection:** Build the site. Astro's content collection schema validation will catch frontmatter issues. Visual issues require manual review of every post (or at minimum, spot-checking each content type).

**Phase relevance:** Content migration phase. This is the core work of migration.

**Confidence:** HIGH -- confirmed by every migration case study. The joost.blog `.md` endpoint is a significant advantage but won't eliminate all cleanup.

---

## Moderate Pitfalls

### Pitfall 6: Frontmatter Schema Mismatches Causing Build Failures

**What goes wrong:** Astro 5 content collections enforce strict schema validation via Zod. WordPress content has inconsistent metadata: some posts have excerpts, others don't; dates may be in different formats; categories might be strings or arrays; some fields may be empty strings instead of null.

**Why it happens:** WordPress is lenient about metadata. Astro is strict. The gap surfaces as build errors: `"date" must be a valid date`, `required field missing`, `expected string, received null`.

**Prevention:**
1. Define the Astro schema with optional fields and sensible defaults: `description: z.string().optional().default('')`
2. Normalize all dates to ISO 8601 format during export
3. Handle empty descriptions -- make them optional in the schema rather than required
4. Test the schema against ALL 66 posts before considering it finalized, not just a handful

**Detection:** `astro build` will fail with clear error messages pointing to the offending file and field.

**Phase relevance:** Content migration phase (schema design) and theme setup phase (content collection config).

**Confidence:** HIGH -- Astro's own error reference documents these specific errors.

---

### Pitfall 7: Missing or Incorrect SEO Metadata

**What goes wrong:** WordPress with Yoast SEO stores rich metadata: custom meta descriptions, OpenGraph titles, canonical URLs, focus keyphrases. This metadata lives in WordPress's database (wp_postmeta), not in the content itself. Standard markdown exports don't include it.

**Why it happens:** The `.md` endpoint likely exports post content and basic frontmatter (title, date, categories) but Yoast SEO data is stored separately. Without explicit extraction, all custom meta descriptions, OG images, and SEO titles are lost.

**Consequences:** Google shows auto-generated snippets instead of carefully crafted meta descriptions. Social sharing shows generic images instead of custom OG images. Canonical URL issues.

**Prevention:**
1. Before decommissioning WordPress, export Yoast SEO metadata separately (via WP REST API, WP-CLI, or direct database query)
2. Merge SEO metadata into markdown frontmatter: `description`, `ogImage`, `canonicalUrl`
3. If Yoast metadata isn't recoverable, at minimum write meta descriptions for the top-performing posts (check Google Search Console for highest-traffic pages)
4. Set up structured data (JSON-LD BlogPosting schema) in Astro templates

**Detection:** After deployment, run Google's Rich Results Test and validate OG tags with Facebook's Sharing Debugger on sample pages.

**Phase relevance:** Content migration phase (metadata extraction) and SEO setup phase (template implementation).

**Confidence:** MEDIUM -- specific to the Yoast SEO data extraction method available from joost.blog's `.md` endpoint (needs validation of what frontmatter it includes).

---

### Pitfall 8: RSS Feed Breaking Existing Subscribers

**What goes wrong:** WordPress generates RSS at `/feed/` (and sometimes `/rss/`, `/atom/`). Astro with `@astrojs/rss` generates at `/rss.xml`. Existing RSS subscribers (and any services aggregating the feed) get a 404 for the old feed URL.

**Why it happens:** Nobody thinks about RSS subscribers during migration because they're invisible -- there's no subscriber list to export.

**Prevention:**
1. Add redirect in `_redirects`: `/feed/ /rss.xml 301`
2. Also redirect `/feed /rss.xml 301` (without trailing slash)
3. Ensure the new RSS feed includes the same content structure (title, description, full content vs. excerpt) as the old one
4. Verify feed validity with a feed validator after deployment

**Detection:** Test `/feed/` after deployment -- it must redirect to the new RSS feed URL.

**Phase relevance:** Deployment phase (redirects) and theme setup phase (RSS configuration).

**Confidence:** HIGH -- standard WordPress migration issue. Simple to fix but easy to forget.

---

### Pitfall 9: Category/Tag Pages Missing or Misrouted

**What goes wrong:** WordPress generates category archive pages at `/category/slug/`. If Astro doesn't have matching routes, all category page URLs return 404. With 10 categories in use, this means 10 broken URLs plus any inbound links to them.

**Why it happens:** Astro's file-based routing requires explicit creation of category pages. The Ovidius theme may include category page support but the URL structure might not match WordPress's `/category/slug/` pattern.

**Prevention:**
1. Check Ovidius theme's category page routing and compare to WordPress URLs
2. Create dynamic routes at `src/pages/category/[slug].astro` if the theme doesn't include them
3. If the theme uses a different URL pattern (e.g., `/tags/slug`), add redirects from old WordPress category URLs
4. Verify all 10 category URLs resolve correctly

**Detection:** Test all 10 category URLs from the live WordPress site against the new Astro site.

**Phase relevance:** Theme setup phase.

**Confidence:** MEDIUM -- depends on how Ovidius handles category routing (needs verification).

---

### Pitfall 10: YouTube Embeds Breaking in Markdown

**What goes wrong:** WordPress renders YouTube URLs as embedded players via oEmbed. In plain markdown, a YouTube URL is just a link -- no embed. Posts with embedded talks/presentations (the 8 video pages) lose their video players entirely.

**Why it happens:** WordPress's oEmbed system converts URLs to iframes automatically. Markdown doesn't have this capability. The exported markdown may contain raw `<iframe>` HTML (which Astro markdown will strip by default) or just bare URLs.

**Prevention:**
1. Use MDX (`.mdx`) instead of markdown (`.md`) for posts with YouTube embeds, allowing component usage
2. Install `astro-embed` for lightweight, performant YouTube embeds
3. Alternatively, use raw HTML `<iframe>` tags in markdown (Astro does allow HTML in markdown, but verify this works with the Ovidius theme)
4. For the 8 video pages specifically, create a dedicated content collection with a video URL field in the schema

**Detection:** Build the site and visually check every post that should contain a video embed.

**Phase relevance:** Content migration phase (determining embed strategy) and theme setup phase (installing/configuring embed components).

**Confidence:** HIGH -- documented across Astro community. The project explicitly mentions 8 video pages and YouTube embeds.

---

## Minor Pitfalls

### Pitfall 11: Sitemap Missing Site URL Configuration

**What goes wrong:** Astro's `@astrojs/sitemap` integration requires the `site` property in `astro.config.mjs`. Without it, sitemap generation fails silently or produces invalid URLs with `localhost` as the domain.

**Prevention:** Set `site: 'https://joost.blog'` in `astro.config.mjs` before first build. Verify sitemap output contains correct absolute URLs.

**Phase relevance:** Theme setup phase.

**Confidence:** HIGH -- documented in Astro official docs.

---

### Pitfall 12: OG Image Generation Failing at Build Time

**What goes wrong:** OpenGraph image generation tools (like Satori + Sharp) work in development but fail during Cloudflare Pages build. Images referenced in OG generation aren't available during the build phase (they're served by a dev server locally but not during CI builds).

**Prevention:**
1. Use pre-generated OG images stored as static assets rather than build-time generation on first pass
2. If using dynamic generation, test the full build pipeline in CI before relying on it
3. Consider generating OG images as a separate build step

**Phase relevance:** SEO setup phase.

**Confidence:** MEDIUM -- depends on the OG image strategy chosen.

---

### Pitfall 13: `_redirects` File Placed in Wrong Directory

**What goes wrong:** The `_redirects` file for Cloudflare Pages must end up in the build output directory (`dist/`). If placed in `src/` or the project root, Cloudflare never sees it and no redirects work. All the 301 redirects you carefully planned silently do nothing.

**Prevention:**
1. Place `_redirects` in the `public/` directory -- Astro copies `public/` contents to `dist/` during build
2. After build, verify `dist/_redirects` exists and contains the expected rules
3. After deployment, test at least one redirect to confirm Cloudflare is processing the file

**Detection:** `ls dist/_redirects` after build. Test a redirect after deploy.

**Phase relevance:** Deployment phase.

**Confidence:** HIGH -- documented in Cloudflare Pages and Astro docs.

---

### Pitfall 14: Content Collection Images in `public/` Instead of `src/assets/`

**What goes wrong:** Images placed in `public/` are served as-is, bypassing Astro's image optimization pipeline. The site works but serves unoptimized images -- large file sizes, no format conversion (WebP/AVIF), no responsive sizing.

**Prevention:**
1. Place content images in `src/assets/` and reference them using Astro's `image()` schema helper in content collections
2. The Ovidius theme expects this pattern -- follow its conventions
3. Only use `public/` for images that shouldn't be optimized (favicons, external service logos)

**Phase relevance:** Content migration phase (image organization).

**Confidence:** HIGH -- documented in Astro docs and Ovidius theme README.

---

### Pitfall 15: Reserved URL Space Conflicting with Future Content

**What goes wrong:** The project requires reserving `/cms/*` and `/cms-market-share/*` for future data. If not handled, these URLs return 404 now (fine) but may conflict with Astro's routing or Cloudflare's redirect rules when the content is eventually built.

**Prevention:**
1. Don't create empty placeholder pages -- just leave the routes undefined (404 is the correct response for now)
2. Document the reserved paths clearly so future phases don't accidentally use conflicting route patterns
3. If existing WordPress pages at these URLs had traffic, add redirects to a "coming soon" page or the homepage

**Phase relevance:** Deployment phase (redirect planning).

**Confidence:** HIGH -- project-specific requirement from PROJECT.md.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Content export from WordPress | Image references remain as absolute URLs (#3), Yoast metadata not included (#7) | Download images + extract SEO data before decommissioning WP |
| Content cleanup/conversion | Shortcodes, block comments, encoding issues (#5), frontmatter schema mismatches (#6) | Build cleanup script, validate against schema early |
| Theme setup (Ovidius) | Category page URL mismatch (#9), trailing slash config (#2), missing site URL (#11) | Compare WP URLs to theme routing before building content |
| YouTube/video content | Embeds break in plain markdown (#10) | Decide MDX vs HTML iframe approach early, apply consistently |
| SEO implementation | Missing meta descriptions (#7), broken OG images (#12), RSS feed URL change (#8) | Export Yoast data, configure RSS redirect, test OG tags |
| Deployment to Cloudflare | Workers vs Pages confusion (#4), `_redirects` misplacement (#13), trailing slash mismatch (#2) | Static output only, verify `*.pages.dev` URL, test redirects |
| URL preservation | Broken URLs destroying rankings (#1), category pages missing (#9), feed URL change (#8) | Full URL audit before and after migration, comprehensive `_redirects` |

## Sources

- [Astro Migration from WordPress Guide](https://docs.astro.build/en/guides/migrate-to-astro/from-wordpress/)
- [Cloudflare Pages Redirects Documentation](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Cloudflare Pages Astro Deployment Guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Astro Deploy to Cloudflare Docs](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/)
- [Astro Trailing Slash + Cloudflare Issues (GitHub #13165)](https://github.com/withastro/astro/issues/13165)
- [Astro v6 + Cloudflare Static Deploy Bug (GitHub #15650)](https://github.com/withastro/astro/issues/15650)
- [Deploy Astro on Cloudflare Without Hidden Traps (Grant Kennedy)](https://www.gmkennedy.com/blog/deploy-astro-cloudflare-pages/)
- [WordPress to Astro Migration Journey (Kashif Aziz)](https://kashifaziz.me/blog/wordpress-to-astro-migration-journey/)
- [Migrating WordPress to Astro (Charlie Granier)](https://cgranier.com/blog/2024/migrating-wordpress-to-astro/)
- [WordPress to Astro Content Migration (Hompus)](https://blog.hompus.nl/2025/01/27/migrating-from-wordpress-to-astro-how-i-moved-my-blog-content/)
- [Ovidius Theme GitHub Repository](https://github.com/JustGoodUI/ovidius-astro-theme)
- [Astro Embed (YouTube Component)](https://astro-embed.netlify.app/components/youtube/)
- [Giscus Comments System](https://giscus.app/)
- [Astro Frontmatter Validation Error Reference](https://docs.astro.build/en/reference/errors/invalid-content-entry-frontmatter-error/)
