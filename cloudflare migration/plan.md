# Cabinet — Cloudflare migration: implementation plan (for approval)

**Date:** 2026-10-22 (v3.1: 2026-10-23) · **Author:** Claude Code · **Status:** **v3.1**, revised after Codex C1 and the C2 corrections (archive allowlist, watch-path wording). **The tables and the "v3 additions" section are operative.** The "Owner decisions (2026-10-22)" section at the end is a **historical record of v2**; where it differs, the operative text wins.
Nothing in Cabinet's application files is changed; only this folder (plan + evidence).
**Inputs:**
- Codex [`audit.md`](audit.md) (reviewed at `33788af`; GO for a bounded plan and local experiments, NO-GO for
  cutover).
- [World-assembly decisions](../documentation/cloudflare%20migration/world-assembly-decisions.md), the notes,
  checklist and transition register.
- The Bookshelf and FFFX migrations, the proven reference implementations: `TheBookshelfOfCuriosities/tools/build-site.mjs`
  and `form-follows-fx/tools/build-site.mjs` + `publication-policy.mjs`.

## Facts checked for this plan (2026-10-22 00:5x IST; scratch clone of `6300dfa`, repository untouched)

- **The current pipeline runs locally**, with the `deploy.yml` steps replicated and a fresh venv from `requirements.txt`
  (MkDocs 1.6.1, Material 9.7.7, glightbox 0.5.2, redirects 1.2.2, section-index 0.3.10; 48 packages):
  - Generated content is current; `mkdocs build --strict` passes; all 8 mounts assemble; the archive copies.
  - The validator checks 21 entries, 4 sections, 10 nav targets and 18 doc-body links.
  - **Result: 1,117 files, 166 MB.** Largest file 6.7 MB (`index.html`); 0 files over 25 MiB.
  - Per-area sizes: SSD teaching mounts 93 MB (296 files), `_images/` 20 MB, Swatch Fields 18.5 MB (316 files),
    Tracery Bots 13.6 MB, archive 10.3 MB. These are within the Workers static-asset limits (20,000 files,
    25 MiB/file); the final check is on the real filtered artifact.
  - Evidence: `evidence/scratch-build-baseline-20261022.txt`, `scratch-build-baseline-manifest.sha256`,
    `scratch-venv-pip-freeze.txt`.
- **All six external repositories are public** (anonymous `git ls-remote` with credential prompts disabled). Their
  revisions at build time are in `evidence/external-revisions-20261022.txt`.
- **The baseline reproduces the live site: 1,113 of 1,117 files are byte-identical** to
  `https://cabinetofcuriosities.in` (`evidence/baseline-vs-live-autocrlf-false.txt`). The 4 differences:
  - `sitemap.xml.gz`: compressor bytes, the known zlib difference.
  - The two `mkdocs-redirects` pages (`fffx/PackingShapes/`, `fffx/VeraMolnarRetrospective/`): **Python writes CRLF
    on Windows**, LF on Linux.
  - `compass/about/`: one character inside a malformed `<to do - correct …>` tag in that page's Markdown source, which
    the two Python/parser versions read differently. This is a pre-existing content glitch.
- **Two Windows-only build problems found:**
  - The external repositories have no `.gitattributes`, so Git on Windows (`core.autocrlf=true`) converts their text
    files to CRLF. That gave **278 differences** (`baseline-vs-live-autocrlf-true.txt`).
  - `SSD_Student_Work` fails to check out under a long folder path (Windows 260-character limit).
  - Both are fixed by cloning with `core.autocrlf=false` and `core.longpaths=true`.
- **The live `sitemap.xml` is empty** (0 URLs), because `mkdocs.yml` has no `site_url`.
- **10 nav links use the full domain** (`https://cabinetofcuriosities.in/teaching/…`, `/swatch-fields/`,
  `/tracery-bots/…`). On a preview address they lead to the live site. The validator reads `docs/CNAME` to recognise
  them, resolves nothing for `/`, and only recognises full-domain nav links (audit §1).
