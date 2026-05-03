---
name: wp-readme-optimizer
description: >
  Reviews and rewrites WordPress.org plugin readme.txt files for maximum quality.
  Use this skill whenever a user pastes, uploads, or references a WordPress plugin readme.txt,
  or asks to improve, audit, review, score, or optimize a plugin's WordPress.org listing page.
  Also trigger when the user says things like "make my plugin page better", "optimize my readme",
  "help me rank higher on WordPress.org", or "review my plugin listing". Always run the full
  audit + rewrite workflow unless the user explicitly asks for only one part.
---

# WordPress Plugin readme.txt Optimizer

This skill reviews a WordPress.org plugin readme.txt file with a structured audit, scores each section, and then produces a fully rewritten version. The goal is higher visibility in the WordPress.org plugin directory, better conversion of visitors to installs, and a more trustworthy plugin page.

**Rewrite recipes live in `AGENTS.md`** — read it when producing the rewritten readme.

## Workflow

1. **Read the readme.txt** — If a file is attached, read it. If the user pasted content, use that. If neither, ask the user to provide the readme.txt content.
2. **Infer the target keyword** — Before scoring, identify what keyword(s) this plugin should rank for. This anchors the entire audit.
3. **Run the audit** — Score each section and write specific, actionable findings.
4. **Produce the rewrite** — Deliver a drop-in replacement readme.txt, incorporating all audit findings. Follow the recipes in `AGENTS.md`.

---

## Phase 0: Keyword Inference

Before scoring, output: **Primary keyword** (the 2-3 word phrase most likely to drive installs), **Secondary keywords** (3-4 supporting terms), **Inferred from** (plugin name / tags / description), **Confidence** (high / medium / low).

Infer by asking: "If a WordPress site owner needed this plugin, what would they type into the search bar?" Look at the plugin name, tags, and the first paragraph. If confidence is **low**, add `<!-- Couldn't confidently infer primary keyword -->` and proceed with your best guess.

All scoring in Phase 1 is evaluated against this inferred keyword.

---

## Phase 1: Audit

### Scoring

Score each of the 8 sections below out of 10 (total /80). Show a summary table at the top of the audit. Score ranges: **65-80** strong (polish only), **45-64** solid with gaps, **25-44** significant problems, **0-24** bare minimum.

For each section, write 2-5 specific findings. A finding should name the problem, explain why it matters, and suggest a fix. Never be generic -- always refer to the actual content.

### What to evaluate per section

#### Plugin Name & Tags

- Is the name descriptive of what the plugin *does*, not just a brand name?
- Does it include the primary keyword users would search for?
- Are up to 5 tags used? Are they the right ones -- high-volume, specific to the plugin's function?
- Would a stranger immediately understand what the plugin does from the name alone?

#### Short Description (<=150 chars)

- Does it lead with the user's problem or benefit, not the plugin's name?
- Is it under 150 characters (hard limit -- truncation kills CTR)?
- Does it contain the primary keyword naturally?
- Is it specific (avoid vague claims like "powerful", "easy", "best")?
- Does it end before 150 chars -- not mid-sentence?

#### Long Description

- Does the first paragraph act as a strong hook -- benefit-led, not feature-led?
- Is the primary keyword used in the first 150 words?
- Are there H2/H3 headings to break up the text (using `== Heading ==` syntax)?
- Are features presented as user benefits, not just a bullet dump?
- Is there social proof -- active installs, ratings, notable users?
- Is there a clear call to action (e.g. link to Pro, docs, or demo)?
- Does it include FAQ-style content or video embeds for richness?
- Are secondary/long-tail keywords naturally woven in?

#### Installation

- Are the steps numbered and complete?
- Does it cover both manual (FTP) and automatic (dashboard) methods?
- Are there any post-activation steps mentioned?

#### FAQ

- Are the questions things real users actually ask (check support forum topics if possible)?
- Do the answers contain keywords naturally?
- Is there at least one question that surfaces a common objection or concern?
- Are questions phrased the way a user would type them, not how a developer would write them?

#### Screenshots

- Is there a `== Screenshots ==` section?
- Does each screenshot have a caption (captions are indexed by the search engine)?
- Do captions describe what the user sees AND include relevant keywords?
- Are there enough screenshots to cover the key UI flows?

#### Changelog

- Is the changelog up to date?
- Does it follow the format `= X.X.X =` with bullet points underneath?
- Does the most recent entry communicate user-facing value, not just `"bug fixes"`?
- Is there a reasonable update cadence visible (signals active maintenance)?

#### Stable Tag & Plugin Headers

- Does `Stable tag:` match the latest tag in the `/tags/` SVN directory?
- Is `Requires at least:` conservative enough to not exclude users?
- Is `Tested up to:` current (within 1-2 major WP releases)?
- Is `Requires PHP:` declared?
- Is `License:` declared (GPL-2.0-or-later)?

---

## Phase 2: Rewrite

After the audit, produce the complete rewritten readme.txt. **Read `AGENTS.md` for the full rewrite rules, section-by-section writing guidance, and the format reference.**

`AGENTS.md` sections: Rewrite rules, Plugin Name & Tags, Short Description, Long Description, Installation, FAQ, Screenshots, Changelog, Stable Tag & Headers, Format Reference.

---

## Phase 2.5: Metadata and readability pass

After producing the rewritten readme.txt, run two passes before presenting it:

1. **Metadata pass -- `metadata-check` skill.** Run on the plugin name, short description, and each FAQ answer. Checks front-loading, concreteness, filler, truncation fit, one-idea-per-field.
2. **Prose pass -- `readability-check` skill.** Run on the long description only. Skip headers block, changelog, and installation steps.

The WordPress.org audience is global -- many users read English as a second language. Apply fixes directly. Prioritize: (1) the short description, (2) the first paragraph of the long description, (3) FAQ answers.

---

## Output format

`## Audit` with score table and per-section findings, then `---`, then `## Rewritten readme.txt` with the complete file inside a code block.

---

## Key principles

- **Elastic Search powers the directory.** Keywords in title, tags, short description, headings, and FAQ questions carry weight -- natural language wins over stuffing.
- **Short description is highest-leverage.** It's the search-result snippet. Weak copy kills CTR before anyone reads the description.
- **Update recency is a trust signal.** A stale "last updated" date loses installs.
- **Support rating is a ranking factor.** Flag if the description could invite unnecessary negative reviews.
- **Screenshot captions are indexed.** They're SEO content, not just UX.
- **Write for intent, not features.** Lead with outcomes -- what the user achieves, not what the plugin is.
