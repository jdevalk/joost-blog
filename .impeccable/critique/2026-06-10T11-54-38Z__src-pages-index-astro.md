---
target: homepage + a blog post
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-06-10T11-54-38Z
slug: src-pages-index-astro
---
# Critique — Homepage (src/pages/index.astro) & a representative blog post

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static content; view-transitions give nav feedback. n/a-leaning. |
| 2 | Match System / Real World | 4 | Masthead/volume-line metaphors fit an editorial blog perfectly. |
| 3 | User Control and Freedom | 3 | Palette switcher + search; no complaints. |
| 4 | Consistency and Standards | 4 | Specimen system applied consistently across home + post. |
| 5 | Error Prevention | 3 | Minimal forms; n/a-leaning. |
| 6 | Recognition Rather Than Recall | 4 | Clear nav, breadcrumbs, "filed under". |
| 7 | Flexibility and Efficiency | 3 | Keyboard-reachable; archive + search present. |
| 8 | Aesthetic and Minimalist Design | 4 | Exceptional restraint; every element earns its place. |
| 9 | Error Recovery | 3 | n/a-leaning for a content site. |
| 10 | Help and Documentation | 3 | Archive, search, RSS, /ask. |
| **Total** | | **34/40** | **Good→Excellent** |

## Anti-Patterns Verdict

**Does this look AI-generated? No — emphatically.** This is a hand-crafted editorial type-specimen: Klim Domaine Display/Text + Pitch, slate-on-parchment with a single terracotta accent, eight switchable palettes, a numbered article ledger, a drop-cap, a shrink-on-scroll masthead. None of the AI tells are present (no Inter, no cream-and-gradient, no icon-card grids, no per-section eyebrows).

**Deterministic scan:** 3 warnings, 0 errors. Two are the intentional terracotta heading/code left-rule (the system's signature "Heading Rule"), now recorded in `.impeccable/critique/ignore.md`. One is real: `transition: padding` on the sticky header (animates a layout property).

## What's Working

- **Type is the brand.** The Domaine pairing carries the identity; chrome stays out of the way. Measure clocks at 67ch / 20px / 1.6 — textbook long-form readability.
- **Restraint.** One accent, used sparingly. Flat-at-rest surfaces. The masthead does the shouting so the body doesn't have to.
- **Contrast holds.** H1 on the dark band 9.7:1; metadata ~6.2:1; terracotta breadcrumb 4.71:1 (passes AA). Mobile: zero overflow, hero scales cleanly to 56px.

## Priority Issues

- **[P3] Header animates layout properties.** `.sp-header-inner { transition: padding }` plus `width/height/font-size` on the mark. Fires once per scroll-threshold crossing (a class toggle, not per-frame), so real-world jank is negligible — but it trips the detector's layout-animation rule. Fix only if a detector-clean CLI run matters; otherwise leave. Suggested command: /impeccable optimize.
- **[P3] Hero clamp ceiling.** Home masthead reaches `clamp(96px,11vw,180px)`, above impeccable's 96px display ceiling. Deliberate specimen flourish, works on desktop, fits on mobile. No action; documented in DESIGN.md as an intentional exception.

## Minor Observations

- Terracotta breadcrumb/volume-line at ~4.71:1 passes AA for its size but is the closest call on the page; if the palette ever darkens, re-check.

## Questions to Consider

- Is detector-clean CI worth refactoring a working sticky header? (Likely no.)
- Should any of the 8 palettes be contrast-audited the way slate was?
