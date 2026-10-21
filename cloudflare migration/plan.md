# Cabinet — Cloudflare migration: implementation plan (for approval)

**Date:** 2026-10-22 · **Author:** Claude Code · **Status:** proposal **v2** (owner decisions D1–D10 recorded at the end), for Codex review.
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

## Owner decisions needed

| # | Topic | Proposal |
| --- | --- | --- |
| **D1** | Build placement (audit §5) | **Cloudflare builds directly** (as Bookshelf/FFFX). All six sources are public, so the build clones them anonymously and no credential is needed. GitHub Actions stays only during the overlap, running the same script. If a source ever goes private, decide then: a scoped read-only token as a Cloudflare build secret, or moving that build to Actions |
| **D2** | External revisions (audit §2) | **Pin every mount to an exact commit SHA**: a new `revision` column in `content/external-repos.tsv`. The build fetches exactly that commit, so the same Cabinet commit always gives the same site, and rollbacks are real. A helper (`npm run update-externals`) resolves each repository's current tip and rewrites the pins and inventories (D3) for review and commit. **An external change appears on the site only after its pin is updated and pushed**; nothing updates silently |
| **D3** | Mount publication (audit §3) | **Global exclusions + a committed per-mount inventory.** Global: dotfiles, `*.md`, `*.bak`, `*.map`, `*.js__`, `documentation/`, `node_modules/`, `.github/`, and archives (`*.zip`, `*.7z`) unless a mount allows them. Per mount, `content/external-inventory/<id>.txt` lists every published path. The build **fails if the filtered mount differs from its inventory**, so any new file in an external repository needs a reviewed commit. A hand-written `publish.txt` for 296 student-work files would be unmaintainable; the generated inventory gives the same explicitness |
| D3a | `LICENSE` files in mounts | **Keep** (licence notices; harmless) |
| D3b | Tracery `_TraceryTrials.zip`/`.7z`, `fonts-preview.html`, `app.js__` | **Drop** (not linked: development leftovers) |
| D3c | Working with AI `README.md`/`DOCUMENTATION.md` | **Drop** (not linked) |
| **D4** | Archive and downloads | Keep the archive, minus `README.md`, `cabinet-index.md.bak`, v2 `DESIGN-SYSTEM.md`/`LANDING-PAGE-NOTES.md` and the v1 `*.map` files. **Keep** the linked v1 `files/deploy.yml.txt` and `requirements.txt`. **Drop** the unlinked `docs/_downloads/` copies (or keep them, if you link them somewhere) |
| D5 | Theme `*.map`, `sitemap.xml.gz` | Drop, as on Bookshelf and FFFX |
| **D6** | `site_url` | **Add `site_url: https://cabinetofcuriosities.in/`.** The sitemap gains its URLs (now empty), and every page gains a canonical link. That changes every HTML page's bytes, so it is a deliberate content change, compared before and after. The validator then takes the domain from `site_url`, not `docs/CNAME`. Alternative: keep it absent (an empty sitemap, as now) |
| **D7** | Self-domain nav | Make the 10 full-domain nav links **root-relative** (`/teaching/…`), and port the Bookshelf validator fixes (`/` resolves to `index.html`; root-relative nav recognised), with a test per target |
| D8 | Worker name | `cabinet-of-curiosities` (temporary `cabinet-of-curiosities.jesmehta.workers.dev`). `www` is handled at cutover (a Custom Domain is exact-host; `www` → apex needs a redirect rule). That is a later, separate plan |
| **D9** | Your uncommitted work | Commit it (as you see fit) **before** implementation starts, or keep it aside. The build script builds the working tree, so uncommitted pages would appear in local builds. This work never stages it |
| D10 | Local external cache | The build may reuse `_external/<id>` **only if** it is already at the pinned SHA (no network). Otherwise it fetches. This allows offline local rebuilds once fetched (audit §2) |

## Proposed changes (Cabinet repository)

