---
title: How I made my skills notice their own version
seo:
  description: >-
    Skills install as loose folders with no package manager behind them. Here's
    a small pattern that makes each skill check its own version on invocation.
publishDate: 2026-04-14T00:00:00.000Z
excerpt: >-
  Agent Skills install as loose folders. There's no npm, no registry, no daemon
  checking for updates. I shipped a new version of a skill last week and
  realized I had no way of telling the users still running the old one. So I
  made the skills check themselves.
categories:
  - Development
  - AI
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: How I made my skills notice their own version'
toc: false
draft: true
---
I updated one of my [Agent Skills](https://github.com/jdevalk/skills) today and realized I had no way to tell my other machines they were running a stale copy. Skills install as loose folders in `~/.claude/skills/` (or wherever your agent puts them). There's no `npm outdated`, no `brew upgrade`, no update daemon. The skill just runs whatever's on disk.

So I added a small pattern that makes each skill check itself on invocation. I couldn't find anyone doing quite this. The whole thing is fifteen lines of configuration.

## Why versioning matters when posts and skills ship together

Most of [my skills](https://github.com/jdevalk/skills) are the executable companion to a post:

- The [astro-seo skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-astro-seo) implements [Astro SEO: the definitive guide](/astro-seo-complete-guide/).
- The [github-repo skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-github-repo-optimizer) implements [How to create a healthy GitHub repository](/healthy-github-repository/).
- The [github-profile skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-github-profile-optimizer) implements [Good-looking GitHub profile pages](/good-looking-github-profile-pages/).
- The [wp-github-actions skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-wordpress-github-actions) implements [GitHub Actions to keep your WordPress plugin healthy](/github-actions-wordpress/).

Each pairing turns an opinionated blog post into a drop-in workflow.

This is a shipping pattern I like a lot: the post argues for a set of choices, the skill makes those choices the default. Want to understand why? Read the post. Want to apply it? Run the skill.

But opinions evolve. When I update the Astro SEO guide to cover a new [build-time validator](/astro-seo-complete-guide/#build-time-validation), I update the skill in the same pass. If users don't know their installed skill is behind the post, they'll follow instructions that no longer match what I'd write today. An Agent Skill without a version check is cached documentation. Useful until it's wrong. And you don't find out until it is.

That's the specific problem I'm solving. The pattern below is general, but this is why it matters to me.

## The pattern

Four pieces.

First, every SKILL.md carries a `version:` field in its frontmatter:

```yaml
---
name: astro-seo
version: "0.4"
description: >
  Audits and improves SEO for Astro sites...
---
```

Second, a single `versions.json` at the repo root maps each skill name to its current version:

```json
{
    "astro-seo": "0.4",
    "readability-check": "0.4",
    "github-repo": "0.3"
}
```

Third, every SKILL.md includes a short paragraph that tells the skill to self-check when it runs:

```markdown
Before running, fetch https://raw.githubusercontent.com/jdevalk/skills/main/versions.json
and compare the `astro-seo` entry to the `version:` in this file's
frontmatter. If the manifest version is higher, tell the user this skill
is out of date and point them to the latest release. Continue regardless —
the check is informational, not a blocker.
```

Fourth, a CI job that fails any PR where a skill's frontmatter version doesn't match its `versions.json` entry. The manifest and the shipped skills can't drift.

That's it. No runtime. No service. The skill itself does the check on each invocation, using the WebFetch tool that Claude Code already has. Users find out they're behind at exactly the moment it matters — when they're about to run the skill.

## Why no cache

The obvious concern is that every skill invocation now costs a network round-trip. Three reasons I left it alone:

The WebFetch tool already has a built-in 15-minute cache. Multiple skill invocations in one work session share the response, which covers the realistic hot path. I'm not going to beat that with hand-rolled caching.

A longer cache fights the purpose. The whole point of the check is to alert me about updates. A 24-hour cache means I could miss a release for a day. The check is already non-blocking. A cache miss costs less than running a stale skill for another day.

The fetch is around a hundred milliseconds against a static GitHub raw URL. In a human-paced workflow where I invoke a skill once or twice per session, it's noise. If I ever ship fifty skills and it matters, the better fix is to centralize. One shared manifest fetch per session, not one per skill. But that needs harness support Claude Code doesn't expose to skill authors today. So the skill is the smallest unit with an execution context, and that's where the check lives.

## What I couldn't find

Before writing this up I went looking for prior art. The closest patterns in the Agent Skills ecosystem:

- **Anthropic's `marketplace.json` plus `/install`**: version tracked in a marketplace manifest, updates happen via an external CLI command or an `update_marketplace.py` script. The user has to run something to learn they're behind.
- **[skills-updater](https://github.com/yizhiyanhua-ai/skills-updater)** (community skill): scans your installed skills, checks each against its remote repo, and offers to update them. The closest prior art I found — but it's an external tool the user has to invoke, not a check embedded in the skill itself.
- **Smithery, OpenCode, and other skill hosts**: track versions for distribution but don't ship a self-check.

None of them check inside the skill, at invocation time, against a repo-local manifest. Which is fair — it's not a big idea. It's just a pattern that package managers have had for decades, applied to a new distribution format that doesn't have one yet.

If you maintain skills and your users install them as loose files, steal this. It works for any agent whose skill format is "a folder with a markdown file and some frontmatter."

Have you seen a better workflow for keeping agent skills in sync with their source? I'd genuinely like to know — this is the best I could come up with, but "best I could come up with" is a pretty low bar when the format is new enough that conventions haven't settled.
