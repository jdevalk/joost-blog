# Ask Joost improvement plan

This document lays out a phased technical plan for improving the `Ask Joost` setup on `joost-blog`.

## Goals

- Prevent unpublished content from leaking into answers
- Improve answer quality, retrieval relevance, and trustworthiness
- Improve follow-up handling
- Make the UX feel faster
- Make all improvements measurable

## Cross-cutting: observability

Every phase must include its own diagnostics. Rather than deferring observability to a standalone phase, each phase adds logging and evaluation coverage for what it changes.

Minimum per phase:
- Add or update eval queries that exercise the changed behavior
- Log enough to diagnose regressions (scores, latencies, fallback triggers)
- Record a before/after comparison where applicable

The eval fixture and debug tooling are bootstrapped in Phase 1 and grow incrementally.

---

## Phase 1 — Correctness, content hygiene, and eval bootstrap

**Goal:** fix the draft leak, clean up the index pipeline, and set up the evaluation foundation that all later phases depend on.

### Tasks

- Exclude `draft: true` posts from the index (`generate-nlweb-index.mjs` does not check frontmatter today — the draft post `ask-joost-ai-powered-answers` is currently in the index)
- Review other content that should be excluded (future/private pages, non-public transcripts)
- Verify generated source metadata is correct (title, URL, publication date, content type)
- Update the draft blog post to match the actual implementation (model is Llama 3.3 70B on Workers AI, not what the post says)
- Bootstrap evaluation:
  - Create a JSON fixture of ~15 representative queries with expected top sources (CMS, WordPress governance, biography, opinion-change, video/transcript, edge cases)
  - Add a `?debug=true` mode to `/ask` that returns score breakdowns, retrieval order, and timing alongside the answer
  - Add a simple eval script (`scripts/eval-ask.mjs`) that runs the fixture and reports top-3 precision

### Files involved

- `scripts/generate-nlweb-index.mjs` — add draft filtering, review content walk logic
- `src/content/blog/ask-joost-ai-powered-answers/index.md` — update copy
- `functions/ask.js` — add debug mode, timing headers
- `scripts/eval-ask.mjs` — new
- `tests/ask-eval-fixtures.json` — new

### Success criteria

- Draft content absent from `src/generated/nlweb-index.json` (verify with grep)
- `?debug=true` returns score breakdowns without breaking normal responses
- Eval script runs and produces a baseline precision number
- Blog post accurately describes the deployed stack

---

## Phase 2a — Query normalization and alias mapping

**Goal:** handle the cheapest retrieval wins first — synonym expansion and alias mapping.

This is split from the broader retrieval tuning because it's a small, testable change with outsized impact on short/vague queries.

### Tasks

- Add an alias/synonym map applied before retrieval:
  - `wp` → `wordpress`
  - `cms share` → `cms market share`
  - `seo plugin` ↔ `yoast seo`
  - `gutenberg` → `block editor`
- Normalize query casing and trim whitespace
- Add eval queries that test alias resolution

### Files involved

- `functions/ask.js` — query preprocessing before keyword + embedding search

### Success criteria

- `wp` and `wordpress` queries return the same top-3 results
- Eval top-3 precision improves on alias-dependent queries (measure against Phase 1 baseline)

---

## Phase 2b — Retrieval scoring and ranking

**Goal:** rebalance scoring and improve ranking quality.

### Tasks

- Rebalance keyword vs semantic scoring (currently keyword dominates: 0–20+ range, semantic 0–60, additive — semantic signal gets drowned out for exact-match queries)
- Revisit type-based boosts/demotions:
  - `WebPage` +15 boost — is this always appropriate?
  - `VideoObject` 70% demotion — too aggressive for video-specific queries?
- Add recency-aware tiebreaking when scores are close
- Timebox tokenization improvements (phrase matching, singular/plural, stopwords) to avoid rabbit-holing — if basic stemming doesn't land in a day, defer to a later iteration

### Files involved

- `functions/ask.js` — scoring weights, reranking logic
- `scripts/generate-nlweb-index.mjs` — if richer metadata is needed for scoring (e.g., word count, content freshness signals)

### Success criteria

- Eval top-3 precision ≥ 80% on the fixture set (measure from baseline)
- Synonym-heavy and short queries show measurable improvement
- Video/transcript hits drop for informational queries but remain for video-specific ones

---

## Phase 3 — Grounding and source quality

**Goal:** make answers easier to trust and inspect.

### Dependency note

If this phase introduces a structured response format (e.g., JSON with answer + sources + metadata), document the schema clearly — Phase 5 (streaming) will need to handle it incrementally.

### Tasks

- Tighten the system prompt to require clearer attribution and temporal awareness:
  - distinguish current views from older views from historical reporting
- Improve source presentation in the response:
  - show publication date
  - show content type (blog post / page / video)
- Keep source extraction robust when the model references only some context
- Consider a structured internal response shape (answer + sources object), even if the UI still renders markdown
- Add eval queries that test temporal attribution (e.g., "what does Joost think about X" where his view changed over time)

### Files involved

- `functions/ask.js` — system prompt, source extraction, response shaping
- `src/pages/ask-joost.astro` — source display rendering
- `src/generated/nlweb-index.json` — may need richer date/type metadata passed through

### Success criteria

- Answers cite the most relevant sources (not just all context sources)
- Source lists include publication date and content type
- Temporal queries correctly distinguish current vs past views (test with eval fixture)
- Older posts do not override newer views on the same topic

---

## Phase 4 — Conversation quality

**Goal:** make follow-up questions work more reliably.

### Tradeoff: query rewriting adds latency

