# Technology Stack

**Project:** joost.blog (WordPress to Astro migration)
**Researched:** 2026-03-04

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro | ^5.15.3 (latest: 5.18.0) | Static site generator | Ovidius theme runs on Astro 5.x. Stay on v5 -- v6 is still in beta and unnecessary for a static blog. The theme pins ^5.15.3 which will pull the latest 5.x. | HIGH |
| Node.js | >=22.x | Runtime | Astro 5.8+ dropped Node 18; Node 20 is fallback but 22 is the recommended LTS for forward compatibility with Astro 6. | HIGH |

### Theme

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Ovidius (JustGoodUI) | latest main | Blog theme base | Single-author blog theme with hero section, Tailwind v4, MDX support, RSS, sitemap, newsletter form, SEO metadata -- matches every requirement. GPL-3.0 licensed. Customize, don't rewrite. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.1.16 | Utility-first CSS | Ovidius already uses Tailwind v4 with `@tailwindcss/vite` (not the deprecated `@astrojs/tailwind`). Follow the theme's approach. | HIGH |
| @tailwindcss/vite | ^4.1.16 | Vite plugin for Tailwind v4 | Replaces the old `@astrojs/tailwind` integration. This is the officially recommended Tailwind v4 integration path for Astro. | HIGH |
| @tailwindcss/typography | ^0.5.19 | Prose styling for markdown content | Already in Ovidius devDependencies. Provides beautiful defaults for rendered markdown (blog posts). | HIGH |
| @fontsource-variable/figtree | ^5.2.10 | Self-hosted font | Ovidius default. Keep it -- Figtree is a clean, modern sans-serif. Swap later if desired. | MEDIUM |

### Content & Markdown

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @astrojs/mdx | ^4.3.9 | MDX support | Enables component usage inside markdown (YouTube embeds, callouts). Already in Ovidius. Write posts as `.md` or `.mdx` -- both work. | HIGH |
| Astro Content Collections (built-in) | v5 Content Layer API | Type-safe content management | Ovidius already defines `blog` and `pages` collections with Zod schemas in `src/content.config.ts`. Schema includes title, publishDate, excerpt, featureImage, SEO metadata, and isFeatured flag. | HIGH |

### SEO & Feeds

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @astrojs/sitemap | ^3.6.0 | XML sitemap generation | Already in Ovidius. Auto-generates sitemap-index.xml and sitemap-0.xml at build time. Configure `site` in astro.config.mjs. | HIGH |
| @astrojs/rss | ^4.0.13 | RSS feed generation | Already in Ovidius. Creates RSS feed endpoint. Supports full post content in feed items. | HIGH |
| Built-in `<head>` meta tags | n/a | SEO meta, OpenGraph, canonical URLs | Ovidius has a SEO schema with title (5-120 chars), description (15-160 chars), image, and pageType. No extra SEO plugin needed -- the theme handles it in its layout components. | HIGH |

### Image Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro `<Image />` (built-in) | n/a | Image optimization | Built into Astro since v3. Auto-infers dimensions (prevents CLS), generates optimized formats, supports responsive `srcset` (since 5.10). Works automatically in Markdown with `![alt](./image.jpg)` syntax for `src/` images. | HIGH |
| sharp | ^0.34.5 | Image processing engine | Astro's default image transformer. Converts, resizes, optimizes images at build time. 4-5x faster than ImageMagick. Auto-installed as Astro peer dependency. | HIGH |

### Comments

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @giscus/react | ^3.1.0 | Comment system | GitHub Discussions-backed comments. Free, no ads, no tracking, no cookies. Perfect for a developer/tech blog audience. Renders client-side only via `client:only="react"` directive. | HIGH |
| @astrojs/react | ^4.4.2 | React integration for Astro | Required to render the Giscus React component. Only used for the comment widget -- no React shipped elsewhere. Adds ~3KB to comment pages. | HIGH |

