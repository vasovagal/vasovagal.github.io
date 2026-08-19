# vasovagal.github.io

Static multi-page site for the [vasovagal](https://github.com/vasovagal) GitHub organization: [vagus](https://github.com/vasovagal/vagus), [corti](https://github.com/vasovagal/corti), the retrieval field report, and the shared [Homebrew tap](https://github.com/vasovagal/homebrew-tap).

No generator is required. GitHub Pages serves the checked-in HTML, CSS, JavaScript, and images from `main`. The focused routes are `/vagus/`, `/corti/`, `/rag/`, and `/install/`; the home page stays a short router rather than one large brochure scroller.

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

## Manual release refresh

For now, update this site manually after releases:

1. Pull current `main` in `vagus`, `corti`, and `homebrew-tap`.
2. Confirm both release tags and tap entries, then update version/date references across the HTML pages.
3. Regenerate the Corti screenshots.
4. Re-run the corpus measurements if publishing new benchmark numbers; keep private labels and reports out of this public repository.
5. Run `npm test`, preview desktop/mobile, then commit and push `main`.

The aggregate corpus measurement behind the first version is documented in [`benchmarks/2026-08-18.md`](benchmarks/2026-08-18.md).
