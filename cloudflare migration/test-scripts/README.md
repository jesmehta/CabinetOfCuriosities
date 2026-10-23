# Cabinet migration test scripts

Run from the repository root. Bash scripts need Git Bash (Windows) or a POSIX shell. They work on disposable clean
clones of the **committed** HEAD (never the working tree, so the owner's uncommitted files stay out) and exit
nonzero on any failed assertion. `PLAYWRIGHT_MODULE` points to Playwright's `index.mjs` (here
`C:/Users/Jesal/AppData/Local/claude-tools/playwright/node_modules/playwright/index.mjs`). In Git Bash, pass URL
paths to Node with `MSYS_NO_PATHCONV=1`, or Git Bash rewrites `/teaching/…` into a Windows path.

| Script | Needs | Usage and what it checks |
| --- | --- | --- |
| `reject-tests.sh` | bash, `.venv`, network once | Plan tests 4/4b: pins (unpinned, short, unknown, offline), destinations, two revisions of one repository, every allowlist rule, letter case, cache identity and offline, an edited working copy never published, `--external-local`, archive allowlist, guards, collisions, publication check, `site_url` |
| `repro.sh` | bash, `.venv`, network | Plan test 2: `autocrlf` true (cold cache, network) = same clone warm `--offline` = `autocrlf` false (copied cache, `--offline`) |
| `cms-test.sh` | bash, Windows `cmd`, Python, network | Plan test 7: disposable clone + fresh `.venv` + sibling clones of FFFX and Bookshelf; launchers with no global Python/MkDocs on PATH; admin (MkDocs check, generation, site map), Cabinet editor (add/edit/regenerate/delete), Now editor, `update-externals` on an older pin; builds |
| `http-check.mjs` | Node ≥ 22, a server | `node … <url> <label> <public-dir> [--expect-404-page]`: every file byte-identical, routes, every sitemap URL 200, removed files and internals 404 (nearest `404.html`). `HTTP_CHECK_CONCURRENCY=1` for `python -m http.server` |
| `ui-snapshot.mjs` | Playwright | `node … <url> <label> <out.json> [shotDir]`: 19 routes × desktop/mobile with fixed `Math.random`: status, text hash, links (self-domain as paths), element counts, layout hash, errors, lightbox |
| `capture-requests.mjs` | Playwright | `node … <url> <out.json> <page-path>…`: opens each page, clicks/keys/waits, records every same-origin request and page error (allowlist completeness, scenario coverage) |
| `reach-analysis.mjs` | Node | Allowlist candidates by source inspection from an entry page |
| `compare-manifests.mjs`, `classify-d6d7.mjs`, `compare-live.mjs` | Node | Every difference between two builds, or a build and the live site; every changed line classified |
| `partial-clone-experiment.mjs` | Node, network | The partial-clone experiment (evidence `partial-clone-experiment-20261023.txt`) |
