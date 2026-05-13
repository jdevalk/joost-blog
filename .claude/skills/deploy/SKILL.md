---
name: deploy
description: "Deploy the joost-blog site. Regenerates the NLWeb search index (including embeddings), commits changes, and pushes to trigger a Cloudflare Pages deploy."
user_invocable: true
---

# Deploy

Deploys the joost-blog site to Cloudflare Pages.

## What it does

1. Fetches YouTube transcripts for any new videos (`scripts/fetch-transcripts.mjs`)
   - Uses cached transcripts when the file already exists
   - Requires `yt-dlp` on PATH (install via `brew install yt-dlp`)
2. Regenerates the NLWeb search index (`scripts/generate-nlweb-index.mjs`)
   - Scans all blog posts, pages, and videos
   - Skips draft content
   - Appends each video's transcript to its search body
   - Generates embeddings for new/changed content via Cloudflare API
   - Uses cached embeddings for unchanged content
3. Stages the updated index + any new transcript files
4. Commits with a descriptive message
5. Pushes to origin, triggering the Cloudflare Pages deploy

## Steps

1. Run `node scripts/fetch-transcripts.mjs` and show the output to the user
2. Run `node --env-file-if-exists=.env scripts/generate-nlweb-index.mjs` and show the output
3. Check what changed under `src/generated/` with `git status --short src/generated/`
4. Stage: `git add src/generated/nlweb-index.json src/generated/nlweb-index.mjs src/generated/embedding-cache.json src/generated/transcripts/` (plus any other staged content the user is shipping)
5. Run `git status` to show the user what will be deployed
6. Ask the user for a commit message (suggest one based on what changed)
7. Commit and push to origin
8. Confirm the deploy was triggered

## Notes

- The `CF_API_TOKEN` and `CF_ACCOUNT_ID` environment variables must be available for embedding generation; they live in `.env`. Pass `--env-file-if-exists=.env` to Node so the script picks them up.
- The prebuild step was removed from package.json — the index must be regenerated locally before deploying.
- If only code changes (no content changes), the index regeneration will show "0 to generate" and the cached index is reused.
- `fetch-transcripts.mjs` is a no-op for videos that already have a cached transcript, so it's safe to run on every deploy.
