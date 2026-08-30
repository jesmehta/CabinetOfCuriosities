# Backend & Deploy — As-Built Notes

Technical reference for the repo-wide/backend work that doesn't map onto
one page or tool: the current file/folder structure (result of the
2026-08-29/30 reorg), the deploy pipeline, and the launch milestone
scheme. Companion to `conversation-backend-and-deploy.md` (the why) in
this same folder.

Cloudflare Web Analytics and the multi-repo assembly mechanism each
already have their own full technical doc, also in this folder — this
page links to them rather than duplicating:

- [`cloudflare-web-analytics-setup.md`](cloudflare-web-analytics-setup.md)
- [`cabinet-multi-repo-assembly-concept-note-short.md`](cabinet-multi-repo-assembly-concept-note-short.md)
- [`three-world-launch-phases-ToDo.md`](three-world-launch-phases-ToDo.md) / [`three-world-launch-phases-Notes.md`](three-world-launch-phases-Notes.md) — the master to-do tracker and its supporting rationale; this doc summarizes only the reorg/launch-milestone items, the tracker has the full item-by-item history.

## Repo structure, as of the 2026-08-29/30 reorg

Only two `.md` files are root-required: `README.md` (git/GitHub
hosting convention — root is where it renders) and `WORLD-SYSTEMS.md`
(byte-identical across Cabinet/Bookshelf/fffx, so it can't move without
desyncing the other two repos). Everything else that used to sit at
root moved into `documentation/`.

Top-level layout:

- `docs/` — the live MkDocs site + `index.html` (static build,
  promoted from `landing-v3/`).
- `content/` — canonical TSV data sources.
- `tools/` — build/authoring scripts, never shipped to `docs/`.
- `landing-v3/` — the v3 map's dev/build system, regrouped by actual
  import-graph role (not file type) into `dev-tool/` (never ships),
  `layout-engine/` (build-time only), and `shared/` (imported at build
  time and shipped to production).
- `documentation/` — one folder per feature/subsystem with more than
  one doc file (`now/`, `cabinet-editor/`, `landing-v3-notes/`,
  `sitemap/`, `backend-and-deploy/` — this folder); single-file topics
  and repo-wide indexes stay flat at `documentation/` root. See
  `DOCUMENTATION-GUIDE.md` for the standard and `FILE-MANIFEST.md` for
  the exhaustive per-file map.
- `archived-landing-pages/` — frozen `v1/`/`v2/`/`v2-history/`
  `v3-history/`/`algorithm-bench/` snapshots, kept outside `docs/` so
  MkDocs never builds them as live pages.
- `overrides/` — MkDocs Material theme override (`main.html`, injects
  the Cloudflare beacon).
- `review/` — gitignored, screenshot-review working files.

Full move-by-move history (five items, one per reorg step, each with
its own verification gate) is `three-world-launch-phases-ToDo.md`
`#129`–`#134`. The gist: a `pre-file-reorg` git tag was cut as a
rollback point before anything moved; dead v1/v2 code already
byte-identical to the archive was deleted; legacy root files
(`LANDING-PAGE-NOTES.md`, `DESIGN-SYSTEM.md`, the v2 map-source
generator) relocated into `archived-landing-pages/v2/`; `landing-v3/`
internals regrouped by real `import`/`<script src>` graph tracing
(catching a hardcoded Playwright URL that a doc-search-only pass would
have missed); and finally, root-level project documentation gathered
into `documentation/`.

## Deploy pipeline

`.github/workflows/deploy.yml` runs on every push to `main`, two jobs:

