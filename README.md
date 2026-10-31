# vasovagal.github.io

Maintain the static site for [Vagus](https://github.com/vasovagal/vagus),
[Corti](https://github.com/vasovagal/corti), and their shared
[Homebrew tap](https://github.com/vasovagal/homebrew-tap). Preview changes locally,
check links and release markers, then open a pull request.

The site uses checked-in HTML, CSS, JavaScript, and images without a generator.
The home page links to product, retrieval, installation, and historical comparison pages.

## Preview and check

Use Node.js 24 or later and Python 3:

```sh
npm test
npm run serve
# open http://localhost:8080
```

CI runs `npm test`. It checks script syntax, release-state consistency, required copy,
local asset paths, image dimensions, and navigation. Inspect the rendered pages too;
these checks do not prove layout or external-link availability.

## Refresh Corti screenshots

Install the dependencies listed in Corti's
[screenshot guide](https://github.com/vasovagal/corti/blob/main/screenshots/README.md).
From a sibling `corti` checkout, run:

```sh
./screenshots/update_site.py
```

The harness renders Corti's React frontend with synthetic Tauri IPC fixtures and copies
Retina PNGs into this site's `assets/screenshots/`. Review the images before committing.
Use `--site <path>` if the website checkout is elsewhere.

## Release refresh automation

`releases.json` owns the published versions and dates. After validating its public release
assets, each product's tag workflow checks out this site with its own
`LANDING_PAGE_DEPLOY_KEY` and calls the publishing script. Example arguments:

```sh
scripts/publish-release-update.sh corti 0.14.0 2026-08-24T17:56:37Z
# or
scripts/publish-release-update.sh vagus 0.14.0 2026-09-01T12:00:00Z
```

That script is for the disposable workflow checkout: it resets to `origin/main`, removes
untracked files, and pushes to `main`. It accepts strict `X.Y.Z` versions, ignores downgrades,
updates marked home/product/install copy and sitemap dates, and runs `npm test` before
committing `corti bumped to X.Y.Z` or `vagus bumped to X.Y.Z`. Rejected pushes retry from
current `main`, up to four attempts. Identical version/date state produces no commit.

Each product has a separate write deploy key limited to this site repository. Repository
deploy keys must remain enabled. The Homebrew tap is updated separately by the maintainer.

## Keep measurements dated

Release automation does not refresh screenshots, benchmarks, or historical reports.
Preserve their measured versions, dates, and limits; do not present them as current results.
The source records are [the corpus probe](benchmarks/2026-08-18.md) and
[indexing/search timings](benchmarks/2026-08-19-timings.md).
