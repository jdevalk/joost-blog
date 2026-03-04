# Phase 5: Engagement Features - Research

**Researched:** 2026-03-04
**Domain:** Giscus comment system + Astro view transitions
**Confidence:** HIGH

## Summary

This phase adds two features: Giscus comments on blog posts and verification of existing view transitions. The site already has `ClientRouter` imported in `BaseLayout.astro` with a working `astro:after-swap` dark mode handler, so view transitions are already active. The work is primarily about adding a Giscus component, syncing its theme with dark mode, handling iframe reinitialization during view transitions, and verifying transitions work smoothly across all page types.

Giscus is a well-established, zero-backend comment system backed by GitHub Discussions. It loads as a client-side iframe and requires no npm dependencies. The main complexity lies in three areas: (1) lazy-loading the iframe for performance, (2) syncing the Giscus theme with the site's dark mode toggle, and (3) ensuring the iframe reinitializes correctly when Astro's view transitions navigate between blog posts.

**Primary recommendation:** Create a standalone `Giscus.astro` component with an inline script that handles lazy loading via IntersectionObserver, dark mode sync via postMessage API, and view transition reinitialization via `astro:page-load`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use the same GitHub repository that hosts the joost.blog site code
- GitHub Discussions must be enabled on the repo before implementation
- Blog posts only -- no comments on pages or videos
- Order at bottom of blog post: Content > Share links > Comments > Related posts
- Comments section sits between the share links and the related posts block
- Integration point: `[slug].astro` blog post rendering branch
- Giscus iframe lazy-loads when the comment section scrolls into view
- Default crossfade transition (Astro's built-in)
- `ClientRouter` is already imported in BaseLayout.astro -- verify it works correctly
- `astro:after-swap` handler for dark mode already in place
- Ensure Giscus iframe survives/reinitializes on view transitions

### Claude's Discretion
- Discussion category mapping strategy (pathname vs title vs number)
- Dark mode sync approach for Giscus (postMessage API vs page-load detection)
- Giscus theme selection (matching the site's slate palette)
- Lazy-load implementation method (IntersectionObserver, loading="lazy", or Astro island)
- Any view transition refinements needed for interactive components

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENG-01 | Giscus comment system integrated on blog posts | Giscus component creation, placement in [slug].astro, lazy loading, dark mode sync, view transition handling |
| ENG-02 | View transitions between pages for smooth navigation | ClientRouter already active in BaseLayout.astro; verify transitions work on all page types including pages with YouTube embeds |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| giscus | client.js (CDN) | Comment system via GitHub Discussions | No npm install needed; loaded as script tag from giscus.app |
| astro:transitions | Built-in (Astro 5.x) | View transitions via ClientRouter | Already imported in BaseLayout.astro |

### Supporting
No additional dependencies needed. Giscus loads from CDN. View transitions are built into Astro.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CDN script | @giscus/react | Adds npm dependency + React runtime; unnecessary for static Astro component |
| IntersectionObserver | data-loading="lazy" | Giscus supports native lazy loading attribute, but IO gives more control over placeholder/loading states |

**Installation:**
```bash
# No installation needed -- Giscus loads from CDN, view transitions are built-in
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── Giscus.astro          # NEW: Comment section component
├── layouts/
│   └── BaseLayout.astro      # EXISTING: Already has ClientRouter + dark mode handler
├── pages/
│   └── [slug].astro          # MODIFY: Add Giscus between share links and related posts
```

### Pattern 1: Giscus Component with Inline Script
**What:** A self-contained Astro component that renders a container div and uses an inline script to inject the Giscus script tag, handle lazy loading, dark mode sync, and view transition reinitialization.
**When to use:** For the Giscus comment section on blog posts.
**Example:**
```astro
<!-- src/components/Giscus.astro -->
<section id="comments" class="mx-auto max-w-3xl mt-8">
  <h2 class="after:bg-primary mb-8 text-sm tracking-wider text-slate-900 dark:text-slate-100 uppercase after:mt-4 after:block after:h-px after:w-16 after:content-[''] sm:mb-12">
    Comments
  </h2>
  <div class="giscus"></div>
</section>

<script is:inline>
  function getGiscusTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  function loadGiscus() {
    const container = document.querySelector('.giscus');
    if (!container || container.querySelector('iframe')) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', '[OWNER/REPO]');
    script.setAttribute('data-repo-id', '[REPO-ID]');
    script.setAttribute('data-category', '[CATEGORY]');
    script.setAttribute('data-category-id', '[CATEGORY-ID]');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', getGiscusTheme());
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;
    container.appendChild(script);
  }

  function updateGiscusTheme() {
    const iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) return;
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: getGiscusTheme() } } },
      'https://giscus.app'
    );
  }

  // Lazy load with IntersectionObserver
  const target = document.getElementById('comments');
  if (target) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadGiscus();
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(target);
  }

  // Dark mode sync: watch for class changes on <html>
  const mo = new MutationObserver(updateGiscusTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // View transition reinitialization
  document.addEventListener('astro:page-load', () => {
    const container = document.querySelector('.giscus');
    if (container) {
      container.innerHTML = '';
      const t = document.getElementById('comments');
      if (t) {
        const obs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            loadGiscus();
            obs.disconnect();
          }
        }, { rootMargin: '200px' });
        obs.observe(t);
      }
    }
  });
</script>
```
**Source:** Pattern synthesized from [maxpou.fr Giscus+Astro guide](https://www.maxpou.fr/blog/giscus-with-astro/), [Giscus Advanced Usage](https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md), and [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/)

### Pattern 2: Placement in [slug].astro
**What:** Insert Giscus component in the blog branch only, between share links and related posts.
**When to use:** The `[slug].astro` file uses an `isBlog` flag to branch rendering.
**Example:**
```astro
{/* After the share links div, before related posts */}
{isBlog && <Giscus />}
```
The current structure in `[slug].astro` blog branch (lines 124-155) is:
1. `<div class="prose ...">` -- Content
2. `<div class="flex flex-wrap mt-8 ...">` -- Share links
3. Related posts section (lines 157-186)
4. Subscribe section (line 188)

Giscus goes between share links (end of `max-w-3xl` div around line 155) and the related posts section.

### Anti-Patterns to Avoid
- **Declarative script tag in Astro template:** Using `<script src="..." data-repo="...">` directly in the template causes issues with view transitions because the script only loads once. Always inject the script dynamically via JavaScript.
- **Using `transition:persist` on the Giscus container:** Astro explicitly documents that "the reload of iframes cannot be avoided during view transitions even when using `transition:persist`." Don't fight this -- just reinitialize.
- **Forgetting `is:inline` on the script:** Without `is:inline`, Astro bundles and deduplicates scripts, which breaks the reinitialization pattern for view transitions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Comment system | Custom GitHub API integration | Giscus CDN script | Handles auth, markdown rendering, reactions, threading |
| Theme sync | Manual iframe CSS injection | Giscus postMessage API | Official API with `setConfig({ theme })` |
| View transitions | Custom page transition animations | Astro built-in ClientRouter | Already imported and working in BaseLayout.astro |

**Key insight:** Giscus is entirely self-contained. The only custom code needed is the glue: lazy loading, dark mode sync via postMessage, and view transition reinitialization.

## Common Pitfalls

### Pitfall 1: Giscus Shows Wrong Post's Comments After Navigation
**What goes wrong:** When navigating between blog posts with view transitions, the Giscus iframe keeps showing the previous post's comments because the iframe persists across navigation.
**Why it happens:** `ClientRouter` reuses DOM where possible; the Giscus iframe from the previous page stays alive.
**How to avoid:** Clear the `.giscus` container innerHTML on `astro:page-load` event and reinject the script. Use `data-mapping="pathname"` so each page loads the correct discussion.
**Warning signs:** Comments from a different post appearing, or no comments loading on the second page visited.

### Pitfall 2: Dark Mode Toggle Doesn't Update Giscus Theme
**What goes wrong:** User toggles dark mode but the Giscus iframe stays in the previous theme.
**Why it happens:** Giscus iframe is sandboxed; it doesn't see parent page CSS changes.
**How to avoid:** Use MutationObserver on `document.documentElement` class attribute changes, then send postMessage to the iframe with `setConfig({ theme })`.
**Warning signs:** Light Giscus iframe on dark page background, or vice versa.

### Pitfall 3: GitHub Discussions Not Enabled
**What goes wrong:** Giscus silently fails or shows an error because the repository doesn't have Discussions enabled.
**Why it happens:** GitHub Discussions is opt-in per repository.
**How to avoid:** Enable Discussions in the repository settings before deploying. Create a dedicated category (e.g., "Blog Comments" or "Announcements").
**Warning signs:** Empty comment section with no iframe loading.

### Pitfall 4: Giscus Config IDs Not Set
**What goes wrong:** The component uses placeholder values for `data-repo-id` and `data-category-id`.
**Why it happens:** These values come from the Giscus configuration page (giscus.app) after selecting the repository and category.
**How to avoid:** Visit https://giscus.app, enter the repository details, and copy the generated `data-repo-id` and `data-category-id` values. These are base64-encoded GraphQL node IDs.
**Warning signs:** Console errors about invalid repository or category.

### Pitfall 5: YouTube Facade Embeds Break During View Transitions
**What goes wrong:** The lite-youtube-embed or astro-embed-youtube components don't reinitialize after view transition navigation.
**Why it happens:** Custom elements may not re-register after DOM swap.
**How to avoid:** Test navigation to/from video-containing pages. The `@astro-community/astro-embed-youtube` used in this project renders server-side HTML with a facade pattern, so it should be fine since no client JS is involved. Verify during implementation.
**Warning signs:** Black/empty YouTube embed areas after navigating.

## Code Examples

### Getting Giscus Config Values
```
1. Go to https://giscus.app
2. Enter repository: [owner]/[repo-name]
3. Select mapping: "pathname" (recommended for blog posts)
4. Select category: Create "Blog Comments" category in GitHub Discussions first
5. Copy the generated script tag -- extract data-repo-id and data-category-id values
```

### Dark Mode Sync via postMessage
```javascript
// Source: https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md
function updateGiscusTheme() {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const iframe = document.querySelector('iframe.giscus-frame');
  if (!iframe) return;
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme } } },
    'https://giscus.app'
  );
}
```

### View Transition Reinitialization
```javascript
// Source: https://docs.astro.build/en/guides/view-transitions/
// astro:page-load fires on initial load AND after each view transition navigation
document.addEventListener('astro:page-load', () => {
  // Clear old giscus iframe and reload for current page
  const container = document.querySelector('.giscus');
  if (container) {
    container.innerHTML = '';
    loadGiscus(); // Re-injects script with current page's pathname
  }
});
```

## Discretion Recommendations

Based on research, here are recommendations for areas left to Claude's discretion:

### Discussion Category Mapping: Use `pathname`
**Recommendation:** `data-mapping="pathname"` with `data-strict="0"`
**Rationale:** Pathname mapping uses the page's URL path (e.g., `/my-blog-post/`) to match discussions. This is the most reliable for blog posts with clean URLs. It auto-creates discussions when the first comment is posted. The `og:title` option works too but is fragile if titles change. Number-based mapping requires manual discussion creation per post.

### Dark Mode Sync: Use postMessage API with MutationObserver
**Recommendation:** MutationObserver on `document.documentElement` class changes + postMessage to Giscus iframe
**Rationale:** This is reactive and immediate. The existing `ThemeToggle.astro` toggles the `dark` class on `<html>`, so a MutationObserver picks this up without coupling to the toggle component. The postMessage API is Giscus's official mechanism for runtime config changes.

### Giscus Theme Selection: Use built-in `light` and `dark` themes
**Recommendation:** Use `light` for light mode, `dark` for dark mode (Giscus built-in themes)
**Rationale:** These are clean, neutral themes that will blend with the site's slate palette. Custom CSS themes are possible but add maintenance burden. The built-in `dark` theme uses dark grays similar to the site's `bg-slate-800`. If the match isn't close enough, `dark_dimmed` is an alternative.

### Lazy Loading: Use IntersectionObserver
**Recommendation:** IntersectionObserver with `rootMargin: '200px'` to start loading slightly before the section scrolls into view
**Rationale:** Giscus supports `data-loading="lazy"` on the script tag, but dynamically injecting via IntersectionObserver gives better control: (1) the script tag itself isn't even added to the DOM until needed, (2) pairs naturally with the view transition reinitialization pattern that already clears/reinjects the script, (3) consistent with PERF-03 (zero unnecessary JS). The 200px root margin provides a smooth experience by preloading just before visibility.

### View Transition Refinements: Minimal
**Recommendation:** No custom transition animations needed. Verify existing crossfade works, especially on YouTube embed pages.
**Rationale:** The site already has `ClientRouter` with default crossfade. The `astro:after-swap` dark mode handler is in place. The main verification is that YouTube facade embeds (from `@astro-community/astro-embed-youtube`) render correctly after transitions. Since these are server-rendered HTML (not client-side islands), they should work without issues.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<ViewTransitions />` | `<ClientRouter />` | Astro 5.0 (Dec 2024) | Renamed component; same functionality |
| Static script tag for Giscus | Dynamic injection + postMessage | Giscus 2023+ | Required for SPA-like navigation |
| Disqus | Giscus | 2021+ trend | No tracking, no ads, GitHub-native |

**Deprecated/outdated:**
- `<ViewTransitions />`: Renamed to `<ClientRouter />` in Astro 5. This site already uses the new name.

## Open Questions

1. **Repository name for Giscus config**
   - What we know: No git remote is configured yet on this local repo
   - What's unclear: The exact GitHub repo owner/name needed for `data-repo`
   - Recommendation: Plan should note that the implementer needs the GitHub repo URL, and must visit giscus.app to generate `data-repo-id` and `data-category-id`. Could use placeholder values that get filled in during Phase 6 (deployment) if the repo isn't set up yet.

2. **GitHub Discussions category setup**
   - What we know: A category is needed before Giscus works
   - What's unclear: Whether the repo exists on GitHub yet
   - Recommendation: Include a setup task to enable Discussions and create a "Blog Comments" category. This is a manual GitHub step, not code.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser testing (no automated test framework configured) |
| Config file | none |
| Quick run command | `npm run build && npm run preview` |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | Giscus comment section renders on blog posts | manual | Build + preview, navigate to blog post, scroll to comments | N/A |
| ENG-01 | Dark mode toggle syncs Giscus theme | manual | Toggle dark mode while comments visible | N/A |
| ENG-01 | Giscus lazy-loads on scroll | manual | Open blog post, verify no giscus iframe in DOM until scrolling near comments | N/A |
| ENG-02 | View transitions work between pages | manual | Navigate between pages, verify crossfade animation | N/A |
| ENG-02 | Giscus reinitializes after view transition | manual | Navigate from one blog post to another, verify comments update | N/A |
| ENG-02 | YouTube embeds render after view transition | manual | Navigate to a post with YouTube embed via in-page link | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (verify no build errors)
- **Per wave merge:** `npm run build && npm run preview` + manual browser check
- **Phase gate:** Full manual verification of all behaviors listed above

### Wave 0 Gaps
None -- this phase requires manual browser testing only. No test framework setup needed.

## Sources

### Primary (HIGH confidence)
- [Giscus Advanced Usage (ADVANCED-USAGE.md)](https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md) - postMessage API, setConfig interface, theme switching
- [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) - ClientRouter lifecycle events, transition:persist limitations, script behavior
- [Giscus configuration page](https://giscus.app) - Available themes (23+), mapping strategies, script attributes

### Secondary (MEDIUM confidence)
- [Maxpou: Giscus with Astro](https://www.maxpou.fr/blog/giscus-with-astro/) - Verified integration pattern with dark mode sync and IntersectionObserver
- [EastonDev: Astro Comment Systems Guide (Dec 2025)](https://eastondev.com/blog/en/posts/dev/20251204-astro-comment-systems-guide/) - View transitions compatibility issue and astro:page-load fix
- [Eric Jinks: Giscus (2025)](https://ericjinks.com/blog/2025/giscus/) - Astro-specific integration patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Giscus is well-documented, zero dependencies needed, CDN-only
- Architecture: HIGH - Multiple verified Astro+Giscus integration guides confirm the pattern; existing codebase reviewed
- Pitfalls: HIGH - iframe + view transitions issue is widely documented; dark mode sync pattern is official Giscus API

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- Giscus and Astro view transitions are mature features)