- **Published but not needed, or not linked** (no reference from any page or script):
  - The 4 theme `*.map` files and `sitemap.xml.gz`.
  - Archive: `archived-landing-pages/README.md`, `cabinet-index.md.bak`, v2 `DESIGN-SYSTEM.md` and
    `LANDING-PAGE-NOTES.md` (mentioned in page comments, never linked), and 4 v1 `*.map` files.
  - `docs/_downloads/deploy.yml.txt` and `requirements.txt`: unlinked copies of the v1 files.
  - Mounts: `.gitignore` (Tracery, Working with AI), `.nojekyll` (Tracery), `working-with-ai/coding-with-ai/README.md`
    and `working-with-ai/DOCUMENTATION.md`, Tracery `_TraceryTrials/_TraceryTrials.zip` (1.8 MB) and `.7z`
    (0.6 MB), two `app.js__` files, and `fonts-preview.html`.
  - **Linked, so intentional:** `archived-landing-pages/v1/files/deploy.yml.txt` and `requirements.txt` (from the v1
    site-notes page).
  - `LICENSE` files in four mounts: not linked, but licence notices.
- **Authoring stays local:**
  - `admin-controls.js` (5959) runs `python` and `mkdocs` from PATH.
  - The editors are on 5858 and 5757.
  - All 4 `.bat` launchers hard-code `cd F:\__SnowCrash\__WebPages\CabinetOfCuriosities\`.
  - `landing-v3` (Playwright 1.62.1, build/promote) is not part of the deployment and stays so.
- **Uncommitted owner work** in Cabinet: `cabinet-material.css`, `scratchNotes.md`, `docs/_images/paper2025_26/`,
  `docs/teaching/paper2025.md`. It is never staged by this work. Every test uses clean clones.

## Decisions (all decided by the owner, 2026-10-22)

| # | Topic | Proposal |
| --- | --- | --- |
| **D1** | Build placement (audit §5) | **Cloudflare builds directly** (as Bookshelf/FFFX). All six sources are public, so the build clones them anonymously and no credential is needed. GitHub Actions stays only during the overlap, running the same script. If a source ever goes private, decide then: a scoped read-only token as a Cloudflare build secret, or moving that build to Actions |
| **D2** | External revisions (audit §2) | **Pin every mount to an exact commit SHA**: a new `revision` column in `content/external-repos.tsv`. The build fetches exactly that commit, so the same Cabinet commit always gives the same site, and rollbacks are real. `npm run update-externals` (C3) updates the pins and **reports allowlist candidates for review**; it never widens an allowlist itself. **An external change appears on the site only after its pin is updated and pushed**; nothing updates silently |
| **D3** | Mount publication (audit §3) | **Decided (owner): an explicit allowlist per mount; unlisted files are left out and reported, never a failure.** Rule (D3++): publish only what a visitor sees or needs to run the page. `content/external-allowlists/<id>.txt` lists files one by one, the same syntax and checks as `publish.txt`. A **missing listed file fails** the build (a page would break). Policy errors stay **fatal**: absent or malformed list, absolute path, `..`, wildcard, directory entry, a listed symlink or non-regular file, destination collision. **Explicit exceptions** to the D3++ wording are listed as such: the `LICENSE` notices (D3a) and the archive's two linked v1 downloads (D4) |
| D3a | `LICENSE` files in mounts | **Keep** (licence notices; harmless) |
| D3b | Tracery `_TraceryTrials.zip`/`.7z`, `fonts-preview.html`, `app.js__` | **Drop** (not linked: development leftovers) |
| D3c | Working with AI `README.md`/`DOCUMENTATION.md` | **Drop** (not linked) |
| **D4** | Archive and downloads | **The archive gets its own frozen allowlist** (`content/archive-allowlist.txt`), under the same rules as the mounts (C4). It leaves out `README.md`, `cabinet-index.md.bak`, v2 `DESIGN-SYSTEM.md`/`LANDING-PAGE-NOTES.md` and the v1 `*.map` files, and **lists** the linked v1 `files/deploy.yml.txt` and `requirements.txt` as explicit exceptions. **Drop** the unlinked `docs/_downloads/` copies |
| D5 | Theme `*.map`, `sitemap.xml.gz` | Drop, as on Bookshelf and FFFX |
| **D6** | `site_url` | **Add `site_url: https://cabinetofcuriosities.in/`.** The sitemap gains its URLs (now empty), and pages gain a canonical link. Every HTML page's bytes change, so the comparison is two-step and every difference is enumerated (v3 additions). The validator then takes the domain from `site_url`, not `docs/CNAME` |
| **D7** | Self-domain nav | Make the 10 full-domain nav links **root-relative** (`/teaching/…`), and port the Bookshelf validator fixes (`/` resolves to `index.html`; root-relative nav recognised), with a test per target |
| D8 | Worker name | `cabinet-of-curiosities` (temporary `cabinet-of-curiosities.jesmehta.workers.dev`). `www` is handled at cutover (a Custom Domain is exact-host; `www` → apex needs a redirect rule). That is a later, separate plan |
| **D9** | Owner's uncommitted work | **Stays uncommitted and unpushed** (owner). This work never stages it. Tests and evidence use clean clones at recorded commits only; a working-tree build may contain it and is never evidence |
| D10 | Local external cache | Approved, as redefined in v3 (cache trust): `_external/` caches **Git objects**; published bytes come from the pinned commit's tree; a warmed cache builds offline, otherwise the build fetches or fails clearly. Plus the `--external-local` development override (v3 additions, development builds) |

