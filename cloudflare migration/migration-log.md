# Cabinet — Cloudflare migration log

Append-only. Times in IST (tool UTC + 5:30 or git author time). Plan: [plan.md](plan.md) (v3.1). Reviews:
[codex-reviews.md](codex-reviews.md); responses: [claude-code-responses.md](claude-code-responses.md).
All implementation commits are **local only** until a Codex post-implementation review and owner approval.
The owner's uncommitted work (`cabinet-material.css`, `scratchNotes.md`, `docs/_images/paper2025_26/`,
`docs/teaching/paper2025.md`) is never staged.

## Implementation step 1: external-mount fetcher — 2026-10-23 ~01:30–02:15 IST

- `5e013db` plan v3.1 after Codex C2 (relayed in chat): GO for bounded implementation and local tests.
- **Partial-clone experiment** (`evidence/partial-clone-experiment-20261023.txt`): a bare, blob-less shallow fetch of
  the pinned commit plus one batched fetch of only the listed blobs. All acceptance criteria met: 52.9 MB instead of
  107 MB for one SSD year; bytes identical to a full fetch; newly listed paths at the same SHA fetchable later; warm
  cache reads offline. **Trap found:** any size query (`ls-tree -l`) lazily downloads every blob, so all git calls
  except the explicit fetches run with `GIT_NO_LAZY_FETCH=1`. The partial clone is adopted; the simple full fetch is
  not needed as a fallback so far.
- `d63809f` `revision` column in `content/external-repos.tsv` (pins from `evidence/external-revisions-20261022.txt`).
- `5cf2167` `tools/allowlist.mjs` and `tools/external-mounts.mjs`, plus **candidate** allowlists (bootstrapped from
  the pinned trees minus D3 categories; marked not yet reviewed). Comments in allowlists start a line only:
  a student file is named `Kawaii Ringtones #6.mp3`.
- `5656072` evidence: online and `--offline` outputs identical; **674 mount files byte-identical to the baseline**;
  46 omitted = exactly the approved D3b/D3b+/D3c removals (`evidence/mounts-vs-baseline-20261023.txt`).
- Not yet wired into a build: `tools/build-site.mjs` is step 3. `assemble-external.js` still serves `deploy.yml`.
- **Next:** step 2 allowlist review (needs the owner for the student folders and Swatch Fields' two image sets),
  step 3 the build script and archive allowlist, then rejection tests in a disposable clone.

## Reviews recorded; allowlist syntax back to FFFX's — 2026-10-23 ~08:20 IST

- `0dbee6d` Codex C2 and C3 committed unedited (C3: GO for v3.1; implementation not yet reviewed). Response R4.
- Owner: rename files instead of edge-case rules. `tools/allowlist.mjs` uses FFFX's syntax again (`#` comments
  anywhere). `Kawaii Ringtones #6.mp3` (SSD 2024-25) is left out until renamed upstream: its sound is already broken
  on the live site (fragment URL, 404). ToDo in `documentation/toDo - website.md`.
- Re-ran `node tools/external-mounts.mjs --offline` after the change: 8 mounts assembled.
- Step 2 scope (owner): SSD and Swatch Fields publish only what each page loads.

## Steps 2 and 3: allowlists reviewed, build script, archive, site_url, nav, sitemap — 2026-10-23 ~08:30–10:00 IST

**Step 2, allowlists (owner rule: only what the page loads).**
- Method 1, source inspection (`test-scripts/reach-analysis.mjs`): follows src/href, script string literals
  (resolved against the loading page) and CSS url() from each entry page. Libraries are reached but not mined.
- Swatch Fields: the static pass cannot see lookup-driven names, so it was checked by hand: both `imagesSuperCrop/`
  (tiles) and `imagesBordered/` (hover previews) are loaded for all 152 `swatch_lookup.json` filenames. All 316 kept.
- SSD: 296 → 266 files. Removed: unused assets, duplicate libraries, and the two 2024-25 projects not in that year's
  gallery (`Arpita_Dhanawade/`, `anaya_raul/`). Other mounts unchanged. `3bc0ae6`.
