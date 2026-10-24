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

## Codex C5: GO for the first push and the temporary Worker — 2026-10-24 ~00:15 IST

- `df5510c` Codex C5 committed unedited: I1–I3 closed; **GO for the owner-approved first push and temporary Worker
  deployment**; domain cutover and privatization still pending; I4 (named functional checks) is a later gate on
  workers.dev.
- C5's recovery qualification: `verify-artifact` needs the release's source commit in a local full clone.
  Documented in `DEPLOYMENT.md` section 4 with a `git bundle` backup recipe, and in the ToDo backup item. To prove in
  the recovery drill: verify an old release after newer commits, with the network unavailable, from a bundle clone.
- Waiting for: owner approval of the first push (tag `pre-cloudflare` first), then the Worker.

## First push (owner-approved) — 2026-10-24 01:07 IST (19:37 UTC)

- **Owner approved the push.** Tag `pre-cloudflare` → `93aef2a` (annotated, pushed), then `main` pushed
  (`93aef2a..a7ed6e0`, 37 commits). GitHub Actions rebuilt the live GitHub Pages site with the new build: live
  `sitemap.xml` went from 0 to 100 URLs at 19:38:50 UTC.
- **Live check** against a local clean build of `a7ed6e0` (`evidence/http-check-live-github-pages-a7ed6e0.txt`):
  **1,023/1,024 files byte-identical**; 21 routes 200; 100/100 sitemap URLs; **125/125 never-published paths 404**
  (every approved removal is gone from live). The one difference is `compass/about/`: the malformed
  `<to do - correct …>` tag, which Python's HTML parser on GitHub's Linux runner reads differently from this
  machine's (the known pre-existing content glitch, ToDo). Worth noting for the Cloudflare comparison: Cloudflare's
  Linux build may match GitHub's here rather than the Windows build.
