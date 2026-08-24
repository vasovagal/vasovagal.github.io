#!/usr/bin/env bash
# Apply one product release to the static site and push an idempotent main-branch commit.
# A rejected push means the other product updated concurrently; reset to the new main and re-render.
set -euo pipefail

PRODUCT="${1:-}"
VERSION="${2:-}"
PUBLISHED_AT="${3:-}"

if [[ ! "$PRODUCT" =~ ^(corti|vagus)$ ]] || [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ -z "$PUBLISHED_AT" ]]; then
  echo "usage: $0 <corti|vagus> <X.Y.Z> <published-at>" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

for attempt in 1 2 3 4; do
  git fetch origin main
  git reset --hard origin/main
  git clean -fd

  node scripts/update-release.mjs "$PRODUCT" "$VERSION" "$PUBLISHED_AT"
  npm test

  if git diff --quiet && git diff --cached --quiet; then
    echo "landing page already records $PRODUCT $VERSION"
    exit 0
  fi

  git add releases.json index.html vagus/index.html corti/index.html install/index.html sitemap.xml
  git diff --cached --check
  git commit -m "$PRODUCT bumped to $VERSION"
  if git push origin HEAD:main; then
    exit 0
  fi

  echo "landing page moved during attempt $attempt; re-rendering on current main" >&2
  sleep $((attempt * 2))
done

echo "failed to publish $PRODUCT $VERSION after concurrent-update retries" >&2
exit 1
