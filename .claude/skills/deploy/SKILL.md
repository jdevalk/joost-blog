---
name: deploy
description: "Deploy the joost-blog site. Regenerates the NLWeb search index (including embeddings), commits changes, and pushes to trigger a Cloudflare Pages deploy."
user_invocable: true
---

# Deploy

Deploys the joost-blog site to Cloudflare Pages.

## What it does

1. Regenerates the NLWeb search index (`scripts/generate-nlweb-index.mjs`)
   - Scans all blog posts, pages, and videos
   - Skips draft content
   - Generates embeddings for new/changed content via Cloudflare API
   - Uses cached embeddings for unchanged content
2. Stages the updated index files
3. Commits with a descriptive message
4. Pushes to origin, triggering the Cloudflare Pages deploy

## Steps

1. Run `node scripts/generate-nlweb-index.mjs` and show the output to the user
2. Check if any generated files changed with `git diff --quiet src/generated/`
3. If changed, stage: `git add src/generated/nlweb-index.json src/generated/nlweb-index.mjs src/generated/embedding-cache.json`
4. Run `git status` to show the user what will be deployed
5. Ask the user for a commit message (suggest one based on what changed)
6. Commit and push to origin
7. Confirm the deploy was triggered

## Notes

- The `CF_API_TOKEN` and `CF_ACCOUNT_ID` environment variables must be available for embedding generation. The script has fallback defaults baked in.
- The prebuild step was removed from package.json — the index must be regenerated locally before deploying.
- If only code changes (no content changes), the index regeneration will show "0 to generate" and the cached index is reused.