| # | File | Change |
| --- | --- | --- |
| C1 | `tools/build-site.mjs` (new) | The single build, ported from Bookshelf/FFFX: guard → generated-content check (cabinet + now) → `mkdocs build --strict` (`.venv`, `SOURCE_DATE_EPOCH`) → drop `*.map`/`sitemap.xml.gz` → **external mounts (C2)** → **archive (C4)** → route validation → publication check → manifest. The redirect pages are normalised to LF so Windows and Linux builds match |
| C2 | `tools/assemble-external.js` → `tools/external-mounts.mjs` (new), plus `content/external-repos.tsv` (`revision` column) | Fetch each pinned SHA (`git init` + `fetch --depth 1 origin <sha>`, `core.autocrlf=false`, `core.longpaths=true`, prompts off, no credentials); verify the resolved SHA; copy the (sub)folder through the D3 filter; compare with `content/external-inventory/<id>.txt`; keep the existing required-file/content checks and MkDocs-collision refusal. **One fetch per repository**, not per row (SSD is fetched once, not three times). D10 cache. The old script is retired; the editor's external-manifest page keeps working with the new column |
| C3 | `tools/update-externals.mjs` (new) | Owner command: resolve tips, update pins, regenerate inventories, print a diff summary (new/removed files per mount) |
| C4 | Archive policy | `archived-landing-pages/` copied through an explicit exclusion list (D4) |
| C5 | `mkdocs.yml`, `tools/validate-deployment.js` | D6 `site_url`; D7 root-relative nav; validator fixes and tests; validator domain from `site_url` |
| C6 | `wrangler.jsonc`, `package.json` + lock, `requirements-lock.txt`, `.gitignore` | As FFFX: assets-only `./public`, `404-page`, `workers_dev: true`, `preview_urls: false`; Wrangler 4.149.0; the lock from a clean venv (48 packages above); ignore `public/`, `releases/`, `_external/`, `.venv/` … The `landing-v3` package stays separate and untouched |
| C7 | `tools/save-artifact.mjs`, `verify-artifact.mjs`, `manifest.mjs` | Ported. `SOURCE.txt` also records **every external pin**, so a release fully identifies its inputs |
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
   **D10 cache build equals the network build**.
3. **Equivalence with live:** the new artifact equals the baseline minus the excluded files (listed exactly), plus
   the D6/D7 changes, which are compared and explained page by page.
4. **Rejections:** an unpinned row; a SHA that does not resolve; a mount file not in the inventory; an inventory file
   missing from the mount; an excluded type reaching `public/`; a destination collision; a path escape; a missing
   required file; stale generated content; `docs/index.md`. Each must fail the build, and runners exit nonzero.
5. **HTTP on `wrangler dev`, then `workers.dev`:** every file byte-identical; routes; FFFX redirects; negative URLs
   (every excluded file, repository internals, editors); real 404 page.
6. **Behaviour:** browser comparison against live, with fixed random seeds as on FFFX: landing map, dragons and
   compass, Now, lightbox, every mount's app (including SSD games with audio, Swatch Fields' mosaic and polar grid,
   Tracery bots), archive pages, external links.
7. **Authoring**, in a disposable clone with no global MkDocs: Cabinet editor, Now editor, external-manifest editing
   with the new column, admin generation and MkDocs check through the launcher, sitemap button with sibling clones,
   `update-externals`, then the full build. Landing build/promote with an installed browser.
8. **Cloudflare:** the owner creates the Worker (with the Git-App pre-check); byte check against a local build;
   watch paths (docs-only skip, runtime deploy); rollback and saved-artifact restore; an independent static server
   serving a saved release.
9. **Domain** (separate plan and approval): apex + `www`, after FFFX closes.

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

## Owner decisions (2026-10-22) and v2 changes

**Status: v2.** The decisions below supersede the D-table proposals above where they differ.

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
2. Codex review of plan v2.
3. Then implementation with local commits only. No push before the owner approves.