- Next: owner creates the Worker `cabinet-of-curiosities` (Git-App pre-check on GitHub's side).

## Worker created; first Cloudflare build failed; fix — 2026-10-24 ~01:20–01:45 IST

- **Owner** created Worker `cabinet-of-curiosities` (Git integration). First build `ea36b9be` (19:47 UTC, from
  `a7ed6e0`): environment Python 3.14.8; Cloudflare's automatic `pip install -r requirements.txt` drifted
  `certifi`, `python-dateutil` (3.0.0), `soupsieve`, and the lock install put them back (as designed). Steps 1–3
  passed (112 images; 0 redirect pages needed LF normalisation on Linux). **Step 4 failed:** `git cat-file
  --batch-check` with `GIT_NO_LAZY_FETCH=1` exits fatally on Cloudflare's git ("could not fetch … from promisor
  remote") where git 2.47 prints "missing". Log: `evidence/cloudflare-build-ea36b9be-failed.log`.
- `b59a8f1`: missing blobs are now found with `git rev-list --objects --missing=print` (lists a partial clone's
  missing objects without fetching; git ≥ 2.16); the build log prints the git version. Tested: cold network
  assembly = warm offline assembly, all mount files identical to the live build; rejection suite 48/48
  (`evidence/reject-tests-b59a8f1.txt`).
- The Node warning `MODULE_TYPELESS_PACKAGE_JSON` for `docs/_assets/backend/js/now-markdown.js` appears because
  Cabinet now has a root `package.json` without `"type"`; harmless (Node reparses it as ES module). Not changed:
  setting a type would break either the CommonJS tools or that file.
- Next: push `b59a8f1` (owner approval) so Cloudflare rebuilds; then the byte comparison on workers.dev.

## Second Cloudflare build: build passed, upload 401; Worker renamed — 2026-10-24 ~02:00 IST

- Build `c667e11d` (20:27 UTC, from `1e33e84`): **all 9 build steps passed on Cloudflare** (git 2.43.0, Python
  3.14.8): 1,024 files, 112 images, 100 sitemap URLs — the `rev-list --missing=print` fix works on the build image.
- **Deploy failed:** Wrangler 4.149.0 found 844 unique assets to upload (its "1227 files" count includes folders,
  as FFFX's 126 vs 79), and every upload batch got `401 Unauthorized` after 5 retries. Nothing deployed.
- Also: "Failed to match Worker name": the owner had created the Worker as `cabinetofcuriosities`, the config says
  `cabinet-of-curiosities` (D8). Cloudflare overrode the name and said it would open a pull request on the
  repository. **Owner renamed the Worker to `cabinet-of-curiosities`** (2026-10-24). Any such pull request is to be
  closed unmerged. Log: `evidence/cloudflare-build-c667e11d-deploy-401.log`.
- Next: retry the build (same commit) to see whether the 401 was related to the name mismatch; if it recurs,
  check the build token's permissions.

## Worker deployed: version 2ab6c8b4 — 2026-10-24 02:15 IST (20:45 UTC)

- Owner pressed Retry build after the rename. Build `d650f4d6` (commit `1e33e84`): all 9 steps passed; Wrangler
  uploaded 844 assets (180 already uploaded) in 15.5 s; **Current Version ID `2ab6c8b4-754e-41d3-b9e6-711620e56072`**
  at `https://cabinet-of-curiosities.jesmehta.workers.dev`. The 401 did not recur, so it was evidently caused by the
  Worker-name mismatch. Log: `evidence/cloudflare-build-d650f4d6.log`.
- **HTTP** (`evidence/http-check-workers-dev-2ab6c8b4.txt`) against a local clean build of `1e33e84`: 1,023/1,024
  byte-identical; 21 routes; 100/100 sitemap URLs; 125/125 never-published paths 404 with the nearest `404.html`;
  `Server: cloudflare`. The one difference, `compass/about/`, is the Windows-vs-Linux parser difference of the
  malformed tag: **workers.dev's About page is byte-identical to GitHub Pages'** (both Linux).
- **Cloudflare = GitHub Pages:** the live site vs the same local build differs in exactly the same file
  (`evidence/compare-live-github-pages-vs-1e33e84.txt`; one transient GitHub 503 refetched identical), so both
  hosts serve the same 1,024 files.
- **Browser** (`evidence/ui-workers-dev-2ab6c8b4.json` vs `ui-live-a7ed6e0.json`): 38/40 views identical in status,
  title, text, links, element counts, failed requests, lightbox and errors (analytics-beacon noise excluded); the
  other 2 are the known `#` link-normalisation artifact.
- Still to do on the preview: Git-App banner check and any Cloudflare name PR (owner); build watch paths and the
  two-push proof; named functional checks (Codex I4); rollback and saved-artifact restore (owner-run).

## Build watch paths proved; second version; release for the recovery drill — 2026-10-24 ~07:55–08:05 IST

- Owner: no "disconnected" banner; no name pull request from Cloudflare. Owner set the build watch paths (exclude,
  one entry each): `cloudflare migration/*`, `documentation/*`, `README.md`, `DEPLOYMENT.md`, `WORLD-SYSTEMS.md`.
- **Skip proved:** push of `4e7606d` (records only, all 7 files under `cloudflare migration/`): visible on GitHub,
  **no Cloudflare build** (owner, dashboard).
- **Deploy proved:** push of `7cd5541` + `4e0ec60` (owner-approved real fix: `docs/_assets/material/css/extra.css`
  background-image path, the ToDo item) at 02:27:37 UTC; the new `extra.css` was served by workers.dev at
  02:28:49 UTC. Dot Mandala page now loads `/_images/DotMandala/DMUI-22.jpg` (200; it was a 404 on every host).
  HTTP check vs a local clean build of `4e0ec60`: 1,023/1,024 (the known About-page parser difference), 100/100
  sitemap, 125/125 404 (`evidence/http-check-workers-dev-4e0ec60.txt`). Version ID: to be read from the dashboard.
- Saved release for the drill: `releases/20261024T023115Z_4e0ec60` (clean clone, 1,024 files, no `-dirty`),
  copied into the repository's gitignored `releases/`; `verify-artifact` OK from the real repository.
- Next: owner-run dashboard rollback to `2ab6c8b4`, then the saved-artifact restore via Wrangler.

## Recovery drill: dashboard rollback and saved-artifact restore (owner-run) — 2026-10-24 ~08:00–08:15 IST

- Version built from `4e0ec60` (the `extra.css` fix): **`883108be-f39f-4053-a2cd-a1245b24543f`** (owner).
- **Dashboard rollback** (owner) to `2ab6c8b4`: by 02:34:42 UTC workers.dev served the old `extra.css`
  (`url('../images/…')`; old background path 404 again). HTTP check vs the local build of `1e33e84` (the commit
  `2ab6c8b4` was built from): 1,023/1,024 (the known Windows/Linux About-page difference), 100/100 sitemap,
  125/125 404 (`evidence/http-check-after-rollback-2ab6c8b4.txt`).
- **Saved-artifact restore** (owner, Wrangler 4.149.0, narrow-scope login, then logout):
  `npm run verify-artifact -- releases/20261024T023115Z_4e0ec60` OK (pinned build of `4e0ec60`, clean tree), then
  `npx wrangler deploy --assets releases/…/site --message "restore saved artifact"` → **version
  `49524ba6-8c2a-4ac2-9705-12d8ff014bd4`**; Wrangler uploaded 1 file (the Windows-rendered About page; the other
  1,023 were already stored). HTTP check: **1,024/1,024 byte-identical to the release**, 100/100 sitemap, 125/125
  404 (`evidence/http-check-after-restore-49524ba6.txt`). Dashboard shows `49524ba6` "restore saved artifact"
  (Wrangler) above `883108be` (Build, main).
- Note: the active version is now the Windows-built release (only the About page differs from a Linux build); the
  next deploying push replaces it with a Cloudflare build.
- Recovery drill still to add before the domain gate (Codex C5): verify an old release after newer commits with
  the network off, from a history bundle.
- Next: named functional checks on workers.dev (Codex I4); then the apex/www domain plan.

## History-bundle recovery check (Codex C5 qualification) — 2026-10-24 ~08:20 IST

- `git bundle create … --all` at `f2cffcd`: **86 MB**, one file. A clone made from it, with its remote set to an
  unreachable address, verified the older release `releases/20261024T023115Z_4e0ec60` (source `4e0ec60`, several
  commits behind HEAD): **OK**, 1,024 files, pinned build of `4e0ec60`. No network was used.
- A shallow clone (`--depth 1`) **refuses**, as documented: "cannot read content/external-repos.tsv at the
  release's source commit … Run this from a complete clone that contains that commit."
- So the supported recovery set is: the release folder plus a full clone or a history bundle (`DEPLOYMENT.md`
  section 4). Owner: keep a bundle with the release backups (ToDo backup item).

## Functional checks (Codex I4), domain plan, backups — 2026-10-24 ~08:30–09:30 IST

- `275f1b8` `test-scripts/functional-checks.mjs`: 54 named checks run on workers.dev and live, compared. **53 equal
  and passing on both; `Prachi_Khobragade` blank on both** (pre-existing: the `#` sound stops p5's preload — worse
  than a missing sound; ToDo corrected). `Deepika_Pest_Control` failed once on live (slow load), 3/3 reruns pass on
  both. Details in `implementation-report.md`; evidence `functional-*`.
- `941cddd` `domain-plan.md` (apex + `www`): Custom Domain for the apex, proxied `www` with a 301 redirect rule
  preserving path and query, and zone-wide **Always Use HTTPS** — found: Bookshelf and FFFX answer plain HTTP (200)
  since the move (GitHub Pages redirected); ToDo. For Codex review together with `b59a8f1` and the preview evidence.
- Owner: zipped and backed up the Cabinet, Bookshelf and FFFX releases, and made Cabinet's history bundle.

## Always Use HTTPS on (domain plan step 0) — 2026-10-24

- Owner turned on SSL/TLS → Edge Certificates → **Always Use HTTPS** for the zone (HSTS left off).
- Checked (`evidence/always-use-https-20261024.txt`): `http://` on Bookshelf and FFFX → **301** to `https://`, path
  and query kept (also for an unknown path); `https://` pages 200; apex and `www` (still GitHub Pages) unchanged;
  workers.dev (not in the zone) unaffected. Fixes the plain-HTTP regression on Bookshelf and FFFX since their move.

## Codex C6/C7; corrections; preflight started — 2026-10-24 ~09:00–09:20 IST

- `75ef15d` Codex C6 (fetch fix and preview/recovery accepted; **conditional GO** for Phase C after explicit,
  recorded preflight gates; Pages retirement/privatization held) and C7 (step 0 accepted) committed unedited.
- **Correction (C6):** the upload 401 disappeared after the Worker rename and a retry; that is a **correlation, the
  cause is not isolated** (the "evidently caused" wording in the deployment entry above is superseded).
- **Correction (C6):** the first retained functional comparison is **52 equal and passing, 2 not** (Deepika failed on
  the live reference only; Prachi fails on both). The Deepika reruns were not saved at the time. A fresh full run on
  both hosts with saved transcripts is running (`evidence/functional-*-rerun-20261024.*`). SSD checks assert canvas
  presence and drawing; audio counts start/play calls (not audibility); canvas change is only noted.
- `functional-checks.mjs`: host mode now exits 1 on failures; both modes take `FC_KNOWN_FAIL` for known
  pre-existing breaks (counted only if identical on both hosts).
- Recorded bundle drill transcript: `test-scripts/bundle-drill.sh`, `evidence/bundle-drill-20261024.txt` (bundle
  clone with an unreachable remote verifies the release; shallow clone refuses).
- Implementation report status rewritten (done vs pending); domain plan v2 with C6's preflight gates G1–G5 and
  stop/rollback conditions; step 0 marked done.
- **Preflight G1 (public part): passed** (`evidence/domain-preflight-g1-20261024.txt`): apex only A ×4, TTL 300, no
  AAAA/CAA/TXT; `www` CNAME → `jesmehta.github.io`, TTL 300; Bookshelf/FFFX untouched; GitHub Pages healthy and bound.
- **Fresh functional run (saved transcripts, `FC_KNOWN_FAIL=Prachi_Khobragade`):** live 54 checks, 1 failed (known);
  workers.dev 54 checks, 1 failed (known); compare: **53 equal and passing, 1 known pre-existing failure identical on
  both, 0 not**; all three runs exit 0 (`evidence/functional-{live,workers-dev,compare}-rerun-20261024.*`).
  Deepika_Pest_Control passed on both this time; the earlier live failure was a one-off.