### OpenGraph Image Generation (optional, phase 2+)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| satori | latest | HTML-to-SVG conversion for OG images | Vercel's library. Converts JSX templates to SVG. Combined with sharp to produce PNG OG images at build time. Well-documented pattern for Astro static sites. | MEDIUM |
| astro-opengraph-images | latest | Astro integration for auto OG images | Wraps satori, auto-generates OG images for every page during `astro build`. Preset renderers for quick start, fully customizable. Alternative to rolling your own. | MEDIUM |

### Deployment & Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Cloudflare Pages | n/a | Static hosting + CDN | Free tier, global CDN, excellent Astro support. No adapter needed for purely static output -- just deploy the `dist/` folder. | HIGH |
| wrangler | ^4.x (latest: 4.70.0) | Cloudflare CLI | Dev dependency for local preview (`wrangler pages dev ./dist`) and deployment (`wrangler pages deploy ./dist`). Alternative: connect GitHub repo for automatic deploys via Cloudflare dashboard. | HIGH |

### Content Migration (one-time tooling)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom fetch script (Node.js) | n/a | Download content via `.md` endpoints | The existing WordPress site exposes `.md` endpoints for every URL. Write a simple Node script to fetch all 66 posts + pages as markdown. This is MUCH cleaner than XML export because it already outputs formatted markdown with frontmatter. | HIGH |
| wordpress-export-to-markdown | ^3.x | Fallback: XML-to-markdown conversion | Only if `.md` endpoints are missing data (images, metadata). Converts WordPress XML export to markdown files with frontmatter. Has CLI wizard. | MEDIUM |
| Custom image downloader | n/a | Download and relocate images | Fetch all images referenced in posts, save to `src/content/blog/[post]/` or `src/assets/images/`, update markdown references. Simple Node script with `fetch` + `fs`. | HIGH |

### Developer Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| prettier | ^3.6.2 | Code formatting | Already in Ovidius devDependencies. | HIGH |
| prettier-plugin-astro | ^0.14.1 | Astro file formatting | Already in Ovidius devDependencies. | HIGH |
| prettier-plugin-tailwindcss | ^0.6.14 | Tailwind class sorting | Already in Ovidius devDependencies. Keeps Tailwind classes in canonical order. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Astro 5.x | Astro 6 (beta) | v6 is still in beta. No features needed from v6 for a static blog. Upgrade later when stable. |
| Framework | Astro | Hugo, Eleventy | User chose Astro. Also, Ovidius is Astro-specific. Astro's island architecture is ideal for adding interactive components (comments) to otherwise static pages. |
| Styling | Tailwind v4 via @tailwindcss/vite | @astrojs/tailwind integration | Deprecated for Tailwind v4. Ovidius already uses the vite plugin approach. |
| Comments | Giscus (@giscus/react) | Disqus | Disqus has ads, tracking, heavy JS bundle. Giscus is free, lightweight, privacy-respecting, developer-friendly. |
| Comments | Giscus (@giscus/react) | Utterances | Utterances uses GitHub Issues (messy). Giscus uses GitHub Discussions (purpose-built for conversations). Giscus also supports reactions. |
| Comments | Giscus React component | Giscus vanilla `<script>` tag | React component gives type-safe props, easier theming control, and cleaner Astro integration. The vanilla script works but is harder to configure declaratively. |
| SEO | Built-in theme SEO | astro-seo package | Ovidius already has SEO meta handling built into its layout. Adding astro-seo would duplicate functionality. Only add if the theme's approach proves insufficient. |
| Image optimization | Astro built-in `<Image />` | @astrojs/image (deprecated) | @astrojs/image was replaced by built-in image optimization in Astro 3.0. The old package is deprecated. |
| OG images | satori + sharp | @vercel/og | @vercel/og is designed for Vercel edge functions, not static builds. Satori + sharp is the proven Astro static-site pattern. |
| Hosting | Cloudflare Pages | Vercel, Netlify | User chose Cloudflare. Also: free tier is generous, no adapter needed for static output, global CDN, excellent performance. |
| Content migration | Custom .md endpoint fetcher | wordpress-export-to-markdown | The .md endpoint approach produces cleaner output since the WordPress site already formats content as markdown. XML export requires post-processing (shortcode cleanup, HTML-to-markdown conversion). |
| Font | Figtree (self-hosted via @fontsource) | Google Fonts CDN | Self-hosted = no external requests, better privacy, faster load. @fontsource bundles only needed weights/styles. |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| @astrojs/tailwind | Deprecated for Tailwind v4. Use @tailwindcss/vite instead. |
| @astrojs/image | Deprecated since Astro 3.0. Use built-in `<Image />` component. |
| @astrojs/cloudflare adapter | Not needed for static sites. Only required for server-side rendering (SSR). Adding it would switch output to `server` mode and complicate deployment. |
| Disqus | Ads, tracking, heavy JS, poor privacy. |
| Next.js, Gatsby | Wrong tool. Astro is purpose-built for content sites. React meta-frameworks add unnecessary client-side JS. |
| WordPress headless CMS | Adds hosting/maintenance complexity. The goal is to escape WordPress, not keep it running as a backend. |
| Squoosh (image service) | Slower than sharp, less format support. Sharp is the default and recommended image service. |