- An earlier suspicion was wrong and is withdrawn: `Dhruvi_Assignment_2` loads `girll.jpg`, which exists (`girl.jpg`
  is the unused copy).
- Method 2, browser capture (`test-scripts/capture-requests.mjs`; `evidence/browser-capture-20261023.*`): 91 pages
  (every HTML page of every mount, clicked, keyed, waited) on a full candidate build. **No published page requested
  a file the lists leave out**; the only misses are the two unlisted projects, opened directly. Confirmed: the
  `Kawaii Ringtones #6.mp3` request is cut at `#` (404) and p5 reports the sound never loaded. Pre-existing script
  error on Prompt Generator (`module is not defined`). Method 3 (scenario play-through) remains for the test round.
- Issues found are in the ToDo one list (Tracery `future-bots/` link, Swatch Fields landing links, the unlisted SSD
  projects, Prompt Generator error, FFFX thumbnail).

**Step 3, build.**
- `fd735d0` removes the unlinked `docs/_downloads/` copies (D4). `ced80d0` `tools/build-site.mjs` (C1),
  `tools/manifest.mjs`, `content/archive-allowlist.txt` (C4: 159 of 168 files; the 9 D4/D5 drops).
- **Comparison step 1** (`evidence/compare-step1-filtered-vs-baseline-20261023.txt`), clean clone, no D6/D7:
  1,024 files; **1,022 identical to the baseline**; 0 added; 93 removed, every one approved (D3b/D3b+/D3c/D4/D5,
  step-2 SSD removals, `CNAME`); the 2 changed files are the redirect pages normalised to LF, **now byte-identical to
  live**. `CNAME` is dropped by the build (GitHub Pages only; the Actions deploy does not need it, as on FFFX).
