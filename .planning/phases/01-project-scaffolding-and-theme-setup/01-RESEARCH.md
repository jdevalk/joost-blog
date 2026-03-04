# Phase 1: Project Scaffolding and Theme Setup - Research

**Researched:** 2026-03-04
**Domain:** Astro 5 + Ovidius theme + Tailwind CSS 4 + dark mode + branding
**Confidence:** HIGH

## Summary

Phase 1 involves cloning the Ovidius Astro theme, customizing its branding (colors, typography, hero content, navigation), and adding a dark mode toggle. The Ovidius theme (GPL-3.0) is a complete, opinionated Astro 5 starter with Tailwind CSS 4, content collections, MDX, sitemap, RSS, and SEO built in. It provides a `site-config.ts` single-file configuration for hero, navigation, and social links -- making most customization straightforward data changes rather than component rewrites.

The primary non-trivial work is: (1) swapping the Figtree font for Mona Sans, (2) updating the Tailwind color palette from the default teal (#02738f) to Joost's brand palette, (3) building a dark mode toggle (not included in Ovidius), and (4) configuring Shiki dual themes for code blocks. The Ovidius theme already includes all four required social icons (x, github, linkedin, bluesky), hero section with avatar, and navigation -- these are configuration, not code, changes.

**Primary recommendation:** Clone the Ovidius theme as a local project (not npm dependency), swap font/colors/hero/nav via config and CSS, then add dark mode as a new component with an inline script and Tailwind `@custom-variant`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Match the current joost.blog palette: muted teal accent, white backgrounds, gray tones
- Typography: Mona Sans (variable font from GitHub) -- maintain visual continuity with current site
- Generous whitespace throughout -- content-focused, minimal clutter (aligns with Ovidius defaults)
- Code syntax highlighting: GitHub-style (GitHub Light theme in light mode, GitHub Dark in dark mode)
- Medium-detail bio: 3-4 sentences covering Yoast founding, current work at Emilia Capital, and Progress Planner
- Use the current profile photo (cropped-joost-de-valk-profile-picture-web.jpg) -- download and optimize
- Social links in hero: X (Twitter), GitHub, LinkedIn, Bluesky (4 platforms)
- Below the hero: recent blog posts grid with dates and categories (card-based, matching Ovidius pattern)
- Header nav items in order: Blog, About, Plugins, Videos, Contact
- Site title displayed as text: "joost.blog" (no logo), linking to homepage
- Footer: minimal -- copyright notice + social links only
- Dark mode default: respect visitor's OS preference via prefers-color-scheme
- Toggle placement: header/nav bar (sun/moon icon), always accessible
- Preference persisted in localStorage across page loads
- Code blocks adapt: GitHub Light in light mode, GitHub Dark in dark mode

### Claude's Discretion
- Exact dark mode color palette (complement the teal/white/gray light theme)
- Toggle icon design and animation
- Exact spacing and typography scale values
- Mobile nav behavior (hamburger menu, breakpoints)
- Footer layout details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| THEME-01 | Ovidius theme installed and configured as project base | Clone repo, update package.json metadata, install deps, verify `npm run dev` serves site |
| THEME-02 | Homepage hero section with Joost's bio, photo, and social links | Configure `site-config.ts` hero object with title, text, avatar image; social links array with 4 platforms |
| THEME-03 | Navigation menu with About, Plugins, Videos, Contact links | Configure `site-config.ts` primaryLinks array; 5 items (Blog, About, Plugins, Videos, Contact) |
| THEME-04 | Site colors and typography customized to match Joost's brand | Replace Figtree with Mona Sans in CSS; update Tailwind `@theme` color tokens; match joost.blog palette |
| THEME-05 | Dark mode toggle with localStorage preference persistence | Add ThemeToggle component, `@custom-variant` in CSS, inline script in BaseLayout, Shiki dual themes |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.15.3 | Static site framework | Ovidius theme's pinned version; Astro 5 with content collections |
| tailwindcss | ^4.1.16 | Utility-first CSS | Ovidius uses Tailwind 4 with CSS-first config (no tailwind.config.js) |
| @astrojs/mdx | ^4.3.9 | MDX support in content | Included with Ovidius for rich content |
| @astrojs/sitemap | ^3.6.0 | Auto sitemap generation | Included with Ovidius |
| @astrojs/rss | ^4.0.13 | RSS feed generation | Included with Ovidius |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fontsource-variable/mona-sans | latest | Mona Sans variable font | Replace Figtree; import in global.css |
| @tailwindcss/typography | ^0.5.19 | Prose styling for content | Already in Ovidius devDependencies |
| @tailwindcss/vite | ^4.1.16 | Tailwind Vite plugin | Already in Ovidius for build pipeline |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fontsource-variable/mona-sans | Self-hosted woff2 from GitHub repo | Fontsource handles subsetting, formats, and tree-shaking automatically |
| Tailwind @theme colors | CSS custom properties only | Tailwind @theme integrates with utilities (bg-primary, text-primary, etc.) |

**Installation (from clean clone):**
```bash
npm install
npm install @fontsource-variable/mona-sans
npm uninstall @fontsource-variable/figtree
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── assets/
│   ├── icons/          # SVG icons (existing: arrow, social platforms)
│   └── images/         # Profile photo, hero background (optimized by Astro)
├── components/
│   ├── BaseHead.astro  # <head> meta, fonts, OG tags
│   ├── Header.astro    # Site nav + dark mode toggle
│   ├── Footer.astro    # Copyright + social links
│   ├── Hero.astro      # Homepage hero section
│   ├── Icon.astro      # SVG icon renderer
│   ├── SocialLink.astro # Social button wrapper
│   ├── ThemeToggle.astro # NEW: Dark mode toggle button
│   └── PostPreview.astro # Blog post card
├── content/
│   └── blog/           # Markdown/MDX posts (Phase 2)
├── data/
│   └── site-config.ts  # Central config: hero, nav, social, meta
├── layouts/
│   └── BaseLayout.astro # HTML shell, slots for header/content/footer
├── pages/
│   └── index.astro     # Homepage with hero + recent posts
├── styles/
│   └── global.css      # Tailwind imports, @theme tokens, font-face, prose
├── content.config.ts   # Content collection schemas (blog, pages)
└── types.ts            # TypeScript type definitions
```

### Pattern 1: Single-File Site Configuration
**What:** All site-wide data (title, description, hero content, nav links, social links) lives in `src/data/site-config.ts`.
**When to use:** For any data that appears across multiple pages/components.
**Example:**
```typescript
// src/data/site-config.ts
import type { SiteConfig } from '../types';
import avatarImage from '../assets/images/joost-profile.jpg';

const siteConfig: SiteConfig = {
    title: 'joost.blog',
    description: 'Joost de Valk - internet entrepreneur, founder of Yoast, investor at Emilia Capital',
    // logo is omitted -- site title renders as text when no logo provided
    image: {
        src: '/images/og-default.jpg',
        alt: 'joost.blog'
    },
    primaryLinks: [
        { text: 'Blog', href: '/blog' },
        { text: 'About', href: '/about-me' },
        { text: 'Plugins', href: '/plugins' },
        { text: 'Videos', href: '/videos' },
        { text: 'Contact', href: '/contact-me' }
    ],
    secondaryLinks: [], // Minimal footer -- no secondary nav links
    socialLinks: [
        { text: 'X / Twitter', href: 'https://x.com/jabornjdevalk', icon: 'x' },
        { text: 'GitHub', href: 'https://github.com/jdevalk', icon: 'github' },
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/jdevalk/', icon: 'linkedin' },
        { text: 'Bluesky', href: 'https://bsky.app/profile/joost.blog', icon: 'bluesky' }
    ],
    hero: {
        title: 'Hi! I\'m Joost de Valk',
        text: 'Internet entrepreneur from the Netherlands. I founded Yoast, the company behind the most popular WordPress SEO plugin. Now I invest in and build digital companies through Emilia Capital, and I\'m working on Progress Planner.',
        avatar: {
            src: avatarImage,
            alt: 'Joost de Valk'
        }
    },
    postsPerPage: 5
};

export default siteConfig;
```

### Pattern 2: Tailwind 4 CSS-First Configuration
**What:** Tailwind 4 uses `@theme` in CSS instead of a `tailwind.config.js` file. All design tokens (colors, fonts, shadows) are defined in `global.css`.
**When to use:** For all color palette, font, and spacing customizations.
**Example:**
```css
/* src/styles/global.css */
@import "tailwindcss";
@import "@tailwindcss/typography";

/* Dark mode via class toggle (overrides default prefers-color-scheme) */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
    --font-sans: 'Mona Sans Variable', sans-serif;
    --color-primary: #0e373b;
    --color-accent: #96e1e9;
    /* Additional brand tokens */
}
```

### Pattern 3: Dark Mode with Inline Script (No FOUC)
**What:** An `is:inline` script in the `<head>` sets the `.dark` class before first paint, preventing flash of wrong theme.
**When to use:** Always -- this must run before any rendering.
**Example:**
```html
<script is:inline>
  const theme = (() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  })();
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem('theme', theme);
</script>
```

### Anti-Patterns to Avoid
- **Installing Ovidius as an npm package:** It is a template/starter, not a distributable package. Clone the repo and modify in place.
- **Using tailwind.config.js with Tailwind 4:** Tailwind 4 uses CSS-first config with `@theme`. There is no config file.
- **Putting dark mode script in a component without `is:inline`:** Astro will bundle/defer it, causing a flash of light theme on dark-mode users' first paint.
- **Using `@media (prefers-color-scheme: dark)` for code block themes:** Since we have a manual toggle, code block dark styles must use the `.dark` class selector, not the media query.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Variable font loading | Custom @font-face with manual subsetting | `@fontsource-variable/mona-sans` | Handles woff2 generation, subsetting, weight/width axes, italic variants automatically |
| Social icons SVG | Custom SVG sprite sheet | Ovidius built-in Icon component | Already includes x, github, linkedin, bluesky, plus 10 others |
| Content collection schemas | Custom frontmatter parsing | Astro `defineCollection` + Zod | Type-safe, validated at build time, IDE autocompletion |
| RSS feed generation | Custom XML generation | `@astrojs/rss` (already included) | Handles proper XML escaping, date formatting, enclosures |
| Sitemap | Manual sitemap.xml | `@astrojs/sitemap` (already included) | Auto-discovers all routes, handles lastmod |
| Hero section | Custom hero component | Ovidius Hero.astro component | Already handles avatar, title, text, social links with responsive design |
| Mobile hamburger nav | Custom mobile nav | Ovidius Header.astro | Already has animated hamburger toggle with smooth transitions |

**Key insight:** Ovidius provides ~80% of what this phase needs out of the box. The work is configuration changes and adding dark mode -- not building components from scratch.

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC) with Dark Mode
**What goes wrong:** User with dark mode preference sees a white flash before the dark theme applies.
**Why it happens:** Dark mode script runs after page renders because Astro defers/bundles component scripts.
**How to avoid:** Use `<script is:inline>` in the BaseLayout `<head>` section. The `is:inline` directive prevents Astro from processing the script, ensuring it runs synchronously before first paint.
**Warning signs:** White flash on page load when OS dark mode is enabled.

