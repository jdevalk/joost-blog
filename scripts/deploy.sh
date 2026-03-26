#!/usr/bin/env bash
set -euo pipefail

echo "==> Regenerating NLWeb index..."
node scripts/generate-nlweb-index.mjs

echo ""
echo "==> Checking for changes..."
if git diff --quiet src/generated/; then
  echo "    No index changes detected."
else
  echo "    Index changed — staging generated files."
  git add src/generated/nlweb-index.json src/generated/nlweb-index.mjs src/generated/embedding-cache.json
fi

# Stage any other tracked changes (content, code, etc.)
STAGED=$(git diff --cached --name-only)
UNSTAGED=$(git diff --name-only)

if [ -z "$STAGED" ] && [ -z "$UNSTAGED" ]; then
  echo "    Nothing to commit or deploy."
  exit 0
fi

echo ""
echo "==> Staged files:"
git diff --cached --stat 2>/dev/null || true

echo ""
read -rp "Commit message (leave empty to skip commit): " MSG

if [ -n "$MSG" ]; then
  git commit -m "$MSG"
fi

echo ""
echo "==> Pushing to origin..."
git push

echo ""
echo "==> Deploy triggered. Cloudflare will build and publish."