## Proposed changes (Cabinet repository)

| # | File | Change |
| --- | --- | --- |
| C1 | `tools/build-site.mjs` (new) | The single build, ported from Bookshelf/FFFX: guard → generated-content check (cabinet + now) → `mkdocs build --strict` (`.venv`, `SOURCE_DATE_EPOCH`) → drop `*.map`/`sitemap.xml.gz` → **external mounts (C2)** → **archive (C4)** → route validation → publication check → manifest. The redirect pages are normalised to LF so Windows and Linux builds match |
| C2 | `tools/assemble-external.js` → `tools/external-mounts.mjs` (new), `content/external-repos.tsv` (`revision` column), `content/external-allowlists/<id>.txt` (new) | For each distinct **(repository, revision)** pair: fetch exactly that commit (no credentials, prompts off, `core.autocrlf=false`, `core.longpaths=true`). Rows sharing a repository **and** revision share one fetch; rows with different revisions are fetched separately, never merged. Verify the resolved commit. Then, for each row, publish **only its allowlist**, reading every listed file's bytes **from the pinned commit's tree (`git cat-file`/`git archive`), never from a working copy**, so a locally edited cached file can never be published under the pinned SHA (C1 I2). Keep the required-file/content checks and the MkDocs-collision refusal. Report unlisted files per mount. The old script is retired; the editor's external-manifest page keeps working with the new column |
| C3 | `tools/update-externals.mjs` (new) | Owner command: resolve each repository's current tip, update the pins, and print a **review report** per mount: files newly present (allowlist **candidates**), listed files now missing, and changed listed files. It **never adds anything to an allowlist by itself**: approving candidates is a separate, explicit edit (later an admin-page action, ToDo) |
| C4 | Archive policy, `content/archive-allowlist.txt` (new) | `archived-landing-pages/` is published **only through its frozen allowlist** (D4), with the same checks as a mount allowlist: unlisted files are left out and reported; a **missing listed file fails**; an absent or malformed list, absolute path, `..`, wildcard, directory entry, listed symlink or non-regular file, and a destination collision are **fatal**. The archive is Cabinet's own content, so it is read from the Cabinet tree being built |
| C5 | `mkdocs.yml`, `tools/validate-deployment.js` | D6 `site_url`; D7 root-relative nav; validator fixes and tests; validator domain from `site_url` |
| C6 | `wrangler.jsonc`, `package.json` + lock, `requirements-lock.txt`, `.gitignore` | As FFFX: assets-only `./public`, `404-page`, `workers_dev: true`, `preview_urls: false`; Wrangler 4.149.0; the lock from a clean venv (48 packages above); ignore `public/`, `releases/`, `_external/`, `.venv/` … The `landing-v3` package stays separate and untouched |
| C7 | `tools/save-artifact.mjs`, `verify-artifact.mjs`, `manifest.mjs`; `build-info.json` outside `public/` | Ported. Every build writes `build-info.json` **next to, not inside, `public/`** (never served): source commit, dirty flag, every external `(repository, revision)`, and whether any `--external-local` override was used. `save-artifact` copies it into the release and **refuses** development builds; `verify-artifact` **refuses** a release whose `build-info.json` is missing or marks a development build. `npm run deploy` always runs a fresh **pinned** build first, so it can never deploy a development `public/` (C1 I1) |
| C8 | `.github/workflows/deploy.yml` | Runs `node tools/build-site.mjs` with the lock (overlap only; retired later) |
| C9 | 4 `.bat` launchers | `cd /d "%~dp0"`; activate `.venv`, so the admin dashboard's `python`/`mkdocs` and the "MkDocs check" use the pinned environment |
| C10 | `DEPLOYMENT.md` (new), `README.md` | Runbook: build, preview, editors, update externals, deploy, restore, other hosts, the Git-App pre-check (checklist §5) |
| C11 | `cloudflare migration/` | This plan, then the report, log, responses, evidence, test scripts |

