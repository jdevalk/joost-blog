---
phase: 5
slug: engagement-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (no automated test framework configured) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~30 seconds (build) |

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
| TBD | 01 | 1 | ENG-01 | build | `npm run build` | N/A | ⬜ pending |
| TBD | 01 | 1 | ENG-01 | manual | Build + preview, navigate to blog post, scroll to comments | N/A | ⬜ pending |
| TBD | 01 | 1 | ENG-01 | manual | Toggle dark mode while comments visible | N/A | ⬜ pending |
| TBD | 01 | 1 | ENG-02 | manual | Navigate between pages, verify crossfade | N/A | ⬜ pending |
| TBD | 01 | 1 | ENG-02 | manual | Navigate between blog posts, verify comments update | N/A | ⬜ pending |
| TBD | 01 | 1 | ENG-02 | manual | Navigate to YouTube embed page via in-page link | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* No test framework setup needed — this phase requires build verification and manual browser testing only.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Giscus comment section renders on blog posts | ENG-01 | Requires GitHub Discussions backend + browser iframe | Build + preview, navigate to blog post, scroll to comments section |
| Dark mode toggle syncs Giscus theme | ENG-01 | Requires visual iframe inspection | Toggle dark mode while comments visible, verify theme changes |
| Giscus lazy-loads on scroll | ENG-01 | Requires scroll behavior in browser | Open blog post, check no giscus iframe in DOM until scrolling near comments |
| View transitions crossfade between pages | ENG-02 | Visual animation verification | Navigate between pages, verify smooth crossfade |
| Giscus reinitializes after view transition | ENG-02 | Requires navigation + iframe state verification | Navigate from one blog post to another, verify comments update to new post |
| YouTube embeds render after view transition | ENG-02 | Requires visual embed verification | Navigate to post with YouTube embed via in-page link |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
