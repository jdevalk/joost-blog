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

## Package manager

CI installs with `pnpm install --frozen-lockfile`. Use `pnpm install` locally, not `npm install`. Running npm only updates `package-lock.json`, leaving `pnpm-lock.yaml` stale, and the next CI build fails with `ERR_PNPM_OUTDATED_LOCKFILE`. Both lockfiles are currently tracked; `pnpm-lock.yaml` is the authoritative one.

## Publishing a new post

When taking a post out of draft, do all of these in the same change:

1. Remove `draft: true` from the frontmatter.
2. Remove the `password:` field too (it has no effect once `draft` is gone, but leaving it behind is misleading).
3. Update `publishDate` to today's date so the post lands at the top of the archive instead of wherever it was originally drafted.
4. Generate the OG image:

   ```sh
   pnpm generate:og --slug <slug>
   ```

   `scripts/check-src.mjs` runs in the `build` script and fails the build if `public/og/<slug>.webp` is missing for the latest published post. Commit the generated `.webp` alongside the post.

## Markdown alternates

`@jdevalk/astro-seo-graph` is configured with `markdownAlternate: true`, which auto-emits `<link rel="alternate" type="text/markdown">` on every built HTML page. At build-end the integration checks each alternate URL against the build output and warns if the corresponding `.md` file is missing.

When adding a new top-level page or content collection, also add a matching `.md` endpoint, otherwise the build will start warning about stripped markdown alternates. Patterns in use:

- **Content collections** — use `createMarkdownEndpoint` from the integration. See `src/pages/[slug].md.ts` (blog + pages), `src/pages/videos/[slug].md.ts`, `src/pages/code/[slug].md.ts`.
- **Listing or static pages** — hand-rolled `APIRoute` returning a markdown response. See `src/pages/blog.md.ts`, `src/pages/category/[slug].md.ts`, `src/pages/about-me.md.ts`.

A few routes are intentionally skipped (`404`, `drafts`, `search`). Their warnings are expected and don't fail the build.

## Prettier

Format with `pnpm format`; `pnpm format:check` runs as the first step of `pnpm build`, so unformatted code fails CI.

`.prettierignore` excludes two specific `.astro` files (`src/pages/[slug].astro`, `src/pages/videos/[slug].astro`) because `prettier-plugin-astro` 0.14.1 mis-parses their TypeScript frontmatter. Note the gitignore-style escaping (`\[slug\]`) — bracket characters need escaping or they're treated as a glob character class. If a new `.astro` route hits the same parser error, ignore it the same way until the upstream plugin is fixed.

## Cloudflare credentials

Scripts that hit Cloudflare's API (`generate-nlweb-index.mjs`, `generate-featured-images.mjs`) read `CF_ACCOUNT_ID` and `CF_API_TOKEN` from `.env`. The npm scripts pass `--env-file-if-exists=.env` to Node so nothing needs manual loading.

`.env` is gitignored. `.env.example` shows the expected keys.