**Not changed:** TSV schemas (except the new `revision` column), editor/admin UIs and routes, landing-v3 and its
promote step, MkDocs content/theme (except D6/D7), external repositories, the sitemap tool, other worlds.

## Tests

1. **Baseline:** done (above). Plus screenshots and functional records of the landing page (desktop and mobile),
   compass/dragons, Now, a gallery lightbox, teaching hub, each mount's entry page, and the archive.
2. **Determinism:** two builds identical; clean clones (`autocrlf` true/false) identical to the repo build; the
   **warm-cache build equals the network build**, and succeeds with the network unavailable (C1 I2).
3. **Equivalence with live:** the new artifact equals the baseline minus the excluded files (listed exactly), plus
   the D6/D7 changes, which are compared and explained page by page.
4. **Rejections** (must fail, runners exit nonzero): an unpinned row; a revision that does not resolve or whose
   objects are unavailable offline; **a listed file missing** at the pin; an absent or malformed allowlist; an absolute,
   `..`, wildcard or directory entry; a listed symlink or non-regular file; a destination collision; a missing
   required file; stale generated content; `docs/index.md`; **a modified cached file at an unchanged HEAD is not
   published** (the pinned blob is); conflicting revisions for one repository handled as two fetches.
   **The same rejection set for the archive allowlist** (C4): a listed file missing; absent or malformed list;
   absolute, `..`, wildcard or directory entry; listed symlink or non-regular file; destination collision.
   **Must succeed:** an unlisted file present in a mount or in the archive (omitted and reported).
4b. **Development boundary (C1 I1):** an `--external-local` build → `save-artifact` refuses; `npm run deploy`
   rebuilds pinned; `verify-artifact` refuses a deliberately packaged development release; provenance is absent from
   `public/`.
4c. **Sitemap:** the generated `sitemap.xml` follows the sitemap rule below; every URL resolves to intended public
   content on the local server.
5. **HTTP on `wrangler dev`, then `workers.dev`:** every file byte-identical; routes; FFFX redirects; negative URLs
   (every excluded file, repository internals, editors); real 404 page.
6. **Behaviour:** browser comparison against live, with fixed random seeds as on FFFX: landing map, dragons and
   compass, Now, lightbox, every mount's app (including SSD games with audio, Swatch Fields' mosaic and polar grid,
   Tracery bots), archive pages, external links.
7. **Authoring**, in a disposable clone with no global MkDocs: Cabinet editor, Now editor, external-manifest editing
   with the new column, admin generation and MkDocs check through the launcher, sitemap button with sibling clones,
   `update-externals`, then the full build. Landing build/promote with an installed browser.
8. **Cloudflare:** the owner creates the Worker (with the Git-App pre-check); byte check against a local build;
   watch paths: a push changing **only internal documentation** (`cloudflare migration/`, `documentation/`,
   `README.md`, `DEPLOYMENT.md`) is skipped; a push changing **website content under `docs/`** (and, by rule, the TSVs,
   allowlists, pins, locks, scripts and configuration) **deploys**. Both pushes are proved, as on FFFX; rollback and saved-artifact restore; an independent static server
   serving a saved release.
9. **Domain** (separate plan and approval): apex + `www`, after FFFX closes.

## v3 additions after Codex C1

**Development builds (I1).** `--external-local <id>=<path>` exists for previewing changes to an external project.
Such a build is recorded as a development build in `build-info.json` (outside `public/`). The supported routes
refuse it:
- `save-artifact`, `verify-artifact`: refuse.
- `npm run deploy`: always rebuilds pinned.