### Pitfall 2: Dark Mode Breaks After Astro View Transitions
**What goes wrong:** After navigating to a new page (via Astro ClientRouter/view transitions), the dark class is removed and the page reverts to light mode.
**Why it happens:** Astro's view transition swaps the `<html>` element, losing the `.dark` class.
**How to avoid:** Add an `astro:after-swap` event listener that re-applies the dark class from localStorage. Also re-attach the toggle button event listener.
**Warning signs:** Dark mode works on first page load but breaks on navigation.

### Pitfall 3: Tailwind 4 darkMode Config Confusion
**What goes wrong:** Developer adds `darkMode: 'selector'` to a tailwind.config.js file.
**Why it happens:** Most dark mode tutorials reference Tailwind 3. Tailwind 4 has no config file.
**How to avoid:** Use `@custom-variant dark (&:where(.dark, .dark *));` in global.css. No tailwind.config.js needed.
**Warning signs:** `dark:` utility classes have no effect.

### Pitfall 4: Code Block Themes Not Switching
**What goes wrong:** Code blocks stay in light theme even when dark mode is active.
**Why it happens:** Shiki dual themes default CSS uses `@media (prefers-color-scheme: dark)` which does not respond to the `.dark` class toggle.
**How to avoid:** Use class-based CSS selector instead of media query:
```css
html.dark .astro-code,
html.dark .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
    font-style: var(--shiki-dark-font-style) !important;
    font-weight: var(--shiki-dark-font-weight) !important;
    text-decoration: var(--shiki-dark-text-decoration) !important;
}
```
**Warning signs:** Toggling dark mode changes page colors but code blocks stay light.

