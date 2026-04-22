---
title: Dropping Astro's ClientRouter for web standards
publishDate: 2026-04-22T00:00:00.000Z
excerpt: >-
  Astro's ClientRouter is a solid abstraction for complex apps. For a simple
  blog, it turned out to be a workaround for things the platform now does
  natively — and it was quietly breaking iOS Safari's Reader Mode.
categories:
  - Development
toc: true
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Dropping Astro''s ClientRouter for web standards'
---

Astro ships a built-in SPA router called `ClientRouter`. It intercepts navigations, swaps the DOM in JavaScript, and fires its own lifecycle events — giving you smooth transitions, prefetching, and persistent elements across page loads. For a complex app with shared state across routes, that JavaScript layer earns its keep.

For a blog, it turned out to be a JavaScript solution to problems the browser now solves in CSS and HTML. Cross-document view transitions, link prefetching, animated element morphs — all of it ships natively, with no client-side routing, no lifecycle events, and no DOM mutation on navigation. And removing the JavaScript layer fixed a real bug in the process.

## The trigger: iOS Safari Reader Mode

iOS Safari's Reader Mode reformats pages for distraction-free reading. It works by observing the DOM and rewriting it into a clean reading view. ClientRouter works by intercepting navigations, fetching the new page's HTML, and swapping parts of the DOM in place. Those two things conflict: Reader Mode was reacting to ClientRouter's DOM mutations with scroll-jumps that made the reading experience worse.

