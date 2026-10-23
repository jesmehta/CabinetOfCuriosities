# Cabinet — Cloudflare migration: implementation report (for Codex post-implementation review)

**Date:** 2026-10-23 · **Author:** Claude Code · **Plan:** [plan.md](plan.md) v3.1 (Codex C3: GO for bounded
implementation and local tests). **Source reviewed should be:** local `main` at the commit that adds this report
(implementation code up to `aabc4dc`, plus records). **Updated after Codex C4** (HOLD, I1–I4): code fixes `c59b0c1`
(I1), `0ea749b` (I2), `c5f31c9` (I3), tests `7b0bab2`, docs `0579a35`; the rows for tests 2, 4, 4b, 6 and 6s and
the new "Functional scenarios not yet asserted" section reflect them. Response: R5. **Nothing in this work has been pushed** after `93aef2a`; no
Worker exists; GitHub Pages still serves the live site from `93aef2a`'s tree (built by the old `deploy.yml`).
Detailed chronology: [migration-log.md](migration-log.md). Responses to reviews: [claude-code-responses.md](claude-code-responses.md).

## What changed (plan items → commits)

| Plan | Change | Commits |
| --- | --- | --- |
| C2 | External mounts from pinned Git trees: bare blob-less cache per repository (`_external/git/`), fetch per (repository, revision), bytes read with `git cat-file` from the pinned tree, `GIT_NO_LAZY_FETCH` outside the explicit fetches, `--offline`, `--external-local` (development); `revision` column; allowlists | `d63809f`, `5cf2167`, `e2d1a1a`, `7469b72` |
| D3 / step 2 | Allowlists reviewed: only what each page loads (owner rule). SSD 296 → 266 files; Swatch Fields 316 (both image sets used); others unchanged | `3bc0ae6` |
| C1 | `tools/build-site.mjs`: guard, generated-content check, mkdocs `--strict`, image guard, tidy (`*.map`, `sitemap.xml.gz`, `CNAME`, redirect pages to LF), mounts, archive, sitemap, route validation, publication check, `build-info.json` + manifest outside `public/` | `ced80d0`, `85a1935`, `d9759ff` |
| C4 / D4 | Archive through `content/archive-allowlist.txt` (159 of 168 files); unlinked `docs/_downloads/` removed | `ced80d0`, `fd735d0` |
| C5 / D6 / D7 | `site_url`; 10 nav links root-relative; validator: domain from `site_url`, `/` resolves, root-relative nav checked (ported from Bookshelf) | `7dfb57d` |
| Sitemap rule | MkDocs pages + `/` + each mount's entry and first-level pages; noindex/foreign-canonical skipped; archive excluded; dedup, XML escape, deterministic; every URL must resolve | `85a1935` |
| C3 | `tools/update-externals.mjs`: new pins + NEW/MISSING/CHANGED/REMOVED report; `--check`; never edits allowlists | `5c86d45` |
| C6 | `wrangler.jsonc` (`cabinet-of-curiosities`), `package.json` + lock (Wrangler 4.149.0), `requirements-lock.txt`, `.gitignore` | `5e0a7e5`, `0732cf3` |
| C7 | `save-artifact` / `verify-artifact` (+ `tools/build-info.mjs`): refuse development builds, unpinned mounts, missing provenance; `npm run deploy` = fresh pinned build + `wrangler deploy` | `56cef9f` |
| C8 | `deploy.yml` runs `tools/build-site.mjs` with the lock (temporary); `tools/assemble-external.js` retired | `9a4f2ae` |
| C9 | Four launchers: `cd /d "%~dp0"`, activate `.venv` | `be4aee4` |
| C10 | `DEPLOYMENT.md` runbook; README deploy section | `76ec000` |
| C11 | Records, evidence, test scripts | `5656072`, `99e9498`, `5c74e11`, `aabc4dc`, logs |

## Tests (plan v3.1 test table) — all on clean clones of committed commits, never the working tree