- `7dfb57d` C5: `site_url` (D6), 10 nav links root-relative (D7), validator ported from Bookshelf (domain from
  `site_url`, `/` resolves). **Comparison step 2** (`evidence/compare-step2-d6d7-20261023.txt`): 44 files changed, 0
  added/removed; every changed line classified, **0 unexplained**: 42 pages gain the canonical link (plus one template
  whitespace line each), 430 nav links become root-relative, `404.html` changes in nav links only, `sitemap.xml`
  gains URLs. (That comparison's manifest predates the sitemap step below.)
- `85a1935` sitemap rule: MkDocs' 42 pages + the landing page `/` (not a MkDocs page, so MkDocs omits it) + each
  mount's entry and first-level pages = **100 URLs**, all on `https://cabinetofcuriosities.in/`, every one resolves
  to a published file (checked by the build). `evidence/sitemap-20261023.xml`.
- Builds ran in clean clones with the scratch venv (Python 3.14.6; the lock file is step 4); `--offline` with a
  copied warm cache also passes.
- **Next:** step 4 (launchers, `DEPLOYMENT.md`, release tools with `build-info.json` refusal, `update-externals`,
  locks, `wrangler.jsonc`, `deploy.yml` on the new build), then step 5 tests.

## Step 4: config, release tools, update-externals, launchers, workflow, runbook — 2026-10-23 ~22:00–22:30 IST

- `5e0a7e5` C6: `wrangler.jsonc` (Worker `cabinet-of-curiosities`, assets-only `./public`, `404-page`,
  `workers_dev`, no preview URLs), `package.json` + lock (Wrangler 4.149.0; npm 11 blocked workerd's install script,
  Wrangler runs; `wrangler dev` is tested in step 5), `requirements-lock.txt` (the 48-package freeze of 2026-10-22),
  `.gitignore` (build outputs incl. `build-info.json`, `releases/`, `.venv/`, credentials).
- `56cef9f` C7: `save-artifact`/`verify-artifact` ported; shared `tools/build-info.mjs` refuses development builds,
  unpinned mounts and missing provenance. `npm run deploy` = fresh build (always pinned) + `wrangler deploy`.
- `5c86d45` C3: `update-externals` (pins + NEW/MISSING/CHANGED/REMOVED report; never edits allowlists; `--check`).
  Ran `--check`: all 8 pins current. The report path is tested in step 5 with an older pin.
- `be4aee4` C9: four launchers start from their own folder and activate `.venv`.
- `9a4f2ae` C8: `deploy.yml` runs `tools/build-site.mjs` with the lock (temporary, until the domain moves);
  `tools/assemble-external.js` retired; comments and `BACKEND-AND-DEPLOY.md` (dated superseded note) updated.
- `76ec000` C10: `DEPLOYMENT.md` runbook; README deploy section rewritten (pinned externals).
- (Commits were redone once before this entry: the first C6 commit had swept in the staged deletion of
  `assemble-external.js`; the local commits were reset and recommitted per unit. Nothing had been pushed.)
- Local `.venv` created from the lock: `pip freeze` equals the lock exactly.
- **Smoke test** (clean clone of `76ec000`, `--offline` with a copied warm cache): build 1,024 files; save + verify
  OK; an `--external-local` build is marked DEVELOPMENT and **save refuses it**; a release repackaged as
  development, and one without `BUILD-INFO.json`, are **refused by verify**; no provenance file in `public/`.
- **Next: step 5**, the full test round (determinism incl. `autocrlf` and Linux-like conditions, all rejection
  cases, update-externals report, sitemap, `wrangler dev` HTTP, behaviour vs live incl. scenarios, authoring via the
  launchers in a disposable clone), then Codex post-implementation review.

## Step 5: full test round — 2026-10-23 ~22:30–23:10 IST

Summary and evidence table: [implementation-report.md](implementation-report.md). All on clean clones of committed
commits; final code `aabc4dc` (records after it).
- Rejection suite **44/44** (2 code-review skips); determinism: 3 identical builds (`autocrlf` true cold/network,
  warm offline, `autocrlf` false) `6f956b70…`; authoring via launchers **25/25**; landing build/promote reproduces
  the committed files; `wrangler dev` HTTP: 1,024/1,024 bytes, 100/100 sitemap URLs, 125/125 never-published 404;
  saved release on a Python static server: same; browser vs live: equal on all 40 views apart from local-only
  artifacts; final build vs **today's live site**: 980/1,024 identical, every other changed line explained.
- **Found: selectolax 1.0.1 dropped 112 images on 6 MkDocs pages** (live too, until today's GitHub rebuild with
  1.0.2). `0732cf3` pins 1.0.2; `d9759ff` adds a build guard (proven against 1.0.1). The earlier step-1/2
  comparisons were against an image-less baseline; the final-vs-live comparison supersedes them.
- Scenario capture on the final build: 99 pages, 882 requests, no missing published file; only the known `#` sound
  and a pre-existing `extra.css` background-image path (ToDo). Cloudflare redirects `/x/index.html` → `/x/` (307)
  and serves the nearest `404.html` (archive v1): host differences, recorded.
- Test-design errors fixed along the way (not code defects): a letter-case test hit the required-file check first;
  two publication tests needed network for never-fetched blobs; Git Bash rewrote URL paths (`MSYS_NO_PATHCONV=1`);
  the HTTP check must read every body on Python's server. The first capture run was invalid for that reason and
  was rerun.
- **Next:** Codex post-implementation review of the code and evidence; then owner approval for the first push
  (which also changes the live GitHub Pages output, as described) and the Worker (checklist 19–23).

## Codex C4 (HOLD) and fixes — 2026-10-23 ~23:25–00:05 IST

- `b5ab43c` Codex C4 committed unedited: HOLD first push/Worker pending I1–I3; I4 qualifies the browser evidence.
- Fixes `c59b0c1` (I1 path safety), `0ea749b` (I2 provenance), `c5f31c9` (I3 runner), tests `7b0bab2`, docs
  `0579a35`. Results: path-safety 18/18, artifact suite 25/25, rejection suite 48/48 (2 code-review skips),
  reproducibility pass with full provenance comparison, injected mismatch exits 1. Response R5; report updated.
- Next: Codex focused follow-up review; then owner approval for the first push and the Worker.
