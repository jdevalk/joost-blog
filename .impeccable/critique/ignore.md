# Critique ignore list

Findings the detector raises that are **intentional brand decisions**, documented in [DESIGN.md](../../DESIGN.md). `/impeccable critique` drops anything matching these; they are not slop.

## side-tab — terracotta heading left-rule

- **Where:** `src/styles/global.css` (`border-l-3` on `.prose h2`/`h3`)
- **Why kept:** The hung terracotta/accent rule on headings is the Specimen system's signature mark (the "Heading Rule"). It sits on headings, not on cards or callouts — it is not the AI card side-stripe the rule targets.

## side-tab — terracotta rule on code blocks

- **Where:** `src/styles/specimen.css` (`border-left: 3px solid var(--terracotta)` on `pre`)
- **Why kept:** Same brand signature applied to code/field surfaces. Deliberate, consistent with the heading rule.

> Note: the raw `npx impeccable detect` CLI does not read this file, so it will still list these two. They are expected. The header `transition: padding` (specimen.css) is a separate, real-but-minor finding and is **not** ignored here.
