---
phase: 7
slug: yoast-like-schema
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build (static output validation) + Node.js validation scripts |
| **Config file** | astro.config.mjs |
| **Quick run command** | `npx astro build && node scripts/validate-schema.mjs` |
| **Full suite command** | `npx astro build && node scripts/validate-schema.mjs --full` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx astro build`
- **After every plan wave:** Run `npx astro build && node scripts/validate-schema.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SCHEMA-01 | smoke | `npx astro build && grep -r 'application/ld+json' dist/ \| wc -l` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | SCHEMA-02 | smoke | Build + inspect blog post HTML for Article + WebPage + BreadcrumbList | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | SCHEMA-03 | unit | Validate person data object has all sameAs, worksFor entries | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | SCHEMA-04 | unit | Parse JSON-LD, verify all @id refs resolve within graph | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | SCHEMA-05 | unit | Test breadcrumb builder with each page type | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-schema.mjs` — Node script to parse built HTML and validate JSON-LD structure
- [ ] Validates: single JSON-LD block per page, valid @graph array, @id cross-references resolve
- [ ] Validates: correct schema types per page type (Article for posts, VideoObject for videos, etc.)

*No framework install needed — uses Astro build + custom validation scripts.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google Rich Results compatibility | SCHEMA-03 | Requires external tool | Test sample pages with Google Rich Results Test tool |
| Visual verification of schema in browser | All | Browser dev tools | Inspect JSON-LD in page source of built site |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