| # | Test | Result | Evidence (`evidence/`) |
| --- | --- | --- | --- |
| 1 | Baseline | 2026-10-22 scratch build; see the selectolax finding below for what it missed | `scratch-build-baseline-*` |
| 2 | Determinism: `autocrlf` true (cold cache, network), same clone warm `--offline`, `autocrlf` false (copied cache, `--offline`) | **3 identical manifests** (`6f956b70…`), identical provenance (all identity fields, count, digest); cold build 34 s, warm 12 s, cache 80 MB. After C4 the provenance check fails the runner: an injected one-revision mismatch makes it **exit 1** | `repro-0579a35.txt`, `repro-injected-provenance-mismatch-0579a35.txt` (earlier: `repro-aabc4dc.txt`) |
| 3 | Equivalence: step 1 (no D6/D7) vs baseline; step 2 (D6/D7) vs step 1; final vs **today's live site** | step 1: 1,022 identical, 93 approved removals, 2 redirect pages now = live. Step 2: 44 changed, **0 unexplained lines**. Final vs live: **980/1,024 identical**; 44 = 42 canonical pages + `404.html` + `sitemap.xml`; 4 remaining lines are the known About-page parser difference and the site-map page's new timestamp | `compare-step1-*`, `compare-step2-*`, `compare-final-vs-live-20261023.txt` |
| 4 | Rejections (mounts, pins, allowlists, cache, archive, guards, publication check, sitemap) | **48 passed, 0 failed**, 2 skipped (code review); after C4 incl. destination traversal (nothing written outside), unsafe id, case-folded nesting. Validator: `path-safety-tests.mjs` **18/18** (17 unsafe values rejected, committed TSV valid) | `reject-tests-7b0bab2.txt`, `path-safety-tests-7b0bab2.txt` (earlier: `reject-tests-aabc4dc.txt`) |
| 4b | Development boundary and recovery provenance (after C4: suite assertions) | `artifact-tests.sh`: **25 passed** — pinned build saves/verifies; a `--external-local` build is marked DEVELOPMENT and save refuses it; verify refuses 16 malformed-provenance variants of a checksum-valid release (development flag, missing/short source commit, empty/truncated/edited externals incl. self-consistent rewrites caught against the release's own source-commit TSV, wrong file counts) plus a missing record and a tampered file; save refuses an edited or stale `public/`. (Before C4 this row cited the step-4 smoke test in the migration log, implementer-observed) | `artifact-tests-7b0bab2.txt` |
| 4c | Sitemap | 100 URLs, canonical host only, each resolves (build) and serves 200 (HTTP check), archive absent | `sitemap-20261023.xml`, HTTP checks |
| 5 | HTTP on `wrangler dev` | **1,024/1,024 byte-identical**; 21 routes; 100/100 sitemap URLs 200; **125/125 never-published paths 404** with the nearest `404.html` | `http-check-wrangler-dev-aabc4dc.txt` |
| 5r | Saved release restored on an independent static server (Python) | `save-artifact` + `verify-artifact` OK; same HTTP check passes | `http-check-restored-release-python-server.txt` |
| 6 | Behaviour vs live: **broad smoke coverage** (Playwright, fixed `Math.random`, desktop + mobile, 19 routes) | Equal status, text, links, element counts on all 40 views; **one functional assertion: the gallery lightbox opens**. Differences, all artifacts: the analytics beacon is CORS-blocked on `127.0.0.1`; one link `#` normalised differently; the animated landing map's layout hash (it flips between viewports across runs; the landing files are byte-identical to live). **Not asserted (Codex C4 I4):** see "Functional scenarios not yet asserted" below | `ui-live-20261023.json`, `ui-wrangler-dev-aabc4dc.json` |
| 6s | Request capture (every mount page + image pages; three generic canvas clicks, fixed keys, waits) on the final build | 99 pages, 882 same-origin requests: **no published file missing among the requests exercised**. Only failures: the known `#`-named SSD sound and a pre-existing `extra.css` background-image path (404 on live too). `/x/index.html` → 307 to `/x/` on Cloudflare (host difference). Page errors: the two known ones. This is loading coverage, not proof that each game/tool workflow works | `browser-capture-final-aabc4dc.*` |
| 7 | Authoring via launchers in a disposable clone, no global Python/MkDocs on PATH | **25 passed, 0 failed**: negative control; admin MkDocs check, content generation (reproduces committed files), site map with sibling clones; Cabinet editor add/edit/regenerate/build/delete; Now editor; `update-externals` report on an older pin, `--check` writes nothing, restore; builds | `cms-test-aabc4dc.txt` |
| 7l | Landing `build-static` + `promote` (Playwright 1.62.1) in a disposable clone | reproduces every committed file; zero browser errors | `landing-build-promote-aabc4dc.txt` |
| — | Partial-clone experiment | all acceptance criteria met | `partial-clone-experiment-20261023.txt` |

**Runners exit nonzero on failure** (seen: the first rejection run had 3 test-design failures and exited 1).

## Functional scenarios not yet asserted (Codex C4 I4)

The browser evidence above proves pages and their requested files load; it does not assert workflows. Not yet
asserted, to be done as named checks on the temporary workers.dev preview (before the domain gate):
- SSD games: a level change or score change after input; audio actually playing after the unlock gesture.
- Swatch Fields: mosaic built from a sample image and its PNG/CSV exports; polar grid render and hover preview.
- Tracery bots: a generated text appears and changes on regenerate (both bots).
- Landing map: dragons/compass interactions; Now page sections; Working with AI navigation between lessons;
  Prompt Generator and Oblique Strategies producing output; archive pages' own navigation.
- Pre-existing failures (the `#` sound, the `extra.css` image, Tracery's removed/absent links, Prompt Generator's
  console error) are expected, not regressions.

## Findings during implementation

1. **selectolax 1.0.1 made `mkdocs-glightbox` drop every image** from the MkDocs pages: 112 images on 6 pages
   (About, Now, Fab23 Bhutan, Mini Loom, Papier-mâché, Dot Mandala). The 2026-10-22 baseline *and the live site*
   had none of them; the live site regained them only because the push of `19b167c`…`93aef2a` made GitHub Actions
   rebuild with the unpinned 1.0.2. Fixed by pinning 1.0.2 (`0732cf3`) and a build guard (`d9759ff`: Markdown
   has images but the output has none → fail; proven against 1.0.1). Consequence for the earlier comparisons: the
   step-1/step-2 "identical to baseline" claims were identical to an image-less baseline; the final comparison
   against today's live site supersedes them. `evidence/selectolax-images-20261023.txt`.
2. **Partial clone trap:** any size query (`ls-tree -l`) downloads every blob; hence `GIT_NO_LAZY_FETCH`.
3. **Cloudflare host differences:** `/x/index.html` redirects (307) to `/x/` (GitHub Pages served it directly; links to `index.html` still work, via one redirect). And Cloudflare's 404 handling serves the nearest `404.html`: under `/archived-landing-pages/v1/` that is the
   archived v1 page, not the site's (GitHub Pages always used the root one). Recorded; status is still 404.
4. Pre-existing site issues, in the ToDo one list: `#`-named SSD sound (404 on live), Tracery `future-bots/` and
   `_TraceryTrials` links, Swatch Fields landing links, Prompt Generator `module is not defined`, two SSD projects
   not in their gallery (owner to check), About-page malformed tag.

## Accepted exceptions and limits (stated, not hidden)

- The three Tracery `_TraceryTrials` links 404 (owner-accepted, D3b+); `future-bots/` 404s on live too.
- Not testable here: a listed symlink on this Windows account; repository symlinks, submodules, `.gitattributes`,
  LFS pointers (no such source exists): code review only.
- A hand-typed `wrangler deploy` of a development `public/` bypasses the wrappers (runbook says never).
- Offline: a warm cache builds without network; deployment always needs network; a saved release needs none.
- Cloudflare-side gates are **not** done: Worker creation (Git-App pre-check), build on Cloudflare's Linux image,
  watch paths (docs skip / `docs/` deploys), workers.dev checks, rollback, saved-artifact restore via Wrangler,
  private-source build, apex + `www` cutover (separate plan).
- The first push will also change the **live GitHub Pages** site (the overlap workflow runs the new build): the
  differences are exactly the ones in test 3 (removals, canonical links, nav form, sitemap).

## Requested next

Codex post-implementation review of this code and evidence; then owner approval for the first push and the Worker.
