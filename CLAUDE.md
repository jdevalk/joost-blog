# Repo notes

## Draft preview passwords

Draft posts can be gated with a per-post password so they're shareable without being public.

**How to set one on a post:**

Add two fields to the post's frontmatter:

```yaml
draft: true
password: some-secret-string
```

**How it works end-to-end:**

1. **`src/content.config.ts`** — blog collection schema allows optional `password: z.string().optional()` alongside `draft: z.boolean()`.
2. **`scripts/generate-draft-slugs.mjs`** — runs in the `build` npm script; scans every post and writes `public/_draft-slugs.json` mapping `slug → password` for any post with both `draft: true` and a `password` set.
3. **`functions/_middleware.js`** — a Cloudflare Pages Function that runs on every request. For slugs listed in `_draft-slugs.json`, it requires the correct password either via:
   - Query string: `?password=XXX` (sets a `draft_<slug>` cookie, 24h, then redirects to the clean URL).
   - Cookie from a previous submission.

   Without a valid password, it serves a minimal HTML form with a 401 status.

**Sharing a draft:**

Append `?password=XXX` to the URL once. The reader's browser stores the cookie for 24 hours, so they can navigate around without re-entering it.

**Notes:**

- Posts with `draft: true` but no `password` still build and are reachable by URL — they're just excluded from the sitemap, RSS feed, and listing pages (filter in `astro.config.mjs`). Unlisted, not locked. Add a `password:` only when you want the page gated.
- The cookie is scoped to the slug's path, so sharing one draft doesn't unlock another.
- `_draft-slugs.json` is regenerated on every build, so the production mapping always matches what's currently in `draft+password` state.

## Cloudflare credentials

Scripts that hit Cloudflare's API (`image-manager.mjs`, `generate-nlweb-index.mjs`, `generate-featured-images.mjs`) read `CF_ACCOUNT_ID` and `CF_API_TOKEN` from `.env`. The npm scripts pass `--env-file-if-exists=.env` to Node so nothing needs manual loading.

`.env` is gitignored. `.env.example` shows the expected keys.
