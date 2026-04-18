---
title: How I made my skills update themselves
seo:
  description: >-
    Skills install as loose folders with no package manager. Here's the pattern
    I landed on after publishing a first attempt and getting corrected on
    LinkedIn.
publishDate: 2026-04-14T00:00:00.000Z
updatedDate: 2026-04-18T00:00:00.000Z
excerpt: >-
  Agent Skills install as loose folders. There's no npm, no registry, no daemon
  checking for updates. I shipped a version-check pattern, published it, and got
  corrected on LinkedIn. Here's what I learned and what replaced it.
categories:
  - Development
  - AI
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: How I made my skills update themselves'
toc: false
---
I updated one of my [Agent Skills](https://github.com/jdevalk/skills) and realized I had no way to tell my other machines they were running a stale copy. Skills install as loose folders in `~/.claude/skills/`. The skill runs whatever's on disk — and has no way of knowing there's a newer version.

This post describes what I tried first, why it wasn't quite right, and what replaced it after [a useful LinkedIn thread](https://www.linkedin.com/posts/jdevalk_agent-skills-ship-as-loose-folders-no-npm-share-7449864833010655232-xAj9).

## Why versioning matters

Most of [my skills](https://github.com/jdevalk/skills) are the executable companion to a post:

- The [astro-seo skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-astro-seo) implements [Astro SEO: the definitive guide](/astro-seo-complete-guide/).
- The [github-repo skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-github-repo-optimizer) implements [How to create a healthy GitHub repository](/healthy-github-repository/).
- The [github-profile skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-github-profile-optimizer) implements [Good-looking GitHub profile pages](/good-looking-github-profile-pages/).
- The [wp-github-actions skill](https://github.com/jdevalk/skills?tab=readme-ov-file#-wordpress-github-actions) implements [GitHub Actions to keep your WordPress plugin healthy](/github-actions-wordpress/).

Each pairing turns an opinionated blog post into a drop-in workflow. The post argues for a set of choices; the skill makes those choices the default. Want to understand why? Read the post. Want to apply it? Run the skill.

But opinions evolve. When I update the Astro SEO guide to cover a new [build-time validator](/astro-seo-complete-guide/#build-time-validation), I update the skill in the same pass. If users don't know their installed skill is behind the post, they'll follow instructions that no longer match what I'd write today. An agent skill without a version check is cached documentation. Useful until it's wrong.

## The original pattern

The original version of this post embedded a self-check in each SKILL.md. Four pieces: a `version:` field in each skill's frontmatter, a `versions.json` at the repo root, a paragraph telling the agent to check the manifest on invocation and offer to install an update, and a CI check to keep them in sync.

It worked. But it had real costs — tokens on every invocation even when nothing had changed, and a mid-task re-invoke nobody wanted — and I'd claimed that centralizing the check "needs harness support Claude Code doesn't expose to skill authors today." People in the thread corrected both.

## Lessons from the thread

The post ended with a genuine question: had anyone found a better workflow for keeping skills in sync? It worked.

After I published, three comments pointed at things I'd missed.

Felix Arntz mentioned [skills.sh](https://skills.sh). I knew the site and had assumed it was install-only, no update mechanism. Looking more carefully, I found that `npx skills` supports a `--skill` flag for targeting individual skills inside a monorepo. That meant `npx skills update astro-seo` already worked for my setup. I just hadn't known the flag existed.

Dovid Levine suggested adding the check to Claude's startup hook or a postinstall script. The right place is a `SessionStart` hook in `settings.json` — a shell command that runs before any context loads, outside the context window entirely. Zero token cost. That's the harness support I claimed didn't exist. The hook updates skill files on disk before the session reads them, so each new session starts with current content.

## The current pattern

The skills repo no longer contains any self-update logic. Two commands cover install and update:

```sh
# Install one skill
npx skills add jdevalk/skills --skill astro-seo

# Install all skills
npx skills add jdevalk/skills
```

```sh
# Update all installed skills
npx skills update

# Update one skill
npx skills update astro-seo
```

For users who want updates to happen automatically, add a `SessionStart` hook to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "npx skills update -g -y 2>/dev/null"
      }
    ]
  }
}
```

This runs outside the context window on every session start, `/clear`, and compaction. Skills stay current without the user doing anything. If the latency bothers you on `/clear`, scope it to startup only by checking `source` in the hook input.

## If you maintain skills

No releases needed — `npx skills update` pulls directly from `main`. A per-skill `README.md` is worth adding: skills.sh shows it on each skill's individual page.

Include the `SessionStart` hook snippet in your `README` for users who want zero-friction updates.

No runtime. No service. No tokens.

---

*This post was updated after [a LinkedIn discussion](https://www.linkedin.com/posts/jdevalk_agent-skills-ship-as-loose-folders-no-npm-share-7449864833010655232-xAj9). Felix Arntz and Dovid Levine pointed at things I'd missed in the original version.*