### Pitfall 5: Profile Photo Not Optimized
**What goes wrong:** Large unoptimized JPEG served from public/ directory.
**Why it happens:** Images in `public/` are never processed by Astro's image pipeline.
**How to avoid:** Download the profile photo to `src/assets/images/` and import it in site-config.ts. Astro will optimize it (WebP/AVIF, responsive sizes) automatically.
**Warning signs:** Large image file size in network tab, no responsive srcset.

### Pitfall 6: Figtree Font Remnants
**What goes wrong:** Mixed fonts appear -- some text in Figtree, some in Mona Sans.
**Why it happens:** Ovidius preloads Figtree in BaseHead.astro and imports it in global.css. Both must be updated.
**How to avoid:** (1) Uninstall `@fontsource-variable/figtree`, (2) Install `@fontsource-variable/mona-sans`, (3) Update global.css font import, (4) Update BaseHead.astro font preload link, (5) Update `--font-sans` in `@theme` block.
**Warning signs:** Font fallback to generic sans-serif on some elements.

## Code Examples

### Mona Sans Font Setup
```css
/* src/styles/global.css -- Replace Figtree imports */

/* REMOVE these lines: */
/* @font-face { ... Figtree Variable ... } */

/* ADD Mona Sans import (done via JS import in layout or global CSS): */
/* In the Astro component that imports global.css, add: */
/* import '@fontsource-variable/mona-sans'; */
/* import '@fontsource-variable/mona-sans/wght-italic.css'; */

@theme {
    --font-sans: 'Mona Sans Variable', sans-serif;
}
```