[Anne Bovelett](https://annebovelett.eu/) messaged me: "there's a weird jump bug when i read it in reader mode." That was the first I'd heard of it. I opened Reader Mode, navigated around, and sure enough — every page change produced a scroll-jump as Reader Mode tried to reformat content mid-DOM-swap.

The fix wasn't to patch the interaction. It was to stop doing SPA navigation on a site that doesn't need it.

## What ClientRouter actually does

ClientRouter bundles three things:

1. **SPA navigation**: intercepts link clicks, fetches the next page, diffs and swaps the DOM. Enables lifecycle events like `astro:page-load` and `astro:after-swap`.
2. **Prefetching**: starts loading pages before the user clicks, based on which links are in the viewport.
3. **View transitions**: animates the content swap using the View Transitions API.

Each of these has a web platform equivalent.

## The platform alternatives

### Cross-document view transitions

The CSS View Transitions spec introduced `@view-transition { navigation: auto; }` — a single at-rule that enables animated transitions between full page loads, no JavaScript required:

```css
@view-transition {
    navigation: auto;
}
```

Named elements morph between pages when you give them matching `view-transition-name` values. The post feature images on this blog have names like `post-image-{slug}` on the card and on the post hero — so navigating from the index to a post animates the image into place.

**Browser support caveat:** cross-document view transitions are not yet [Baseline](https://web.dev/baseline). Same-document transitions (`document.startViewTransition()`) became Baseline Newly Available in October 2025 when Firefox 144 shipped support. Cross-document transitions are a different story: Chrome 126+, Edge 126+, Safari 18.2+ — but no Firefox yet. For Firefox users, the `@view-transition` rule is simply ignored and they get normal navigation. That's acceptable progressive enhancement for a blog.

### Speculation Rules

The [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) lets you declare prefetch and prerender rules in a JSON script tag. This is what replaced Astro's `prefetch: { defaultStrategy: 'viewport' }` config:

```json
{
  "prefetch": [{
    "source": "document",
    "where": {
      "and": [
        { "href_matches": "/*" },
        { "not": { "href_matches": "/*\\?*" } },
        { "not": { "selector_matches": "[rel~=\"nofollow\"]" } }
      ]
    },
    "eagerness": "moderate"
  }]
}
```

`moderate` eagerness means the browser prefetches on hover or touchstart — roughly equivalent to what Astro's viewport strategy was doing, without the framework in the middle.

**Browser support caveat:** Speculation Rules is Chromium-only right now — Chrome and Edge. Safari and Firefox ignore the script tag silently. Again, progressive enhancement: Chromium users get prefetching, everyone else gets normal navigation.

**A note on AI and browser support:** Both of these caveats were facts I had to verify manually — the first draft of this section, written with AI assistance, described cross-document view transitions as broadly supported without flagging Firefox as missing. AI assistants are trained on documents with a cutoff date; browser support tables move faster than training data. Don't rely on an AI (including the one that helped write this) for current compat data. Check [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition) or [caniuse](https://caniuse.com/) directly.

## The swap itself was small

The core change was nine files, mostly deletions. Remove the `ClientRouter` import, replace Astro's prefetch config with a speculation rules script tag, swap the root animation duration CSS for `@view-transition { navigation: auto; }`. The meaningful code change was around 15 lines.

One bonus: Plausible analytics had been manually re-firing pageviews via an `astro:page-load` listener, because ClientRouter's SPA navigation prevented the script from firing naturally. With real page loads back, the Plausible script fires automatically on every navigation. That listener was also dead code waiting to be found.

## The cleanup was not small

What took longer: finding everything that depended on `astro:page-load` and `astro:after-swap`.

When ClientRouter is active, it dispatches those events on every SPA navigation. Without it, they never fire. The events don't error — they just silently do nothing. Which meant anything wired up through them had quietly stopped working.

On this site that was:

- **`/ask-joost/`** — the whole page: form submission, SSE streaming, starter question buttons. All wrapped in a `document.addEventListener('astro:page-load', ...)` callback. Dead on arrival.
- **Header** — `menuToggle` and `headerScroll` were also re-registered on `astro:after-swap`. They still ran on page load via direct calls, so mobile nav and scroll behavior worked. The listeners were just dead weight.
- **SearchModal** and **ThemeToggle** — same pattern: direct init call on load, redundant `astro:after-swap` re-registration.

The ask page was the only one actually broken. The rest were harmless — on full page navigation, the DOM is fresh and the direct calls handle initialization. But they were still wrong.

### Lint to prevent regression

To make sure this doesn't happen again, I added a small script to the build pipeline. Before `astro build` runs, it walks `src/` and fails the build if it finds `astro:page-load`, `astro:after-swap`, or the other ClientRouter events in any file — unless `ClientRouter` itself is present somewhere:

```js
const CLIENT_ROUTER_EVENTS = [
    'astro:page-load', 'astro:after-swap',
    'astro:before-swap', 'astro:before-preparation'
];

// Only flag them if ClientRouter isn't in use
if (!hasClientRouter) {
    // fail build if any of the above are found
}
```

If ClientRouter comes back, the lint passes. If it doesn't, orphaned event listeners won't survive to production.

## The overflow:hidden surprise

After the swap, cross-document view transitions were working for the featured post at the top of the homepage, but not for the six cards in the "Latest Articles" grid below it.

Both had `view-transition-name` set on the image link. Both had matching names on the destination page. The difference showed up in browser inspection: the featured post's named element had no `overflow: hidden` ancestor. Each article card's named element was inside an `<article>` with Tailwind's `overflow-hidden` class.

CSS view transitions capture a snapshot of the named element to animate. When the element sits inside an `overflow: hidden` ancestor, that capture is clipped — and in practice, the morph animation didn't trigger for any of the cards.

The fix was two lines: remove `overflow-hidden` from the `<article>` wrapper, add `rounded-t-lg` to the image link so it clips its own top corners. The card still looks identical — the border radius on the image is preserved — but the named element is no longer inside a clipping ancestor.

Worth knowing if you're adding `view-transition-name` to elements in a layout that uses `overflow: hidden` for border radius clipping.

## When ClientRouter is still the right call

The browser compat story above is a real argument for ClientRouter that shouldn't be glossed over. It polyfills view transitions for browsers that don't support them natively, so you get consistent animated page transitions everywhere, not just in Chrome and Safari. If you need that consistency — a product site, a portfolio with heavy visual transitions, an app-like experience — ClientRouter earns its place.

The same applies if you have genuinely persistent UI: a music player that shouldn't stop between navigations, a sidebar that holds scroll state, shared React or Svelte components that shouldn't re-mount on every page. ClientRouter exists precisely for these cases, and it does them well.

What it gives you as a side effect: lifecycle events (`astro:page-load`, `astro:after-swap`) that make it easy to re-initialize scripts after each navigation. What it gives you as a different kind of side effect: lifecycle events scattered across your codebase that silently break the moment you remove the router. The [Astro docs warn about script re-initialization](https://docs.astro.build/en/guides/view-transitions/#script-re-execution); it's a real maintenance surface.

## Was it worth it?

For this site, yes. A blog doesn't need persistent UI across navigations, doesn't need consistent animated transitions in Firefox, and doesn't need the maintenance burden that comes with SPA-style lifecycle events. The platform alternatives cover everything this site actually needs.

The broader point: ClientRouter is a thoughtful abstraction for sites that genuinely benefit from SPA-style navigation. For a straightforward content site, it was adding complexity without adding value — and the complexity had a real cost, in a Safari bug that affected readers and in dead event listeners that silently took down a page.

Platform support caught up enough that the trade-off shifted. It'll keep shifting.
