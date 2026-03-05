---
phase: 8
slug: add-site-search
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (no test framework in project) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | SEARCH-01 | smoke | `npm run build && ls dist/search/index.html` | N/A | ⬜ pending |
| 08-01-02 | 01 | 1 | SEARCH-02 | smoke | `npm run build && ls dist/pagefind/` | N/A | ⬜ pending |
| 08-01-03 | 01 | 1 | SEARCH-03 | manual | Search for a known post title | N/A | ⬜ pending |
| 08-01-04 | 01 | 1 | SEARCH-04 | manual | Click a search result | N/A | ⬜ pending |
| 08-01-05 | 01 | 1 | SEARCH-05 | manual | Toggle dark mode on search page | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. astro-pagefind handles all setup.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search returns relevant results | SEARCH-03 | Requires browser interaction with WASM runtime | Build, preview, type a known post title, verify results |
| Search results link correctly | SEARCH-04 | Requires clicking links in browser | Click a search result, verify correct page loads |
| Dark mode styling | SEARCH-05 | Visual verification of CSS variables | Toggle dark mode on search page, verify contrast |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