The documented manual recovery deploy is: `verify-artifact`, then `wrangler deploy --assets releases/<name>/site`.
**Limit:** a raw `wrangler deploy --assets public` by hand bypasses these wrappers. The runbook says so, and says
never to do it.

**Cache trust (I2).** `_external/` is a cache of **Git objects**, not of files.
- Published bytes always come from the pinned commit's tree; a working-copy edit is invisible to the build.
- The cache is checked for the right repository URL. If the pinned commit is not present, it is fetched (or, offline,
  the build fails clearly).
- The build never resets or cleans a checkout it did not create. The owner's own development clones are only
  ever used through `--external-local`.
- **Partial clone plus sparse checkout** (`--filter=blob:none`, fetching only listed blobs) is an **optimisation
  to prove in an experiment**. Acceptance: newly listed paths at the same SHA become available; a warmed cache builds
  offline; bytes and time are measured. If it cannot meet these, the simpler shallow fetch of the pinned commit
  stays.

**Allowlist generation (I3).** Browser capture is one **candidate generator**, used together with:
1. Source inspection: every `loadImage`/`loadSound`/`fetch`/`import`/`<script>`/CSS `url()`, fonts, workers and
   WASM.
2. **Scenario coverage:** SSD games played with audio unlocked by interaction and later levels reached; Swatch
   Fields' modes; Tracery bots generating; archive navigation and the intentional downloads.
3. An **inventory of every source HTML entry**, each classified as public, excluded or redirect. Linked paths are
   reviewed, not published recursively.

Case-sensitive path checks are included (Linux is case-sensitive; Windows is not). The candidate artifact is then
validated by those same scenarios.

**Sitemap rule.** `sitemap.xml` = MkDocs' pages **plus** each mount's public entry page and each SSD student
project page, under the canonical `https://cabinetofcuriosities.in/` (never `workers.dev`). It excludes:
- 404/error pages, redirect stubs, helpers and templates;
- pages marked `noindex` or canonical elsewhere;
- the archive.

It is deduplicated by final URL, uses proper XML escaping, and has deterministic order and dates. It is still plain
XML (D5). It is separate from the human `compass/sitemap` page and its tool, which are unchanged.

**Comparisons (C1).** The D6 effect is an expectation to test, not an assumption. The sequence:
1. Pinned and filtered build without D6/D7, against the baseline: only the approved removals differ.
2. With D6/D7 and the sitemap: **every** difference enumerated and explained.

The retained baseline exceptions are explained and left as they are: the Windows redirect newlines (normalised by
the build) and the malformed About-page markup (content, untouched).

**Accepted exceptions (C1).** The three Tracery index links to `_TraceryTrials` folders will 404. They are recorded
by exact URL as owner-accepted, until the TraceryBots repository is cleaned up (ToDo); the link check reports them as
known exceptions. Owner work (D9) stays uncommitted: tests use clean clones at recorded commits only, and
working-tree builds are never presented as evidence.

## Risks

- **D6 changes every page** (a canonical link): intended, but it makes the "unchanged" comparison two-step (baseline
  → pinned/filtered without D6 → with D6). Planned that way.
- **D3 inventories add a step** to updating an external project (run `update-externals`, review, commit). That is
  the price of never publishing a stray file.
- **Builds fetch about 100 MB** of external repositories. Bookshelf and FFFX builds take about 1.5 min; Cabinet will
  take longer. Measure it against the build limits.
- **Your uncommitted work (D9)** must not leak into tests or commits.
- **Build-time network dependency** on GitHub for the mounts. Recovery uses saved artifacts, which need no network.

## Rollback

Until cutover, GitHub Pages stays live. With C8, it is built by the same script, so its output changes only by the
approved D-items. Every change is an ordinary commit. After cutover: Cloudflare rollback, saved-artifact redeploy,
then the shared-zone runbook.

## Historical: owner decisions (2026-10-22) and the v2 changes

**Historical record, not operative.** This is how v2 recorded the owner's decisions. Some v2 claims here were
superseded by v3 after Codex C1: partial clone is now an experiment, not a commitment (D1); the archive allowlist is
specified in C4; the D6 comparison enumerates every difference rather than expecting only a canonical line; and the
development-build boundary covers save, verify and deploy, not only `save-artifact` (D10). The operative text is the
Decisions and changes tables and the "v3 additions" section above.