Note: The Ovidius theme imports the font via `@fontsource-variable/figtree` in the CSS file directly. Replace with:
```css
@import "@fontsource-variable/mona-sans";
@import "@fontsource-variable/mona-sans/wght-italic.css";
```

### Dark Mode Color Palette (Claude's Discretion)
```css
/* Recommended dark mode palette complementing the teal/white/gray light theme */
/* These are applied via Tailwind dark: utilities on components */

/* Light mode (default): */
/* Background: white (#ffffff) */
/* Text: slate-700 (#334155) or similar dark gray */
/* Primary accent: teal (#0e373b or similar) */

/* Dark mode: */
/* Background: slate-900 (#0f172a) or gray-900 (#111827) */
/* Text: slate-200 (#e2e8f0) */
/* Primary accent: lighter teal (#96e1e9 or #5eead4) for contrast */
/* Borders: slate-700 (#334155) */
/* Code blocks: handled by Shiki github-dark theme */
```

### Shiki Dual Theme Config
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    site: 'https://joost.blog',
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [mdx(), sitemap()],
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark'
            }
        }
    }
});
```

### ThemeToggle Component
```astro
<!-- src/components/ThemeToggle.astro -->
<button
    id="themeToggle"
    aria-label="Toggle dark mode"
    class="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300"
>
    <!-- Sun icon (visible in dark mode) -->
    <svg class="hidden dark:block h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <!-- Moon icon (visible in light mode) -->
    <svg class="block dark:hidden h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
</button>
```

### View Transitions Dark Mode Re-application
```html
<!-- In BaseLayout.astro <head>, after the initial theme script -->
<script is:inline>
  document.addEventListener('astro:after-swap', () => {
    const theme = localStorage.getItem('theme');
    document.documentElement.classList.toggle('dark', theme === 'dark');

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
    }
  });
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js darkMode: 'class' | @custom-variant dark in CSS | Tailwind 4 (2024-2025) | No JS config file; everything in CSS |
| Astro content collections in src/content/config.ts | content.config.ts at src root + glob loaders | Astro 5 (late 2024) | Loaders are more flexible, file location changed |
| @astrojs/tailwind integration | @tailwindcss/vite plugin | Tailwind 4 + Astro 5 | Direct Vite plugin instead of Astro integration |
| Shiki theme (single) | Shiki themes (dual light/dark) | Astro 4.x stabilized | Built-in dual theme support with CSS variables |
| Manual @font-face declarations | @fontsource-variable packages | 2023+ | Auto subsetting, tree-shaking, woff2 optimization |

**Deprecated/outdated:**
- `@astrojs/tailwind` integration: Replaced by `@tailwindcss/vite` in Tailwind 4 projects
- `tailwind.config.js`/`tailwind.config.mjs`: Tailwind 4 uses CSS-first configuration
- `src/content/config.ts` location: Astro 5 moved to `src/content.config.ts`
- Single Shiki `theme` option: Use `themes` (plural) for dual theme support