Decontextualization ("what about governance?" → "what is Joost's view on WordPress governance?") requires either an LLM call (~200–500ms extra) or heuristic rewriting. The plan assumes in-prompt rewriting first (passing the conversation history and letting the main LLM resolve references), escalating to a separate rewrite call only if that proves insufficient.

### Tasks

- Improve how prior exchanges are passed (currently: last 3, always — consider relevance-based selection)
- Try in-prompt reference resolution first (adjust system prompt to instruct the model to interpret follow-ups in context)
- If insufficient: add a lightweight rewrite step server-side, but measure the latency cost
- Prevent stale context from biasing later questions (cap history, summarize if long)
- Decide and document: follow-up state stays client-side (current), or server validates

### Files involved

- `functions/ask.js` — conversation history handling, system prompt
- `src/pages/ask-joost.astro` — history management, possibly UI for "new conversation" reset

### Success criteria

- "What about that?" after a specific question resolves correctly in ≥ 80% of test cases
- Multi-turn conversations stay coherent for at least 5 exchanges
- No measurable latency regression if using in-prompt rewriting; ≤ 300ms regression if using a separate rewrite call

---

## Phase 5 — Streaming responses

**Goal:** improve perceived speed and responsiveness.

### Dependency on Phase 3

If Phase 3 introduced a structured response format, streaming must handle incremental delivery of that structure. Plan for: stream the answer text as tokens arrive, then append the source block as a final chunk once generation completes.

### Tasks

- Add streaming support from `/ask` using Workers AI streaming API
- Update the Ask page to render partial responses as tokens arrive
- Append source list after generation completes (separate final chunk or SSE event)
- Ensure errors/fallbacks still work cleanly (non-streaming fallback if stream fails)
- Confirm follow-up state remains correct with streamed conversations
- Test with Workers AI specifically — their streaming API shape may differ from standard OpenAI SSE

### Files involved

- `functions/ask.js` — response streaming, chunked source delivery
- `src/pages/ask-joost.astro` — incremental rendering, stream reader

### Success criteria

- Time-to-first-token ≤ 1s for typical queries
- Full response renders correctly (including sources) after stream completes
- Non-streaming fallback still works if streaming fails
- No regressions in follow-up handling

---

## Phase 6 — Error handling and resilience

**Goal:** handle failure modes gracefully.

### Tasks

- Handle Workers AI downtime (timeout, 5xx) — show a clear error, don't hang
- Handle empty or corrupt index gracefully
- Add basic input validation / sanitization (length limits, strip injection attempts)
- Handle LLM returning garbage (empty content, null, malformed markdown)
- Rate-limit awareness: document current Workers AI limits and flag if any phase pushes close to them
- Add a health check endpoint or lightweight status signal

### Files involved

- `functions/ask.js` — error handling, validation, timeouts
- `src/pages/ask-joost.astro` — error display states

### Success criteria

- Workers AI timeout produces a user-visible error within 10s, not a hang
- Malformed input doesn't crash the function
- LLM garbage responses fall back to deterministic summary (existing fallback path)

---

## Phase 7 — UX polish and product improvements

**Goal:** make the feature clearer and more useful once the core is solid.

### Tasks

- Add suggested starter questions
- Optionally support a visible mode switch (answer mode / search-only mode)
- Improve source display styling (dates, types, better link treatment)
- Add "related posts" or "keep reading" links
- Add lightweight answer feedback (helpful / not helpful)
- Expose NLWeb compatibility more explicitly if useful for developer audiences

### Files involved

- `src/pages/ask-joost.astro` — UI changes
- `src/components/` — if UI gets split into components

### Success criteria

- New users have a clear starting point (starter questions)
- Weak answers have a useful recovery path (related posts, feedback)
- Feedback data is captured for future tuning

---

## Implementation order

1. **Phase 1** — correctness, content hygiene, eval bootstrap
2. **Phase 2a** — query normalization (quick win)
3. **Phase 2b** — retrieval scoring and ranking
4. **Phase 3** — grounding and source quality
5. **Phase 4** — conversation quality
6. **Phase 5** — streaming responses
7. **Phase 6** — error handling and resilience
8. **Phase 7** — UX polish

Observability grows with every phase — it is not a separate step.

---

## Suggested first deliverable

A single PR covering Phase 1:

- Draft exclusion from the generated index
- Debug mode on `/ask`
- Eval fixture (~15 queries) and eval script
- Blog post copy updates

This fixes the correctness bug, establishes the measurement baseline, and makes every subsequent change testable.

---

## Open questions

- Should pages always outrank blog posts, or only for certain query types?
- Should transcripts be searchable but rarely shown as visible sources?
- Should the system explicitly expose uncertainty or confidence?
- Should follow-up history stay entirely in the browser, or should the server own more of that logic?
- Should the retrieval/generation logic be extracted from `functions/ask.js` before further complexity is added? (Currently ~400 lines in one file — manageable now, but Phase 2b+ will add weight.)
- What are the current Workers AI rate limits, and how close is current usage?

---

## Cost and resource awareness

The current stack runs on Cloudflare Workers AI free/included tier. Changes that increase token usage:

| Change | Impact |
|--------|--------|
| Query rewriting (Phase 4) | +1 LLM call per follow-up (~200–500ms, ~200 tokens) |
| Richer system prompts (Phase 3) | +100–300 tokens per request |
| Streaming (Phase 5) | Same tokens, different delivery — no cost increase |
| Eval script runs | Burst of ~15 queries per run — negligible |

Monitor usage after Phases 3 and 4 to confirm we stay within limits.
