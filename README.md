# vasovagal.github.io

Static multi-page site for the [vasovagal](https://github.com/vasovagal) GitHub organization: [vagus](https://github.com/vasovagal/vagus), [corti](https://github.com/vasovagal/corti), the hybrid-retrieval anatomy, measured field data, and the shared [Homebrew tap](https://github.com/vasovagal/homebrew-tap).

No generator is required. GitHub Pages serves the checked-in HTML, CSS, JavaScript, and images from `main`. The focused routes are `/vagus/`, `/corti/`, `/smart/`, `/rag/`, and `/install/`; the home page stays a short router rather than one large brochure scroller.

## Preview and check

```sh
npm test
npm run serve
# open http://localhost:8080
```

## Refresh Corti screenshots

The screenshot harness lives with Corti so it cannot drift away from the frontend it renders. From the sibling `corti` checkout:

```sh
./screenshots/update_site.py
```

Playwright serves the real React UI, replaces only Tauri IPC with non-personal deterministic fixtures, captures Retina PNGs, and copies them into `assets/screenshots/`. See `corti/screenshots/README.md`.

## Release refresh automation

`releases.json` is the canonical current-release state for the two product surfaces. After a tag-triggered
release finishes successfully, the matching Corti or Vagus workflow checks out this repository with its own
write deploy key and runs:

```sh
scripts/publish-release-update.sh corti 0.14.0 2026-08-24T17:56:37Z
# or
scripts/publish-release-update.sh vagus 0.14.0 2026-09-01T12:00:00Z
```

The updater validates strict `X.Y.Z` versions, refuses downgrades, renders every marked home/product/install
surface plus sitemap dates, runs `npm test`, and pushes `corti bumped to X.Y.Z` or
`vagus bumped to A.B.C`. A rejected push is retried from current `main`, so simultaneous product releases
preserve both bumps. Workflow reruns are no-ops once the version is present.

Each source repository stores a separate `LANDING_PAGE_DEPLOY_KEY`; its public half is a write deploy key on
this repository and grants no access elsewhere. The organization must keep repository deploy keys enabled.
The Homebrew tap remains a separate manual release step.

Screenshot and benchmark refreshes remain manual because a version tag cannot truthfully regenerate those
measurements. The aggregate corpus measurement behind the first version is documented in
[`benchmarks/2026-08-18.md`](benchmarks/2026-08-18.md). The indexing and search profiles on “How so smart?”
are documented separately in [`benchmarks/2026-08-19-timings.md`](benchmarks/2026-08-19-timings.md).