| # | Decision | v2 change |
| --- | --- | --- |
| D1 | **Cloudflare builds**, approved | The external fetch is trimmed: a **partial clone** (`--filter=blob:none`) plus **sparse checkout of only the allowlisted paths**, so a build downloads just the files that are published (about 100 MB today, less after D3 and the optimisation pass). Build time is measured; a slow build only delays a new version, and visitors keep the previous one. Alternatives recorded below |
| D2 | **Pinned commits**, approved | Unchanged (owner: development is mostly linear and settles, so updates are occasional) |
| **D3** | **Allowlist per mount; unlisted files are ignored, never a failure** (owner) | Replaces the inventory-equality rule. Each mount has a committed allowlist; **only listed files are published**. Anything else the repository contains, now or later, is left out, and the build only *reports* it. The build fails only if a **listed** file is missing (a page would break). **D3++ rule (owner):** publish nothing the visitor does not see or need: no docs, notes, configs, archives, dotfiles, backups, dev leftovers or backend matter. The first lists are generated by loading every page in a browser and recording every request, plus linked files; then they are reviewed. `update-externals` proposes new files as candidates for approval |
| D3b+ | Tracery `_TraceryTrials` | **Excluded entirely** (owner: not needed on Cloudflare; GitHub keeps it). Consequence: the Tracery Bots index links three trial folders, which will 404 on the new site. Those links should be removed in the TraceryBots repository (ToDo) |
| D4 | Archive, **yes per D3 rules** | The archive gets its own allowlist (frozen snapshot); the D4 drop list stands; the linked v1 downloads stay |
| D5 | Yes | — |
| D6 | **`site_url`, yes** | Two-step comparison: first identical to live without it, then with only the canonical line added |
| — | `sitemap.xml` content (owner) | List the MkDocs pages **and** the other published pages. MkDocs lists only its own pages, so the build **appends** each mount's published HTML pages (entry pages, and for SSD each student project page) to `sitemap.xml`. The archive is left out (historical copies would compete with the live pages in search). **Flagged for discussion** if you want a different scope (e.g. entry pages only, or the archive included) |
| D7 | Yes | — |
| D8 | Yes, `cabinet-of-curiosities` | — |
| D9 | **Stays uncommitted and unpushed** (owner) | Paper 2025–26 photos compacted (7.2 → 1.7 MB, originals in `review/paper2025_26-originals/`). Tests use clean clones only |
| D10 | Approved | Plus a **development override** for iterating on an external project: `npm run build -- --external-local <id>=<path>` builds Cabinet with a local working copy of that repository instead of its pin, to preview changes before committing them. Such a build is marked as a development build in its output and manifest, and `save-artifact` refuses it, so it can never become a release. `npm run preview` then serves it. (`mkdocs serve` shows only the MkDocs pages, never the mounts) |
| — | Optimisation pass | **After migration** (owner). Recorded in `documentation/toDo - website.md`: oversized images, p5.js duplicates, `_TraceryTrials` links, landing coordinates |
| — | Admin tooling | `update-externals` starts as a script; admin buttons and review views come in the round after (ToDo) |

**D1 alternatives considered** (for the record):

| Option | Pros | Cons |
| --- | --- | --- |
| **Cloudflare build** (chosen) | One system; no secrets while sources are public; proven on Bookshelf/FFFX | Downloads externals every build; GitHub must be reachable at build time; build cache not under our control |
| GitHub Actions build, then `wrangler deploy` | Actions can cache `_external/` keyed by the pins (no re-download if unchanged) | A Cloudflare API token stored in GitHub; two systems to keep working; Actions minutes |
| Local build + manual deploy | Full control; uses the local cache; works offline | No automation; a login per deploy; depends on one machine |
| Vendor externals into Cabinet (copies or submodules) | Build needs nothing external | Repository bloat, duplicate storage, manual syncing (submodule support on Cloudflare not verified) |

## Approval requested

1. **D1–D10** decided (above). Open: the `sitemap.xml` scope, if the proposal does not fit.
2. Codex review of plan **v3** (C2: GO for bounded implementation and local tests, with the corrections now in v3.1).
3. Implementation with local commits only, then a Codex post-implementation review. No push before the owner
   approves.
