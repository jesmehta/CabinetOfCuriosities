# The Cabinet of Curiosities

Repo-level practical guide and changelog. Two companion docs, now living
alongside the v2 system they document (see "Structure" below):
[`DESIGN-SYSTEM.md`](archived-landing-pages/v2/DESIGN-SYSTEM.md) (the
map's visual design rules — palette, typography, island/card anatomy) and
[`LANDING-PAGE-NOTES.md`](archived-landing-pages/v2/LANDING-PAGE-NOTES.md)
(implementation notes: archive process, data pipeline, map-regeneration
workflow, known gotchas).
[`WORLD-SYSTEMS.md`](WORLD-SYSTEMS.md) documents the conventions this repo
shares with its sibling Level 1 worlds, [The Bookshelf of
Curiosities](https://github.com/jesmehta/TheBookshelfOfCuriosities) and
[fffx](https://github.com/jesmehta/form-follows-fx). [`NOW-PAGE.md`](documentation/now/NOW-PAGE.md)
documents the `/now` page (`docs/now.md`) — a separate feature from the
map landing page, with its own data pipeline.

Cabinet is the umbrella landing page / web-world index: an illustrated
archipelago map where each major section of Jesal's web presence is an
island, and individual projects/pages are plaques or port-cards on or
around that island. It links out to Bookshelf and fffx (each their own
repo/world) rather than duplicating their content.

## Structure

- `docs/` — MkDocs Material source plus the standalone `index.html` map
  landing page. Other Markdown pages (About, Makings, 3DP, Wild Wild Web,
  etc.) get the normal Material theme/sidebar. There is no `docs/index.md`
  — see "Homepage rule" in `WORLD-SYSTEMS.md` for why that would collide
  with `docs/index.html`.
- **As of v3.0 (2026-08-23), `docs/index.html` is a static build produced
  from `landing-v3/`** (the "archipelago-tool" rebuild — data-driven
  treemap/circle-packing layout, not the hand-authored SVG below) — see
  `documentation/landing-v3-notes/Landing-page-notes.2.0.md` for that system's own full
  documentation, and `documentation/backend-and-deploy/three-world-launch-phases-ToDo.md`
  for how/why it got promoted. Everything in this section and in
  `archived-landing-pages/v2/LANDING-PAGE-NOTES.md`/`DESIGN-SYSTEM.md`
  describes the *previous* (v2) system, kept as-is because it's genuinely
  still true of how that version was built and is preserved, fully
  browsable, in `archived-landing-pages/v2/` — just no longer what serves
  the live page. (2026-08-29: both docs physically moved into
  `archived-landing-pages/v2/` alongside the system they describe,
  content unchanged.)
- `docs/assets/css/cabinet-tokens.css` — single source of truth for the
  parchment/ink palette and type (`--cab-*`), shared between the v3 map
  page's own stylesheet and `docs/stylesheets/cabinet-material.css`
  (maps the same tokens into Material's `--md-*` variables for every
  other page — this part is still live, unrelated to which map version
  serves `/`).
- `docs/assets/js/cabinet-generated-content.js` — auto-generated from the
  TSVs, do not hand-edit — see Data pipeline below. (2026-08-29: the
  superseded v2 files that used to sit alongside it —
  `cabinet-data.js`/`cabinet-render.js`/`cabinet-interactions.js`/
  `docs/assets/css/cabinet-landing.css` — were deleted; unreferenced by
  anything live, and already preserved byte-identical at
  `archived-landing-pages/v2/assets/`.)
- `content/cabinet-sections.tsv`, `content/cabinet-entries.tsv` — the
  actual editable content source (islands and their entries, including
  visual placement columns). Edit these, not the generated JS.
- `tools/build-cabinet-content.js` — parses the two TSVs into
  `docs/assets/js/cabinet-generated-content.js`. Run with
  `node tools/build-cabinet-content.js` after editing either TSV.
- `content/now.tsv`, `tools/build-now-content.js`, `docs/now.md`,
  `docs/assets/js/now-data.js`, `docs/assets/js/now-markdown.js`,
  `docs/assets/css/now.css` — the `/now` page, a real MkDocs Material page
  (wired into `mkdocs.yml`'s nav, same as `docs/sitemap.md`) generated
  directly from `content/now.tsv` + `now-data.js`. See `NOW-PAGE.md` for
  the full design decisions, including why this replaced an earlier
  standalone-HTML approach.
- `tools/now-editor.js` (+ `tools/now-editor-ui/`, launched via
  `run-now-editor.bat`) — a local-only admin server/browser UI for editing
  `now.tsv` entries and `now-data.js` sections without hand-editing either
  file. Never deployed; see `NOW-PAGE.md`'s "Local admin server".
- `tools/admin-controls.js` (+ `tools/admin-controls-ui/`, launched via
  `run-admin-controls.bat`, added 2026-08-30) — a local admin dashboard
  linking every other local tool: start/status for the Cabinet/Now
  editor servers, buttons for build/publish scripts that previously had
  no UI trigger (`build-static.mjs`, `landing-v3/promote.mjs`,
  `generate_sitemap.py`, an `mkdocs build --strict` check), a
  documentation-file index, and a gotchas section. Never deployed.
- `archived-landing-pages/v2/source/` — the one-time island-shape
  generator (`generate-cabinet-map.js`) and its seed config
  (`cabinet-map-source.json`) for the v2 map, kept for reproducibility.
  Authoring-only, never loaded at runtime — see "Map regeneration" in
  `archived-landing-pages/v2/LANDING-PAGE-NOTES.md`. (2026-08-29: moved
  here from root-level `assets/map/source/`, alongside the rest of the
  v2 system it belongs to.)
- `archived-landing-pages/` — the pre-map Cabinet homepage
  (`cabinet-index.md.bak`), kept outside `docs/` so MkDocs never builds it
  as a live page. The pre-rebuild state of `main` is also tagged
  `cabinet-v1-before-map` in git.
- `documentation/` — non-root-required project documentation, organized
  one folder per feature where a feature has more than one doc file
  (2026-08-30, see `DOCUMENTATION-GUIDE.md`): `now/` (`NOW-PAGE.md`,
  `conversation-now-page.md`, and `now-page-helpers/`, the superseded
  pre-code spec); `cabinet-editor/` (`CABINET-EDITOR.md`,
  `conversation-cabinet-editor.md`); `landing-v3-notes/`
  (`Landing-page-notes.2.0.md`, `conversation-landing-page-v3.md`, open
  colour-scheme proposals, `cabinet-v3-config-reference.md` (consolidated
  per-field reasoning for every dev-panel-tunable config value), and
  `conversation-copy-config-resolution.md` (`#32`'s own conversation-log,
  deliberately separate from the visual-polish one) — the v3 map
  system's own documentation); `sitemap/` (`conversation-sitemap.md`, no dedicated
  technical doc yet — see that file's own note); `backend-and-deploy/`
  (`BACKEND-AND-DEPLOY.md` — the file/folder reorg and launch-milestone
  scheme, absorbed rather than split out — plus the larger standalone
  `cloudflare-web-analytics-setup.md` and
  `cabinet-multi-repo-assembly-concept-note-short.md`, the
  `three-world-launch-phases-ToDo.md`/`-Notes.md` tracker, and
  `conversation-backend-and-deploy.md`, the shared conversation-log for
  anything backend/site-wide with no other home); `admin-controls/`
  (`ADMIN-CONTROLS.md`, `conversation-admin-controls.md` — the
  `tools/admin-controls.js` dashboard above; named separately from
  `backend-and-deploy/` to avoid confusion between "the admin dashboard
  tool" and "backend/deploy work in general"). Single-file topics
  stay flat at `documentation/` root: `FILE-MANIFEST.md` (the
  exhaustive per-file role listing), `DOCUMENTATION-GUIDE.md`, and
  `CONTENT-INVENTORY.md` (auto-generated, stays wherever
  `tools/generate_sitemap.py` writes it). Everything here *could* live
  at root but doesn't need to, unlike `README.md`/`WORLD-SYSTEMS.md` — see
  the "Root-level file verdicts" reasoning in git history (2026-08-29) if
  the distinction ever needs re-litigating.
- `mkdocs.yml`, `requirements.txt` — MkDocs config and its Python
  dependencies. `theme.custom_dir: overrides` (2026-08-29) points at
  `overrides/main.html`, which extends MkDocs Material's `base.html` to
  inject the Cloudflare Web Analytics beacon into every generated page —
  see `documentation/backend-and-deploy/cloudflare-web-analytics-setup.md`.
- `.github/workflows/deploy.yml` — the deploy pipeline (see below).

## Running locally

```bash
pip install -r requirements.txt
mkdocs serve
```

Serves at `http://127.0.0.1:8000/` with live reload. `mkdocs build
--site-dir <dir>` produces a static build without serving.

## Editing map content

Most content changes do **not** require touching the SVG map at all:

1. Edit `content/cabinet-sections.tsv` (islands) or
   `content/cabinet-entries.tsv` (plaques/port-cards).
2. Run `node tools/build-cabinet-content.js` to regenerate
   `cabinet-generated-content.js`.
3. `mkdocs serve` and check the result, desktop and mobile.
4. Commit the TSV + generated-content changes together.

See `archived-landing-pages/v2/LANDING-PAGE-NOTES.md` for the full escalation path (when a section
outgrows its island, when a new top-level island is actually needed, and
the full regeneration workflow) and `WORLD-SYSTEMS.md` for the shared data
field conventions (`status`, `weight`, `tags`, etc.) that these TSVs follow.

## Deploy pipeline

`deploy.yml` runs on every push to `main`:

1. **`build`** — checks out the repo, installs Python deps, guards against
   `docs/index.md` ever being reintroduced (see `WORLD-SYSTEMS.md`'s
   homepage rule), checks out external repos (`jesmehta/working-with-ai`,
   `jesmehta/PromptGenerator`) into `_external/` and copies each into its
   `public/teaching/<name>/` slot, runs `mkdocs build --site-dir public`,
   uploads `public/` as the Pages artifact.
2. **`deploy`** — publishes that artifact via `actions/deploy-pages`.

**Multi-repo assembly gotcha**: the external checkouts above pull whatever
is currently on those repos' default branch at build time — they are not
pinned to a SHA. That means pushing to `working-with-ai` or `PromptGenerator`
alone does **not** update the live site; this workflow only triggers on a
push to *this* repo's `main`. To pick up a change made in one of the
external repos, either push a commit here (anything, even a doc tweak like
this one) or re-run the latest "Deploy MkDocs to GitHub Pages" workflow run
from the Actions tab — the re-run re-fetches the external repos fresh since
the checkout step has no pinned ref. See `.github/workflows/deploy.yml`'s
"Multi-repo assembly" comment block for the copy-this-pattern how-to when
adding another external repo.

Migrated from `peaceiris/actions-gh-pages@v3` to GitHub's first-party
Pages actions (`configure-pages` → `upload-pages-artifact` →
`deploy-pages`) to match Bookshelf/fffx's current workflow — see their
READMEs for why (`GITHUB_TOKEN` defaults to read-only now, and the old
action's runtime was being retired). This requires **Settings → Pages →
Build and deployment → Source → "GitHub Actions"** to be set on the repo
(one-time, not in the YAML).

As of v3.0 (2026-08-23), Cabinet has a real `docs/CNAME` file
(`cabinetofcuriosities.in`) and deploys to that custom domain, not the
GitHub Pages project subpath. This is a change from earlier versions of
this doc: `main` had independently picked up CNAME handling for a
`peaceiris/actions-gh-pages`-based deploy back on 2026-08-14, which got
lost in translation when `landing-v3-prototype` (already on the
first-party `deploy-pages` mechanism below, which has no equivalent
`cname:` workflow parameter) was merged in — caught and fixed as
`docs/CNAME` before that merge landed, not after. Every internal link
in the TSVs is still path-relative with no leading slash (`about/`, not
`/about/`) regardless — that convention doesn't depend on which domain
serves the site, see `WORLD-SYSTEMS.md`'s note on `href` safety.

## Changelog

### Copy config reworked: full state export/import, colours/fonts moved into JS (#32, 2026-08-30)

The v3 dev panel's "Copy config" button used to export only
`v3Config.island`, leaving six other live-tunable state pools
(`flow`/`particles`/`geo`/`themePreview`/`pack.centerBias`/theme colours)
with no way back into source at all. Now exports everything the panel
can live-edit, applied back via a new `apply-config.mjs`
(`landing-v3/`) that edits `cabinet-v3-data.js` per-key rather than as a
whole-block paste, preserving the file's own extensive inline reasoning
comments. Theme colours and fonts — previously CSS-only, with zero JS
representation — moved into `v3Config.colors`/`v3Config.fonts`, applied
at load via a new shared `applyThemeStyle()` so production picks them up
too, not just the dev tool; the dev panel gained per-theme font-picker
dropdowns alongside its existing colour swatches. See
`documentation/landing-v3-notes/Landing-page-notes.2.0.md`'s `v3.7.69`
entry for the full mechanism and two real bugs caught in testing before
either reached the real file, `cabinet-v3-config-reference.md` for what
every tunable field actually does, and
`conversation-copy-config-resolution.md` for the design conversation
behind the scoping decisions.

### `backend-home.js` renamed to `admin-controls.js` (2026-08-30)

Too easily confused with the new `documentation/backend-and-deploy/`
folder above, added the same day. Renamed throughout: the script, its
UI folder, the launcher `.bat`, the `CABINET_ADMIN_PORT` override env
var (was `CABINET_HOME_PORT`), and its doc folder
(`documentation/admin-controls/`, `ADMIN-CONTROLS.md`,
`conversation-admin-controls.md`). Port (`5959`) and the `/admin/` URL
path are unchanged. See `ADMIN-CONTROLS.md`'s own `v1.4` changelog
entry for the full list.

### `backend-and-deploy/` folder; `BACKEND-AND-DEPLOY.md` technical doc (2026-08-30)

New `documentation/backend-and-deploy/` folder groups every
backend/deploy/site-wide doc together: `conversation-backend-and-deploy.md`,
`cloudflare-web-analytics-setup.md`,
`cabinet-multi-repo-assembly-concept-note-short.md`, and the
`three-world-launch-phases-ToDo.md`/`-Notes.md` tracker (moved out of
`landing-v3-notes/`, where they'd landed as collateral from an earlier
batched move — they're repo-wide, not v3-specific). New
`BACKEND-AND-DEPLOY.md`: the technical reference the reorg and
launch-milestone work never had, absorbing what was scattered across
`FILE-MANIFEST.md`, the to-do tracker, and this changelog; links out to
the two larger docs (Cloudflare, multi-repo assembly) rather than
absorbing them.

### `admin-controls.js` dashboard; `promote.mjs` automates docs/ promotion (2026-08-30)

`tools/admin-controls.js` (`run-admin-controls.bat`, port 5959): a local
admin dashboard linking every other local tool and script — see
"Structure" above. `landing-v3/promote.mjs`: automates the previously-
manual `docs/` promotion step (copy + dev-relative asset-path rewrite +
headless-Chromium verify), closing a real gap `Landing-page-notes.2.0.md`
documents — a shipped bug from doing this step by hand. Kept separate
from `build-static.mjs`, which is also run standalone while iterating.

### Real `h2`/`h3` heading outline for the map's sections/entries (#70, 2026-08-30)

Section/island labels on the v3 map are SVG `<text>`, not real HTML
headings — invisible to screen-reader heading navigation and, per best
practice (unverified locally — no feedback loop for actual search
impact), weaker for SEO than a real tag. Rather than restructure the
visual labels themselves, added a parallel, visually-hidden HTML layer
(`renderSemanticOutline()` in `cabinet-v3-layout.js`, one real `h2` per
section and `h3` per entry, built from the same data the SVG map
already reads) alongside them. Deliberately scoped down from the
original plan after direct feedback during design: no `aria-hidden`/
`aria-labelledby` de-duplication wiring (screen readers aren't the
current priority for this highly visual map), WIP entries included
without exception. See
`documentation/landing-v3-notes/Landing-page-notes.2.0.md`'s `v3.7.68`
entry for the full mechanism and rejected alternatives,
`conversation-landing-page-v3.md` for the design discussion that cut
the scope down from the initial proposal.

### Launch milestone scheme: `launch-beta` tag (#59, 2026-08-30)

Two-stage naming resolved for what "launched" actually means: the site
has been live at `cabinetofcuriosities.in` since the v3 merge, but
essentials (About page, colophon writing) were still open, so calling
that "launched" would overclaim. `launch-beta` (annotated git tag,
created 2026-08-30, pointing at the actual 2026-08-23 merge commit) —
live, functional, not yet feature-complete, links not yet publicly
shared. `launched` — a future marker, applied once Phase 0-2 are done
or largely done AND links are actually being distributed publicly, a
real-world event rather than a checklist percentage. See
`documentation/backend-and-deploy/three-world-launch-phases-ToDo.md`'s
`#59` entry.

### Content Inventory auto-generated instead of hand-maintained (#126, 2026-08-30)

`tools/generate_sitemap.py` extended with a second, local-only job:
cross-referencing `content/cabinet-*.tsv` against `mkdocs.yml`'s own nav
tree, writing `documentation/CONTENT-INVENTORY.md`. Replaces the old
hand-maintained Content Inventory table in the ToDo tracker, which had
already gone stale twice by the time it was replaced. First run
immediately caught two genuine duplicate hrefs and fixed a real
staleness bug in `docs/sitemap.md` itself. See
`documentation/sitemap/SITEMAP.md` for the mechanism (and two claims
about it later corrected after a direct code review — see that file's
own `v1.2`/`v1.3` changelog entries), `conversation-sitemap.md` for the
design reasoning.

### Cabinet TSV editor — local admin server (2026-08-29 to 2026-08-30)

`tools/cabinet-editor.js` (`run-cabinet-editor.bat`, port 5858) added:
same architecture as `tools/now-editor.js` — a shared TSV parse/
serialize/validate module (`tools/cabinet-tsv.js`) feeding both
`build-cabinet-content.js` and a local admin server/browser UI for
`content/cabinet-sections.tsv`/`cabinet-entries.tsv`, replacing an
earlier throwaway HTML sketch. Not a clean pass throughout: v1.1 trimmed
several unread v2-era schema columns, then v1.2 had to partially reverse
that after checking `WORLD-SYSTEMS.md` directly rather than trusting a
grep of the current renderer alone — `location`/`relatedLinks` turned
out to be standard fields the whole Cabinet/Bookshelf/fffx ecosystem
shares, not dead Cabinet-only columns. v1.3-v1.5 added sortable/
resizable columns, a text expand/compact toggle, and fixed real UI bugs
(numeric-column clipping, a resize drag misfiring as a sort) found
through actual use. See `documentation/cabinet-editor/CABINET-EDITOR.md`
for full design decisions and the complete changelog,
`conversation-cabinet-editor.md` for the design reasoning and the
schema-correction story.

### Cloudflare Web Analytics — MkDocs + landing page beacon (2026-08-29)

Added tracking for Cabinet, per `documentation/backend-and-deploy/cloudflare-web-analytics-setup.md`.
Two injection points, both one-place-covers-everything rather than
per-page: `mkdocs.yml` gained `theme.custom_dir: overrides`, and the new
`overrides/main.html` extends Material's `base.html` `extrahead` block
so every `docs/*.md` page inherits the beacon automatically. The
standalone `docs/index.html` landing page isn't MkDocs-templated, so it
needed its own copy — added to `landing-v3/index.template.html` (the
hand-edited source, survives the next `build-static.mjs` + promote
cycle) and, the same day, directly to the already-promoted
`docs/index.html` too, so tracking went live without forcing a full
Playwright rebuild for a one-line addition. Verified with a local
`mkdocs build`: beacon present in every built page, zero build errors.
Bookshelf/fffx and the externally-assembled repos (Working with AI,
Prompt Generator, Swatch Fields, Tracery Bots, etc.) still need their
own rollout — tracked as `three-world-launch-phases-ToDo.md`
items #135/#136. **Same-day follow-up**: `archived-landing-pages/`
(frozen v1/v2/v2-history/v3-history/algorithm-bench snapshots) initially
missed, despite being genuinely deployed and Colophon-linked — added to
all 28 HTML files there too, scripted, pure addition with no
visual/behavioural change.

### Cabinet file/folder reorganization + documentation-folder move (2026-08-29)

Five-phase reorg (`#129`-`#134`), planned and approved before any file
moved ("Dont execute" was the explicit instruction for the first pass):
confirmed-dead v1/v2 code removed from `docs/assets/`, legacy files
relocated into the archive tree, `landing-v3/`'s own internals regrouped
by actual role (traced via real `import`/`<script src>` graphs, which
caught two real load-bearing bugs a doc-mention grep would have missed),
loose untracked files cleared. Same day, a follow-up pass gathered every
root-level project doc — plus `landing-v3/`'s own four documentation
files — into `documentation/` (`landing-v3-notes/` for the latter),
tracked as real numbered items with before/after mappings rather than
left as silent commits. `FILE-MANIFEST.md` (new) is the resulting
exhaustive per-file map. Reorganized again 2026-08-30 into one folder
per feature (`now/`, `cabinet-editor/`, `landing-v3-notes/`, `sitemap/`)
— see `DOCUMENTATION-GUIDE.md`. See
`documentation/backend-and-deploy/three-world-launch-phases-ToDo.md`'s
`#129`-`#134` entries and `conversation-backend-and-deploy.md`'s Part 2
for the full reasoning and the bugs caught along the way.

### `/now` v2.0 — moved from standalone now.html to a generated now.md (2026-08-29)

Reverses v1.0 below: `docs/now.html` (client-side rendered) retired in
favor of `docs/now.md`, a real MkDocs Material page generated directly by
`tools/build-now-content.js`, wired into `mkdocs.yml`'s existing nav
entry — same "script writes real Markdown into `docs/`" pattern
`tools/generate_sitemap.py` → `docs/sitemap.md` already established in
this repo. Gets `/now` genuine sidebar nav/breadcrumbs, a working
per-section TOC, and search-index inclusion, none of which the old
client-rendered page could offer. Image paths switched to site-root-
relative (`/assets/now/...`) to match where `now.md` actually renders.
Full reasoning, tradeoffs, and verification in `NOW-PAGE.md`'s own
changelog.

### `/now` v1.5 — local admin server (2026-08-29)

`tools/now-editor.js` (`run-now-editor.bat`) added: a local-only
zero-dependency Node server + browser UI at `/admin/` for managing
`now.tsv` entries and `now-data.js` sections without hand-editing either
file (native date picker, live Markdown preview, image upload, section
reordering) — also serves `docs/` so `/now.html` previews at the real
deployed relative paths from the same server. Motivated by two real bugs
in the `/now` v1.3/v1.4 changelog entries (see `NOW-PAGE.md`) that both
traced back to hand-editing `now.tsv` in Excel. Full details, the shared-
module refactor this prompted (`tools/now-tsv.js`,
`docs/assets/js/now-markdown.js`), and how it was tested in `NOW-PAGE.md`'s
own changelog.

### `/now` v1.0 — initial build (2026-08-28)

`docs/now.html` shipped: a standalone page (same "hand-built HTML file
directly in `docs/`" pattern as `docs/index.html`, not an MkDocs Material
page) showing a periodically updated, fading-by-recency snapshot of
reading/watching/music/projects/teaching/travel/curiosities/making/finds.
Own TSV → generated-JS data pipeline (`content/now.tsv` →
`tools/build-now-content.js` → `docs/assets/js/now-generated-content.js`),
matching the `cabinet-*`/`fffx-*`/`bookshelf-*` convention documented in
`WORLD-SYSTEMS.md` rather than the plain-JSON-fetch approach originally
sketched in `now-page-helpers/`. Full design decisions, deviations from
that original spec, and content-sourcing notes in `NOW-PAGE.md`. Not yet
linked from `mkdocs.yml`'s nav — `docs/now.md`'s "coming soon" stub is
still what the sidebar points at, left as-is deliberately (see
`NOW-PAGE.md`).

### v3.0 — archipelago-tool rebuild, promoted to production (branch `landing-v3-prototype` merged to `main`, 2026-08-23)

`docs/index.html` now serves a build produced from `landing-v3/` — a
from-scratch rebuild (weighted-treemap section layout, circle-packed
islands, per-section coastline tracing, live theme system, hover
previews) rather than a revision of the v2 SVG below. Full iteration
history (v3.0 through this promotion) lives in
`documentation/landing-v3-notes/Landing-page-notes.2.0.md`'s changelog and
`documentation/landing-v3-notes/conversation-landing-page-v3.md`'s narrative account — not
duplicated here (the two serve different purposes: reference/changelog
vs. process log, not two accounts of the same thing). What's relevant at
this level:

- v2 (`docs/index.html` + `cabinet-render.js`/`cabinet-interactions.js`,
  deleted from `docs/assets/` 2026-08-29, see the Structure list above)
  is fully preserved and browsable, not deleted — see
  `archived-landing-pages/v2/`, plus its own four earlier visual states
  in `archived-landing-pages/v2-history/`. v1 (the original MkDocs
  Material homepage, before v2.0 below) is similarly preserved as a full
  rebuilt site in `archived-landing-pages/v1/`, from a `cabinet-v1-
  before-map` tag that had been referenced in that folder's README but
  never actually existed as git state until this pass created it.
  `main`'s own state immediately before this merge is tagged
  `cabinet-v2-before-v3`.
- The merge surfaced that `main` had diverged independently since the
  branch split: a CNAME (`cabinetofcuriosities.in`) had been added to
  the old `peaceiris/actions-gh-pages`-based `deploy.yml` on 2026-08-14,
  which `landing-v3-prototype`'s already-migrated `deploy-pages`-based
  workflow (see "Deploy pipeline" above) had no equivalent parameter
  for. Fixed by adding a `docs/CNAME` file before merging, which the
  newer mechanism honours the same way — not a formatting loss, this
  would otherwise have silently dropped custom-domain support.
- `docs/assets/js/cabinet-render.js` and friends are now dead code,
  unreferenced by anything live — left in place rather than deleted, to
  keep the promotion itself minimal and reversible.

### v2.1 — Round 1 visual pass (branch `cabinet-map-v2`, 2026-07-07)

Follow-up to v2.0 after reviewing it against the two AI-generated concept
images the original build prompt was written around (only their text
description had been read before, not the images themselves) plus a set
of plainer reference maps (Earthsea, the island of Gont, a Viking
trade-routes map, fantasticmaps.com's coastline-ripple sketches). Decision:
richer painted illustration doesn't fit a map that will keep gaining
islands/entries (an image would need constant re-illustration and
wouldn't be responsive) — stay with data-driven SVG, but move the linework
itself much closer to the plainer engraved-map references, in two rounds
(Round 1: map/terrain/coastlines/cartouche/compass/markers; Round 2+:
more detail as needed).

Round 1 changes:

- **Coastlines**: regenerated all 7 islands with jaggier, more irregular
  edges (22 points/1 smoothing pass instead of 14/2) and ripple rings now
  generated as *correlated contours* of the actual land shape (scaled +
  lightly re-jittered) instead of independent random blobs, so they read
  as "the same coastline traced further out," plus a short hachure
  tick-mark stroke pattern just outside each coast. Land fill lightened
  to sit much closer to the paper/sea tone — islands now read mainly
  through their ink outline and contour lines, not a block of contrasting
  color.
- **Cartouche**: added corner scrollwork flourishes and a small fleuron
  above the title, replacing the plain double-rectangle frame.
- **Compass rose**: replaced the simple diamond-needle compass with an
  8-point engraved star (4 major + 4 minor spikes, N/E/S/W ticks).
- **Entry markers**: replaced monogram-letter placeholder tiles with 23
  topic-matched line icons (rocket, book, typewriter, circles, particles,
  gradient, graduation cap, magnifier, "Aa" type sample, door, boat,
  layers, origami, laser, loom, gear, branch, chart, quill, code
  brackets, robot, scroll, hourglass) — still pure inline SVG, still
  driven by a new `icon` column in `cabinet-entries.tsv`, monogram
  remains the fallback for any entry with neither a thumbnail nor an
  assigned icon.
- **Mood motifs** (decorative only, `aria-hidden`, never carrying
  information): a faint dashed wave-line texture drifting very slowly
  across open water, two cloud wisps in empty corners, a small "here be
  dragons" sea-serpent tucked into open water, and a gentle ship-bob
  animation — all collapsed by the existing `prefers-reduced-motion`
  rule.
- Added an SVG `feTurbulence` grain filter over the page background for
  a paper-texture feel, cheap and framework-free.
- **Known follow-ups**: the CV entry's "scroll" icon reads a bit
  ambiguous at card size; the sea-serpent motif is subtle to the point of
  being easy to miss (intentionally restrained per "should support mood,
  not compete with entries" — revisit if it should be a bit more
  present); the Bookshelf/fffx/Interfaces label-clipping issue noted in
  v2.0 is unchanged by this pass.

### v2.0 — archipelago map rebuild (branch `cabinet-map-v2`, 2026-07-07)

Replaced the plain MkDocs Material homepage (`docs/index.md`, a static
list of outbound links) with a custom illustrated-archipelago-map
landing page (`docs/index.html`), following the shared Level 1
"standalone `docs/index.html`" pattern already used by Bookshelf and
fffx. Built from
[`cabinet_landing_v2.1_build_prompt.md`](../cabinet_landing_v2.1_build_prompt.md),
reconciled against the more MkDocs-integration-specific
[`cabinet-codex-handoff-prompt.md`](../cabinet-codex-handoff-prompt.md)
and this ecosystem's `WORLD-SYSTEMS.md` schema.

- Seven islands: Bookshelf of Curiosities, Form follows f(x), Teaching,
  Visual Field Notes, Machines & Makings, Interfaces/Data/Texts, About Me
  (deliberately peripheral, top-right, per the design brief).
- Island coastlines are organic blobs with three nested coastline-ripple
  rings each, generated once by a seeded script
  (`assets/map/source/generate-cabinet-map.js`) and committed as static
  SVG paths — no runtime shape generation.
- 25 entries seeded from real Bookshelf/fffx TSV content and Cabinet's
  own existing MkDocs pages where they exist (`scifi`, `asimov`,
  `vera-molnar`, `circle-packing-library`, `mini_loom` → Looms,
  `emergent_twine` → Branching Narrative, `dotMandalaTool` → WebTech,
  etc.); entries with no real destination yet render as non-navigating
  "coming soon" plaques (`status: "wip"`, no `href`) rather than dead or
  fake links.
- Data model reconciles the shared WORLD-SYSTEMS.md bookkeeping fields
  (`section`, `status` as `true`/`"wip"`/`false`, `weight`, `tags`,
  `location`, `relatedLinks`) with a Cabinet-specific visual layer
  (`map: {islandId, cx, cy, rx, ry}` per section, `visual: {placement,
  x, y, anchor, cardType}` per entry) — matching how fffx and Bookshelf
  each keep their own world-specific layout fields alongside the shared
  core.
- Desktop: SVG map + absolutely-positioned HTML card overlay, hover/focus
  linking between an island and its own entries (and vice versa), route
  lines that highlight on hover. Below 760px: a stacked list fallback
  (`.map-stack`) with the same content and links, shown/hidden via CSS
  only (no JS viewport branching).
- Entries without a real thumbnail render a generated parchment monogram
  tile (first letter, CSS-only) rather than a broken `<img>`.
- Old homepage archived to `archived-landing-pages/cabinet-index.md.bak`
  (+ `archived-landing-pages/README.md`); pre-rebuild `main` tagged
  `cabinet-v1-before-map`.
- `nav.Home: index.md` removed from `mkdocs.yml`; deploy workflow
  modernized to `configure-pages`/`upload-pages-artifact`/`deploy-pages`
  and gained the `docs/index.md` collision guard, matching Bookshelf/fffx.
- **Known follow-ups (visual, not functional):** on a few islands
  (Bookshelf, fffx, Interfaces/Data/Texts) the widest entry cards still
  clip part of the island's own name label where the label falls directly
  beneath the card cluster — readable via the card links and the mobile
  list regardless, but worth a manual label-position or card-layout pass.
  fffx's real thumbnail for Circle Packing Library wasn't copied into this
  repo yet (renders as a placeholder tile). fffx's `bookshelf`/`fffx`
  subdomain links assume their `site_url`-configured domains are live;
  verify before treating them as production in Cabinet.
- Not merged to `main` — this branch is for visual review first.