1. **`build`** — checks out the repo, installs Python deps, guards
   against `docs/index.md` ever being reintroduced (see
   `WORLD-SYSTEMS.md`'s homepage rule), checks out six external repos
   into `_external/` and assembles them into the build:
   `jesmehta/working-with-ai`, `jesmehta/PromptGenerator`,
   `jesmehta/ObliqueStrategies`, `jesmehta/SSD_CreativeCodingPage` (all
   four into `public/teaching/<name>/`), and `jesmehta/swatchFields`,
   `jesmehta/TraceryBots` (into `public/<name>/` directly, **not**
   under `teaching/` — a different mount point than the other four).
   Each assembled repo has an explicit `test -f`/`grep` sanity check
   before the build proceeds. Runs `mkdocs build --site-dir public`,
   uploads `public/` as the Pages artifact.
2. **`deploy`** — publishes that artifact via `actions/deploy-pages`.
   Has `needs: build`, so a failed `build` means `deploy` never runs
   and GitHub Pages keeps serving the last successful `deploy` —
   structurally all-or-nothing, though not yet empirically confirmed
   against a real failed run (`#58`, still open).

**Not pinned to a SHA**: the external checkouts pull each repo's
current default branch at build time. Pushing to one of them alone
does not update the live site — push a commit here too (anything,
even a doc tweak), or re-run the latest Pages workflow run from the
Actions tab.

Migrated from `peaceiris/actions-gh-pages@v3` to GitHub's first-party
Pages actions (`configure-pages` → `upload-pages-artifact` →
`deploy-pages`), matching Bookshelf/fffx's workflow — `GITHUB_TOKEN`
defaults to read-only now, and the old action's runtime was being
retired. Requires **Settings → Pages → Build and deployment → Source →
"GitHub Actions"** on the repo (one-time, not in the YAML).

As of v3.0 (2026-08-23), deploys to the custom domain
`cabinetofcuriosities.in` via `docs/CNAME`, not the GitHub Pages
project subpath.

## Launch milestone scheme

Two-stage tag scheme, adopted 2026-08-30 to resolve an ambiguity
("we're already launched in some ways... the merge to main would
count as launch... but the about page and a few other essential
backend/frontend things are left"):

- **`launch-beta`** — annotated tag, created 2026-08-30 at `7f3a638`
  (the actual 2026-08-23 merge-to-main commit). Marks: v3 live at
  `cabinetofcuriosities.in`, not yet feature-complete, links not yet
  publicly shared.
- **`launched`** — not yet applied. A future marker for a real-world
  event, not a checklist percentage: applied once Phase 0–2 of
  `three-world-launch-phases-ToDo.md` are done/largely done **and**
  the links are actually being distributed publicly. Can't be
  auto-triggered off item counts.

Full resolution note: `three-world-launch-phases-ToDo.md` `#59`.

## Changelog

### 2026-08-30 — this doc created; `backend-and-deploy/` folder

Consolidates what was previously scattered across `FILE-MANIFEST.md`,
`three-world-launch-phases-ToDo.md`, and `README.md`'s changelog into
one technical reference for the reorg and launch-milestone work
specifically — the two `conversation-backend-and-deploy.md` parts that
had a conversation-log but no technical doc. Cloudflare and multi-repo
assembly already had their own docs and weren't absorbed, just moved
alongside this one and linked. `documentation/backend-and-deploy/` now
holds: this file, `conversation-backend-and-deploy.md`,
`cloudflare-web-analytics-setup.md`, `cloudflare-js-snippet.md`
(gitignored), `three-world-launch-phases-ToDo.md`,
`three-world-launch-phases-Notes.md`, and
`cabinet-multi-repo-assembly-concept-note-short.md` — everything
backend/deploy-scoped except `DOCUMENTATION-GUIDE.md` (about
documentation itself, not backend/deploy) and `FILE-MANIFEST.md` (the
whole-repo index, not backend/deploy-scoped).

### 2026-08-30 — `launch-beta` tag scheme (`#59`)

See "Launch milestone scheme" above.

### 2026-08-29 to 2026-08-30 — file/folder reorganization (`#129`–`#134`)

See "Repo structure" above.

## Todo / watch-out-for

- **`#58`** — failed-build-doesn't-replace-live-deploy is structurally
  sound by construction (`needs: build`) but not empirically confirmed
  against a real failed run. Needs the GitHub Actions tab (or `gh`
  CLI/API access, not available in this environment) to close for
  real.
- **`README.md`'s "Deploy pipeline" section lists only 2 of the 6
  external repos** (`working-with-ai`, `PromptGenerator`) that
  `deploy.yml` actually assembles — stale relative to the real
  workflow file as of this doc's writing. Worth a follow-up pass;
  not fixed here since it's outside this doc's own scope.
- Bookshelf/fffx Cloudflare rollout still open — `#135`/`#136` in
  `three-world-launch-phases-ToDo.md`.