## Open Questions

1. **X/Twitter handle for social link**
   - What we know: The about page lists several social profiles but uses different platforms than what's needed
   - What's unclear: Joost's exact X/Twitter handle URL (the about page doesn't list Twitter/X specifically)
   - Recommendation: Check the current joost.blog header/footer for the X link, or ask Joost. The about page social links are: Gravatar, GitHub (jdevalk), LinkedIn (jdevalk), Bluesky (joost.blog), Threads, WordPress, Instagram, Mastodon.

2. **Exact brand color values for customization**
   - What we know: Current site uses CSS custom properties: primary #0e373b (dark teal), secondary #3b696d (muted teal), accent #96e1e9 (cyan), base #ffffff, tertiary #f7f8f8
   - What's unclear: Whether to replicate these exactly or adapt them for the Ovidius framework
   - Recommendation: Use the current site's exact values as the Tailwind theme tokens. The Ovidius default primary (#02738f) is similar teal but should be replaced with Joost's exact palette.

3. **Content collection schema for Phase 2 compatibility**
   - What we know: Ovidius defines blog and pages collections with title, date, excerpt, image, featured flag, SEO fields
   - What's unclear: Whether to extend the schema now for categories (needed in Phase 2/3) or keep Ovidius defaults
   - Recommendation: Add a `categories` field to the blog schema now (as optional array of strings) so Phase 2 content migration doesn't require schema changes. This is low-risk and forward-thinking.

## Sources

### Primary (HIGH confidence)
- [Ovidius GitHub repo](https://github.com/JustGoodUI/ovidius-astro-theme) - package.json (Astro ^5.15.3, Tailwind ^4.1.16), project structure, all component files
- [Ovidius site-config.ts](https://raw.githubusercontent.com/JustGoodUI/ovidius-astro-theme/main/src/data/site-config.ts) - Configuration structure, hero/nav/social types
- [Ovidius types.ts](https://raw.githubusercontent.com/JustGoodUI/ovidius-astro-theme/main/src/types.ts) - SiteConfig, Hero, SocialLink, Link type definitions
- [Ovidius global.css](https://raw.githubusercontent.com/JustGoodUI/ovidius-astro-theme/main/src/styles/global.css) - Tailwind 4 @theme setup, font config, color tokens
- [Ovidius Icon.astro](https://raw.githubusercontent.com/JustGoodUI/ovidius-astro-theme/main/src/components/Icon.astro) - Supported icons: x, github, linkedin, bluesky (all 4 needed)
- [Tailwind CSS v4 dark mode docs](https://tailwindcss.com/docs/dark-mode) - @custom-variant syntax, class-based dark mode, localStorage pattern
- [Astro syntax highlighting docs](https://docs.astro.build/en/guides/syntax-highlighting/) - Shiki dual themes config, CSS variable approach
- [Astro content collections docs](https://docs.astro.build/en/guides/content-collections/) - defineCollection, glob loaders, Zod schemas

### Secondary (MEDIUM confidence)
- [Dark mode with Tailwind and Astro View Transitions](https://namoku.dev/blog/darkmode-tailwind-astro/) - Complete implementation with astro:after-swap handling
- [Dual Shiki themes with class-based dark mode](https://amanhimself.dev/blog/dual-shiki-themes-with-astro/) - CSS selector approach for html.dark
- [joost.blog](https://joost.blog) - Current color palette extracted: primary #0e373b, secondary #3b696d, accent #96e1e9, font Mona Sans
- [@fontsource-variable/mona-sans](https://www.npmjs.com/package/@fontsource-variable/mona-sans) - Installation, axes: wght (200-900), wdth (75%-125%), italic support
- [Mona Sans GitHub repo](https://github.com/github/mona-sans) - SIL Open Font License, variable axes documentation

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Directly read from Ovidius package.json and verified file structure
- Architecture: HIGH - Analyzed all key Ovidius source files (site-config.ts, types.ts, global.css, components)
- Pitfalls: HIGH - Dark mode patterns verified against Tailwind 4 official docs and multiple implementation guides
- Color palette: MEDIUM - Extracted from live joost.blog CSS custom properties; may have additional context-dependent overrides
- Font swap: HIGH - @fontsource-variable/mona-sans package verified on npm; drop-in replacement for @fontsource-variable/figtree

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable stack; Astro 5 and Tailwind 4 are mature releases)
