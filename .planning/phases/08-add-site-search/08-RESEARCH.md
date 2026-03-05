# Phase 8: Add Site Search - Research

**Researched:** 2026-03-05
**Domain:** Static site search (client-side, build-time indexed)
**Confidence:** HIGH

## Summary

Pagefind is the clear standard for adding search to Astro static sites. It is built by CloudCannon in Rust, generates a search index at build time from your HTML output, and ships a tiny WASM-powered client that loads index chunks on demand. For a site with ~80 pages (66 posts + 8 videos + static pages), the total index will be well under 100KB and search will feel instant.

The `astro-pagefind` integration (v1.8.5, 490 GitHub stars) wraps Pagefind with an Astro integration that handles build-time indexing automatically and provides a ready-to-use Search component with view transitions support. This is the standard approach used across the Astro ecosystem -- Starlight (Astro's official docs framework) uses Pagefind as its built-in search.

**Primary recommendation:** Use `astro-pagefind` with Pagefind's default UI, styled to match the Ovidius theme, placed in a search page or modal triggered from the header navigation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pagefind | 1.4.0 | Build-time indexing + WASM search runtime | SOTA for static sites, used by Starlight, zero infrastructure |
| astro-pagefind | 1.8.5 | Astro integration + Search component | Handles build pipeline, dev mode support, view transitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | Pagefind ships its own UI, CSS, and JS |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pagefind | Fuse.js | Fuzzy search but requires loading ALL content into memory; no build-time indexing; poor for 60+ posts |
| Pagefind | FlexSearch | Fast but requires manual index generation; no built-in UI; much more custom code |
| Pagefind | Lunr | Outdated, unmaintained, full index must be loaded upfront |
| astro-pagefind | Manual Pagefind setup | More control but requires manual build script chaining, dev mode file copying |

**Installation:**
```bash
npm install astro-pagefind
```

## Architecture Patterns

### Integration Setup

Add to `astro.config.mjs`:
```typescript
import pagefind from "astro-pagefind";

export default defineConfig({
  // ... existing config
  integrations: [mdx(), sitemap(), pagefind(), noIndexOnStaging()],
});
```

### Content Indexing Strategy

Mark the main content area with `data-pagefind-body` on page templates. This ensures only article content is indexed (not headers, footers, navs, sidebars).

```astro
<!-- In [slug].astro and other page templates -->
<main data-pagefind-body>
  <article>
    <h1>{title}</h1>
    <div>{content}</div>
  </article>
</main>
```

Elements to exclude from indexing with `data-pagefind-ignore`:
- Navigation menus
- Footer content
- Comment sections (Giscus)
- Related posts sections
- Subscribe forms

### Search UI Placement Options

**Recommended: Dedicated search page + header trigger**

For a personal blog with ~80 pages, the best UX pattern is:
1. A search icon/button in the header navigation
2. Clicking it navigates to `/search/` page with inline search UI
3. Search results appear immediately as user types (300ms debounce)

This avoids modal complexity, works perfectly with view transitions, and is the simplest to implement and maintain.

Alternative: A modal dialog (like Starlight uses) is better for documentation sites where search is a frequent action. For a blog, a dedicated page is simpler and more appropriate.

### Recommended Project Structure
```
src/
  pages/
    search.astro          # Dedicated search page with Pagefind UI
  components/
    SearchTrigger.astro   # Search icon button for header
```

### Pattern 1: Search Page with astro-pagefind
**What:** Dedicated search page using the astro-pagefind Search component
**When to use:** Blog sites where search is a secondary navigation action

```astro
---
// src/pages/search.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Search from 'astro-pagefind/components/Search';
---
<BaseLayout title="Search" description="Search joost.blog">
  <main class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Search</h1>
    <div id="search" data-pagefind-ignore="all">
      <Search id="search" className="pagefind-ui"
        uiOptions={{
          showSubResults: true,
          showImages: true,
          pageSize: 10,
          excerptLength: 30
        }}
      />
    </div>
  </main>
</BaseLayout>
```

### Pattern 2: Header Search Trigger
**What:** Search icon in the header that links to the search page
**When to use:** Always -- gives users a discoverable entry point

```astro
---
// src/components/SearchTrigger.astro
---
<a href="/search/" class="inline-flex items-center justify-center w-10 h-10" aria-label="Search">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
</a>
```

### Pattern 3: Pagefind CSS Theming for Dark Mode
**What:** Override Pagefind CSS variables to match Ovidius theme
**When to use:** Always -- Pagefind default theme will clash with site

```css
/* Light mode */
:root {
  --pagefind-ui-primary: var(--color-primary);
  --pagefind-ui-text: #334155;       /* slate-700 */
  --pagefind-ui-background: #ffffff;
  --pagefind-ui-border: #e2e8f0;     /* slate-200 */
  --pagefind-ui-tag: #f1f5f9;        /* slate-100 */
}

/* Dark mode */
.dark {
  --pagefind-ui-primary: var(--color-accent);
  --pagefind-ui-text: #e2e8f0;       /* slate-200 */
  --pagefind-ui-background: #1e293b; /* slate-800 */
  --pagefind-ui-border: #334155;     /* slate-700 */
  --pagefind-ui-tag: #334155;        /* slate-700 */
}
```

### Pattern 4: Content Metadata for Better Results
**What:** Add `data-pagefind-meta` attributes for rich search results
**When to use:** On blog post and video page templates

```astro
<!-- Blog post template -->
<main data-pagefind-body>
  <article>
    <h1 data-pagefind-meta="title">{title}</h1>
    <time data-pagefind-meta="date" datetime={date.toISOString()}>
      <FormattedDate date={date} />
    </time>
    <span data-pagefind-filter="category">{category}</span>
    <div class="prose">{content}</div>
  </article>
</main>
```

### Anti-Patterns to Avoid
- **Indexing the full page:** Without `data-pagefind-body`, Pagefind indexes nav, footer, comments, schema JSON-LD -- producing noisy results
- **Loading search UI on every page:** Only load Pagefind JS/CSS on the search page
- **Custom search from scratch:** Pagefind's default UI handles debouncing, pagination, highlighting, excerpts, accessibility -- do not rebuild these
- **Using `is:inline` for Pagefind scripts:** The astro-pagefind integration handles script loading; do not manually add Pagefind script tags

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search indexing | Custom JSON index at build time | Pagefind CLI (via astro-pagefind) | Handles word segmentation, stemming, compression, chunking |
| Search UI | Custom input + results component | Pagefind Default UI | Handles debouncing, highlighting, excerpts, pagination, a11y, i18n |
| Result excerpts | Custom text extraction | Pagefind excerpt generation | Handles context windows, highlighting, smart truncation |
| Fuzzy matching | Custom string similarity | Pagefind's built-in tolerance | WASM-optimized, handles typos, partial matches |
| Index chunking | Manual chunk splitting | Pagefind's automatic chunking | Only loads relevant index chunks on demand, minimizes bandwidth |
| Dark mode for search | Custom theme switcher for search | Pagefind CSS variables | Just map to existing CSS custom properties |

**Key insight:** Pagefind was purpose-built for this exact problem. Every custom solution will be worse in at least 3 dimensions: index size, search quality, and accessibility.

## Common Pitfalls

### Pitfall 1: Forgetting data-pagefind-body
**What goes wrong:** Pagefind indexes entire pages including nav, footer, JSON-LD scripts, producing irrelevant search results
**Why it happens:** By default, Pagefind indexes everything in `<body>`
**How to avoid:** Add `data-pagefind-body` to the `<main>` content wrapper on ALL page templates (blog posts, pages, videos, category archives, blog listing)
**Warning signs:** Search results show navigation text or schema markup in excerpts

### Pitfall 2: Search Page Indexing Itself
**What goes wrong:** The search page itself appears in search results
**Why it happens:** The search page has HTML content that Pagefind indexes
**How to avoid:** Wrap the search container in `data-pagefind-ignore="all"` and do NOT add `data-pagefind-body` to the search page template

### Pitfall 3: View Transitions Breaking Search State
**What goes wrong:** Navigating away and back to search page loses search query and results
**Why it happens:** Astro view transitions swap page content
**How to avoid:** The `astro-pagefind` integration handles this natively -- it re-initializes on `astro:after-swap`. Use the integration, not manual setup.

### Pitfall 4: Build Order Issues
**What goes wrong:** Pagefind index is empty or stale
**Why it happens:** Pagefind must run AFTER Astro builds HTML files
**How to avoid:** The `astro-pagefind` integration handles build ordering automatically. If using manual setup, chain: `astro build && pagefind --site dist`

### Pitfall 5: Dark Mode Mismatch
**What goes wrong:** Pagefind UI shows light theme in dark mode or vice versa
**Why it happens:** Pagefind uses its own CSS variables that don't inherit from your theme
**How to avoid:** Set Pagefind CSS variables in both `:root` and `.dark` selectors to match your theme

### Pitfall 6: Missing Category Filters
**What goes wrong:** Users cannot filter search results by category
**Why it happens:** Forgot to add `data-pagefind-filter="category"` on category elements
**How to avoid:** Add filter attributes to category labels in blog post templates

## Code Examples

### Complete Search Page Implementation
```astro
---
// src/pages/search.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Search from 'astro-pagefind/components/Search';
---
<BaseLayout title="Search" description="Search all posts and pages on joost.blog">
  <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12 grow">
    <h1 class="text-3xl font-bold mb-8 dark:text-slate-100">Search</h1>
    <div data-pagefind-ignore="all">
      <Search id="search" className="pagefind-ui"
        uiOptions={{
          showSubResults: true,
          showImages: true,
          pageSize: 10,
          resetStyles: true
        }}
      />
    </div>
  </main>
</BaseLayout>

<style is:global>
  :root {
    --pagefind-ui-scale: 1;
    --pagefind-ui-primary: #3b82f6;
    --pagefind-ui-text: #334155;
    --pagefind-ui-background: #ffffff;
    --pagefind-ui-border: #e2e8f0;
    --pagefind-ui-tag: #f1f5f9;
    --pagefind-ui-border-width: 1px;
    --pagefind-ui-border-radius: 8px;
    --pagefind-ui-image-border-radius: 8px;
    --pagefind-ui-image-box-ratio: 3 / 2;
    --pagefind-ui-font: inherit;
  }
  .dark {
    --pagefind-ui-primary: #60a5fa;
    --pagefind-ui-text: #e2e8f0;
    --pagefind-ui-background: #1e293b;
    --pagefind-ui-border: #334155;
    --pagefind-ui-tag: #334155;
  }
</style>
```

### Blog Post Template with Indexing Attributes
```astro
<!-- In [slug].astro, wrap main content -->
<main data-pagefind-body>
  <article>
    <h1>{title}</h1>
    {categories.map(cat => (
      <span data-pagefind-filter="category">{cat}</span>
    ))}
    <div class="prose" set:html={content} />
  </article>
</main>

<!-- These sections should NOT be indexed -->
<aside data-pagefind-ignore="all">
  <h2>Related Posts</h2>
  <!-- related posts -->
</aside>
<div data-pagefind-ignore="all">
  <Giscus />
</div>
```

### Header Integration
```astro
<!-- Add to Header.astro, in the desktop nav area -->
<a href="/search/"
  class="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-accent transition-colors"
  aria-label="Search">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
</a>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lunr.js (load full index upfront) | Pagefind (chunked WASM index) | 2022-2023 | 10-100x smaller initial load |
| Fuse.js (load all content as JSON) | Pagefind (indexed HTML at build) | 2022-2023 | No need to generate/maintain JSON index |
| Algolia DocSearch (external service) | Pagefind (self-hosted, zero cost) | 2022-2023 | No API keys, no external dependency |
| Manual build script chaining | astro-pagefind integration | 2023-2024 | Automatic build ordering, dev mode support |

**Deprecated/outdated:**
- **Lunr.js**: Unmaintained, requires loading entire index upfront
- **elasticlunr**: Fork of Lunr, also unmaintained
- **Manual Pagefind CLI in package.json scripts**: Superseded by astro-pagefind integration

## Open Questions

1. **Category filter UI placement**
   - What we know: Pagefind supports `data-pagefind-filter` for category filtering
   - What's unclear: Whether category filters should show in search results or if simple text search is sufficient for ~80 pages
   - Recommendation: Start without filter UI; add if users request it. The category archive pages already serve this purpose.

2. **Search trigger placement in mobile nav**
   - What we know: Desktop header has space for a search icon next to theme toggle
   - What's unclear: Best placement in the mobile hamburger menu vs. always-visible
   - Recommendation: Place search icon before the theme toggle (visible on both mobile and desktop), not inside the hamburger menu

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (no test framework in project) |
| Config file | none |
| Quick run command | `npm run build && npm run preview` |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-V2-04 | Full-text search works on built site | manual | `npm run build && npm run preview` then search | N/A |
| SEARCH-01 | Search page exists at /search/ | smoke | `npm run build && ls dist/search/index.html` | N/A |
| SEARCH-02 | Pagefind index is generated | smoke | `npm run build && ls dist/pagefind/` | N/A |
| SEARCH-03 | Blog posts are indexed | manual | Search for a known post title | N/A |
| SEARCH-04 | Search results link to correct URLs | manual | Click a search result | N/A |
| SEARCH-05 | Dark mode styling works | manual | Toggle dark mode on search page | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (verify build succeeds)
- **Per wave merge:** Full build + preview + manual search test
- **Phase gate:** Full build succeeds, search page renders, Pagefind index exists

### Wave 0 Gaps
- None -- astro-pagefind handles all infrastructure. No test framework setup needed.

## Sources

### Primary (HIGH confidence)
- [Pagefind official site](https://pagefind.app/) - v1.4.0, indexing docs, UI configuration, data attributes
- [astro-pagefind GitHub](https://github.com/shishkin/astro-pagefind) - v1.8.5, installation, Search component API
- [Pagefind UI configuration](https://pagefind.app/docs/ui/) - All UI options, CSS variables, customization

### Secondary (MEDIUM confidence)
- [Syntackle Pagefind + Astro guide](https://syntackle.com/blog/pagefind-search-in-astro-site/) - Implementation patterns, gotchas
- [Starlight Search component](https://github.com/withastro/starlight/blob/main/packages/starlight/components/Search.astro) - Modal pattern reference
- [Astro February 2026 blog](https://astro.build/blog/whats-new-february-2026/) - Pagefind Proxima mention

### Tertiary (LOW confidence)
- [WMTips comparisons](https://www.wmtips.com/technologies/compare/fuse.js-vs-pagefind/) - Popularity metrics (Fuse.js vs Pagefind)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pagefind is the established standard for Astro static search, used by Starlight
- Architecture: HIGH - astro-pagefind integration is mature (v1.8.5), well-documented, 490 stars
- Pitfalls: HIGH - Well-documented issues from multiple community guides and official docs

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable ecosystem, Pagefind v1.x is mature)