## Project Configuration

### astro.config.mjs (expected shape)

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://joost.blog',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### wrangler.jsonc (Cloudflare Pages)

```jsonc
{
  "name": "joost-blog",
  "compatibility_date": "2026-03-04",
  "pages_build_output_dir": "./dist"
}
```

## Installation

```bash
# Clone the Ovidius theme as starting point
# (or use degit to get a clean copy without git history)
npx degit JustGoodUI/ovidius-astro-theme joost-blog

# Install core dependencies (most already in Ovidius)
npm install

# Add Giscus comment system + React integration
npm install @giscus/react @astrojs/react

# Add Cloudflare deployment tooling
npm install -D wrangler

# OG image generation (optional, add when ready)
# npm install satori satori-html sharp
# -- OR --
# npm install astro-opengraph-images
```

## Node.js Version

```bash
# .nvmrc or .node-version
22
```

Use Node.js 22.x (current LTS). Astro 5.8+ dropped Node 18 support. Node 22 is recommended for forward compatibility with Astro 6.

## URL Preservation Strategy

For preserving all existing WordPress URLs on Cloudflare Pages:

1. **Blog posts**: Astro file-based routing. Create files at `src/content/blog/` with matching slugs. Route pages at `src/pages/blog/[slug].astro`.
2. **Static pages**: Create matching `.astro` files in `src/pages/` (e.g., `src/pages/about.astro`).
3. **Redirects**: Place a `_redirects` file in `public/` for any URL changes. Cloudflare Pages supports up to 2,000 static + 100 dynamic redirects. Format: `/old-path /new-path 301`.
4. **Reserved paths**: `/cms/*` and `/cms-market-share/*` can be handled with placeholder pages or explicit 404s.

## Sources

- [Ovidius theme repository](https://github.com/JustGoodUI/ovidius-astro-theme) - theme dependencies, structure, configuration
- [Astro official docs - Deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) - no adapter needed for static, wrangler setup
- [Astro official docs - Images](https://docs.astro.build/en/guides/images/) - built-in Image component, sharp, responsive images
- [Astro official docs - Content Collections](https://docs.astro.build/en/guides/content-collections/) - v5 Content Layer API
- [Astro official docs - WordPress migration](https://docs.astro.build/en/guides/migrate-to-astro/from-wordpress/) - migration approaches
- [Tailwind CSS - Astro installation guide](https://tailwindcss.com/docs/installation/framework-guides/astro) - @tailwindcss/vite setup
- [Giscus integration with Astro](https://ericjinks.com/blog/2025/giscus/) - @giscus/react with client:only directive
- [Giscus component library](https://github.com/giscus/giscus-component) - @giscus/react v3.1.0
- [Cloudflare Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/) - _redirects file format, limits
- [Astro GitHub releases](https://github.com/withastro/astro/releases) - latest v5.18.0
- [wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown) - v3 fallback migration tool
- [Satori OG image generation for Astro](https://dietcode.io/p/astro-og/) - build-time OG image pattern
