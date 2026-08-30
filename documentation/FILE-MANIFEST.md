# File Manifest

Every code/config file in this repo and its role, organized by subsystem.
Bulk-content folders (images, screenshots, frozen archive snapshots) are
described as one entry each rather than file-by-file — see each area's own
docs (linked below) for exhaustive detail where it exists. Companion to
`README.md`'s "Structure" section (the practical guide); this is the
exhaustive map. Generated 2026-08-29, updated 2026-08-29 (documentation/
relocation) — not auto-built, update by hand alongside structural changes,
same as every other doc here.

## Root-level files

Only two `.md` files are root-required — everything else that used to sit
at root moved into `documentation/` on 2026-08-29 (see that section
below). `README.md` is a git/GitHub hosting convention (root is where
it's expected to render); `WORLD-SYSTEMS.md` is duplicated byte-for-byte
across Cabinet/Bookshelf/fffx with its own path assumed identical in all
three, so it can't move here alone without desyncing the other two repos.

| File | Role |
|---|---|
| `README.md` | Practical guide: structure, running locally, editing content, deploy pipeline, changelog. Start here. |
| `WORLD-SYSTEMS.md` | Conventions shared across Cabinet/Bookshelf/fffx (data schema, status model, homepage rule). Hand-synced identically across all three repos — don't edit without also updating the other two. |
| `mkdocs.yml` | MkDocs site config: nav tree, theme, plugins, extra CSS/JS. `theme.custom_dir: overrides` (2026-08-29) points at the theme override below. |
| `requirements.txt` | Python deps for `mkdocs build`/`mkdocs serve`. |
| `.github/workflows/deploy.yml` | CI: builds the mkdocs site + assembles external repos into `public/teaching/<name>/`, deploys to GitHub Pages on every push to `main`. |
| `.gitignore` / `.gitattributes` | Standard git config (line-ending normalization; ignores `site/`, `node_modules/`, `review/*`, generated build dirs). |
| `run Mkdocs serve.bat` | Double-click launcher for `mkdocs serve`. |
| `run-now-editor.bat` | Double-click launcher for `tools/now-editor.js` (the Now-page local admin server). |
| `run-cabinet-editor.bat` | Double-click launcher for `tools/cabinet-editor.js` (the Cabinet sections/entries local admin server). |

## `documentation/` — project documentation, not root-required

Reorganized 2026-08-30 into one folder per feature/subsystem that has
more than one doc file — a technical-reference doc plus a
conversation-log companion, per `DOCUMENTATION-GUIDE.md`'s standard.
A subsystem with only one doc file stays flat at `documentation/` root
rather than getting a single-file folder of its own.

| File | Role |
|---|---|
| `DOCUMENTATION-GUIDE.md` | The full documentation standard: the four things every piece of work needs on record (concept/need, decisions/intent, changelog, todo/watch-out-for), the three tiers that satisfy them, and the folder-per-feature convention this whole section follows. Read this before adding any new doc file here. |
| `conversation-backend-and-deploy.md` | Shared conversation-log for backend/deploy/site-wide infrastructure work that doesn't map onto one page or tool — no dedicated folder, per the standing rule "if it doesn't have a place to live, it lives in this doc." Four parts so far: Cloudflare Web Analytics rollout, the file/folder reorganization (`#129`-`#134`), launch-milestone/priority tracking (`#58`/`#59`), and the documentation standard's own build-out (Part 4 — this file's own conversation, directly sourced rather than assembled afterward). New infra topics become a new `# Part N` here, not a new file. |
| `cloudflare-web-analytics-setup.md` | Setup/verification guide for Cloudflare Web Analytics across the Cabinet/Bookshelf/fffx sites — where the beacon goes, constraints (no cookies/fingerprinting, defer-load, don't break the site if analytics fails), how to verify, plus the as-built record. Already implemented for Cabinet, 2026-08-29: `overrides/main.html` (MkDocs Material theme override, wired via `mkdocs.yml`'s `theme.custom_dir: overrides`, inherited by every generated page) and `landing-v3/index.template.html`/`docs/index.html` (custom landing page). Bookshelf/fffx/external-repo rollout tracked as `landing-v3-notes/three-world-launch-phases-ToDo.md` #135/#136. Its own conversation-log lives in `conversation-backend-and-deploy.md` (Part 1), not a same-named sibling file — see that doc's own note on why. |
| `cloudflare-js-snippet.md` | Raw copy of the Cloudflare-supplied beacon snippet (with the real token) — gitignored, plaintext working notes only; the token itself ships baked into the pages listed above, so this file isn't the canonical record. |
| `FILE-MANIFEST.md` | This file. |
| `CONTENT-INVENTORY.md` | Auto-generated, 2026-08-30, by `tools/generate_sitemap.py` — cross-references `content/cabinet-{sections,entries}.tsv` against `mkdocs.yml`'s own nav tree (Cabinet-only; Bookshelf/fffx status is `docs/sitemap.md`'s job). Do not hand-edit; re-run the script to refresh. Replaces the old hand-maintained Content Inventory table in `landing-v3-notes/three-world-launch-phases-ToDo.md` (#126). Stays at `documentation/` root rather than moving into `sitemap/` alongside its conversation-log — the script's output path is currently hardcoded; moving it is a code change, not a doc reorg, and hasn't been done. |

### `now/` — the `/now` page

| File | Role |
|---|---|
| `NOW-PAGE.md` | Design decisions and as-built record for the `/now` page. Has its own per-file "Files" section scoped to that subsystem. |
| `conversation-now-page.md` | Conversation-log companion — what was asked, tried, and corrected while building `/now`, in the same relationship to `NOW-PAGE.md` that `conversation-landing-page-v3.md` has to `Landing-page-notes.2.0.md`. |
| `now-page-helpers/NOW-PAGE-DOCUMENTATION.md`, `NOW-PAGE-FILE-LIST.md`, `NOW-PAGE-VSCODE-PROMPT.md` | Original pre-code planning spec for the `/now` page, written before any code existed. Superseded by `NOW-PAGE.md`'s as-built record (which documents every deviation) — kept for the record, not actively maintained. Revisit in a future documentation-consolidation round, by direct request, not this pass. |

### `cabinet-editor/` — the Cabinet TSV editor

| File | Role |
|---|---|
| `CABINET-EDITOR.md` | Design decisions and as-built record for the Cabinet sections/entries local admin server (mirrors `NOW-PAGE.md`'s "Local admin server" section for the `now-editor.js` pattern). Covers the live-vs-reserved-vs-deleted TSV column split (and its `WORLD-SYSTEMS.md` correction), the grid UI's sort/resize/expand-text controls, and notes Bookshelf/fffx copies as future work. v1.0–v1.5 changelog. |
| `conversation-cabinet-editor.md` | Conversation-log companion — same relationship to `CABINET-EDITOR.md` as `conversation-now-page.md` has to `NOW-PAGE.md`. |

### `landing-v3-notes/` — the v3 map system, all of it together

| File | Role |
|---|---|
| `Landing-page-notes.2.0.md` | Exhaustive versioned dev log (v3.0–v3.7.68) for the `landing-v3/` map rebuild — design decisions, verification, changelog. Large (374KB+). Technical reference: what the system is and how it works. |
| `conversation-landing-page-v3.md` | Chronological process log of the same v3 development period — actual back-and-forth, corrected mistakes, direct quotes, meta-decisions about how to work. **Not a duplicate** of `Landing-page-notes.2.0.md` despite covering the same period: that file is reference/changelog (what shipped), this one is narrative (how it happened and why). The file's own "documentation survey" section states the policy directly — findings get folded into the reference doc's to-do list, not left duplicated here. Large (2,900+ lines, including the `#70` heading-outline addendum); size is a real cost, but not redundancy. |
| `three-world-launch-phases-ToDo.md` | Master to-do tracker across Cabinet/Bookshelf/fffx launch phases — numbered items, checkboxes, resolution notes. |
| `three-world-launch-phases-Notes.md` | Supporting rationale (deployment mechanism, branch-transition reasoning, TSV-editor spec), deliberately split out of the ToDo file so rationale doesn't clutter the punch-list format — not redundant with it, a different view of the same initiative. |
| `cabinet-multi-repo-assembly-concept-note-short.md` | Focused how-to for one specific mechanism: mounting independent repos (Working with AI, Prompt Generator, etc.) into `public/teaching/<name>/` at deploy time. Actively referenced from `deploy.yml`'s own comments. |
| `v3-scheme-candidates.md` | Five competing colour/font token-set proposals for one still-open decision, referenced from `Landing-page-notes.2.0.md`'s own to-do item #10 — a scratch/proposal doc, not a competing reference. |

### `sitemap/` — the Content Inventory / sitemap generation

| File | Role |
|---|---|
| `SITEMAP.md` | Technical reference for `tools/generate_sitemap.py`'s two jobs (cross-world `docs/sitemap.md`, Cabinet-only `documentation/CONTENT-INVENTORY.md`), its regex-based nav scanner and why it avoids a YAML dependency, what its Flags section catches, and its own noted limitation (`CONTENT-INVENTORY.md`'s output path is hardcoded, not configurable). Closes the gap `conversation-sitemap.md` had flagged. |
| `conversation-sitemap.md` | Conversation-log for `#126` (generating the Content Inventory instead of hand-maintaining it) and the reasoning behind `SITEMAP.md`'s design. |

## `overrides/` — MkDocs Material theme override

| File | Role |
|---|---|
| `main.html` | Extends Material's `base.html`, injects the Cloudflare Web Analytics beacon into the `extrahead` block so every MkDocs-generated page inherits it from one place — see `documentation/cloudflare-web-analytics-setup.md`. Added 2026-08-29. |

## `content/` — canonical data sources (hand-edited)

| File | Role |
|---|---|
| `content/cabinet-sections.tsv` | Cabinet's top-level islands/sections (Bookshelf, fffx, Teaching, etc.) — id, title, href, status, weight, layout columns. Hand-edited or via `tools/cabinet-editor.js`. |
| `content/cabinet-entries.tsv` | Individual plaques/port-cards within each section, including the compass rose's four direction entries. Hand-edited or via `tools/cabinet-editor.js`. |
| `content/now.tsv` | `/now` page entries (reading/watching/travel/etc.), one row per item. |

## `tools/` — build and authoring scripts (never shipped to `docs/`)

| File | Role |
|---|---|
| `build-cabinet-content.js` | Parses the two `cabinet-*.tsv` files into `docs/assets/js/cabinet-generated-content.js`. Refactored 2026-08-29 onto `cabinet-tsv.js`'s shared reader/validator (byte-identical output verified) — see `CABINET-EDITOR.md`. |
| `build-now-content.js` | Parses `content/now.tsv` + `now-data.js` directly into `docs/now.md` — same "script writes Markdown into `docs/`" pattern as `generate_sitemap.py`. Pre-renders entry text through `now-markdown.js` first. (2026-08-29: previously wrote a `now-generated-content.js` JS blob for a client-rendered `docs/now.html`; that page and its generated-JS output are both gone now — see `NOW-PAGE.md`'s v2.0 entry.) |
| `generate_sitemap.py` | Fetches sections/entries TSVs live from all three worlds' repos (Cabinet, fffx, Bookshelf) over GitHub raw, writes `docs/sitemap.md`. (2026-08-30: also writes `documentation/CONTENT-INVENTORY.md`, a Cabinet-only, local-file, no-network cross-check of `content/cabinet-*.tsv` against `mkdocs.yml`'s own nav tree — replaces the old hand-maintained Content Inventory table in `three-world-launch-phases-ToDo.md`, #126.) |
| `now-tsv.js` | Shared TSV parse/serialize logic, used by both `build-now-content.js` and the admin editor — kept in one place so the two can't quietly diverge. |
| `now-data-editor.js` | Programmatic reader/writer for `now-data.js`'s `sectionConfig`/`sectionOrder` (balanced-bracket-span replace, not full-file rewrite). Editor-only. |
| `now-editor.js` | Local-only zero-dependency Node HTTP admin server (`/admin/`, port 5757) for editing `now.tsv` entries and `now-data.js` sections through a browser UI. |
| `now-editor-ui/index.html`, `editor.css`, `editor.js` | The admin server's browser UI. |
| `cabinet-tsv.js` | Shared TSV parse/serialize/validate logic for `content/cabinet-*.tsv`, used by both `build-cabinet-content.js` and `cabinet-editor.js` — same "one shared module" reasoning as `now-tsv.js`. Strict plain splitter (not CSV-quote-aware like `now-tsv.js`), matching Cabinet's TSVs' own convention. Added 2026-08-29, see `CABINET-EDITOR.md`. |
| `cabinet-editor.js` | Local-only zero-dependency Node HTTP admin server (`/admin/`, port 5858) for editing `cabinet-sections.tsv`/`cabinet-entries.tsv` through a browser UI, plus a Rebuild button that shells out to `build-cabinet-content.js`. Added 2026-08-29. |
| `cabinet-editor-ui/index.html`, `editor.css`, `editor.js` | The admin server's browser UI — grid editor with a collapsed "reserved/layout" panel per row for TSV columns the live v3 renderer doesn't currently read (see `CABINET-EDITOR.md`). Replaces the earlier one-file `cabinet-data-editor.html` sketch (deleted). |

## `docs/` — the live MkDocs site + standalone static pages

| Path | Role |
|---|---|
| `docs/index.html` | Standalone Level-1 landing page (the archipelago map). Auto-generated — promoted from `landing-v3/index.html`, do not hand-edit. |
| `docs/now.md` | Real MkDocs page, wired into `mkdocs.yml`'s nav. Auto-generated by `tools/build-now-content.js` from `content/now.tsv` + `now-data.js` — do not hand-edit (see `NOW-PAGE.md`). |
| `docs/sitemap.md` | Auto-generated cross-world site map (mkdocs page) — output of `tools/generate_sitemap.py`. |
| `docs/about.md`, `colophon.md`, `site_notes.md` | Compass-rose / meta MkDocs pages. |
| `docs/teaching.md`, `makings.md`, `creative_code.md`, `dotMandalaTool.md`, `emergent_twine.md`, `mini_loom.md`, `traceryBots.md`, `trippyGourmet.md` | Section-landing and standalone MkDocs content pages. |
| `docs/3dp/*.md` | 3D-printing project write-ups (Mecha, Flexures, Polyhedra, 2019 year-in-printing). |
| `docs/fffx/*.md` | fffx-related MkDocs pages not covered by the fffx subdomain itself (100 Gradients, Packing Shapes, Vera Molnar Retrospective, particle systems, fffx landing stub). |
| `docs/teaching/*.md` | Per-cohort teaching write-ups (class-2023-24, class-2025-26). |
| `docs/makings/*.md` | Making-process write-ups (drawing machines, lasercutting, origami/paper). |
| `docs/CNAME` | Custom-domain file for GitHub Pages (`cabinetofcuriosities.in`). |
| `docs/images/`, `docs/files/` | Static image/downloadable-file assets referenced from MkDocs pages. |

### `docs/assets/` — CSS/JS shipped to production

| File | Role |
|---|---|
| `css/cabinet-tokens.css` | Single source of truth for the parchment/ink palette + type, shared by the v3 map and MkDocs Material theme mapping. |
| `css/cabinet-v3-style.css` | v3 map's own stylesheet. Promoted copy — dev original lives at `landing-v3/shared/cabinet-v3-style.css`. |
| `css/now.css` | `/now` entry-list layout, fade hierarchy, colour accents (page chrome/typography itself comes from `cabinet-material.css`, same as every other MkDocs page). |
| `js/cabinet-generated-content.js` | Auto-generated from `content/cabinet-*.tsv` — do not hand-edit. |
| `js/cabinet-v3-data.js`, `cabinet-v3-dragon.js`, `cabinet-v3-flowfield.js`, `cabinet-v3-islandshape.js`, `cabinet-v3-particles.js`, `cabinet-v3-production-animate.js` | Promoted runtime copies of `landing-v3/shared/`'s same-named files — the boats/dragons animation actually shipped to browsers. |
| `js/now-data.js` | Hand-edited: `/now` section titles, mode, visibility, groupSize, imageLayout. |
| `js/now-markdown.js` | Shared tiny Markdown renderer — dynamically imported by `tools/build-now-content.js` to pre-render entry text into `docs/now.md`, and used by the admin editor's live preview. |
| `now/<section>/` | Uploaded `/now` images (`reading/`, `travel/`, `found/`), populated by the admin server's upload endpoint. |
| `stylesheets/cabinet-material.css`, `extra.css` | MkDocs Material theme extras (token mapping, misc overrides). |
| `js/extra.js` | MkDocs Material extra JS. |

## `landing-v3/` — the v3 map's dev/build system

Regrouped 2026-08-29 by actual role (see
`documentation/landing-v3-notes/three-world-launch-phases-ToDo.md` `#132`
for the full import-graph reasoning behind the grouping); its own four
documentation files moved into `documentation/landing-v3-notes/` the same
day (see above) — this folder is code/build only now.

| Path | Role |
|---|---|
| `build-static.mjs` | Renders `layout-engine/build-render.html` in headless Chromium, captures the resulting SVG plus the `#70` heading-outline markup, bakes both into `index.html` from `index.template.html`. Run after any content/config change. |
| `index.template.html` | Hand-edited source template for the static build — edit this, not `index.html`. |
| `index.html` | Auto-generated by `build-static.mjs` — the dev-served copy; promoted (with an asset-path rewrite) to `docs/index.html` for production. |
| `package.json` / `package-lock.json` / `node_modules/` | npm project for Playwright (used by `build-static.mjs`'s headless render). |
| `dev-screenshots/` | Committed per-version screenshots documenting the v3 visual history — established workflow, not clutter. |
| `archive/v3.6/` | Frozen snapshot of the v3.6 build for visual comparison, linked from the static page's own footnote. |

### `layout-engine/` — build-time only, never shipped as a file to browsers

| File | Role |
|---|---|
| `cabinet-v3-layout.js` | The full layout engine: `render()`, orchestrates treemap → circle-pack → coastline tracing, plus `renderSemanticOutline()` (`#70`) building a parallel, visually-hidden real h2/h3 heading outline into `#v3-semantic-outline` from the same section/entry data. |
| `cabinet-v3-treemap.js` | Weighted-treemap section-region layout (`squarify()`). Pure logic, DOM-free, runs under plain Node too. |
| `cabinet-v3-circlepack.js` | Growth-based circle-packing for islands within each region. Pure logic, DOM-free. |
| `build-render.html` | Headless-Chromium entry point `build-static.mjs` loads to capture the SVG and the `#v3-semantic-outline` heading markup. Not for humans. |
| `compass_rose.svg`, `dragon.svg` | Design-source files for the compass rose and sea-dragon artwork — both hand-inlined into `cabinet-v3-layout.js` as literal path data, never loaded at runtime. `dragon.svg` joined `compass_rose.svg` here 2026-08-29 (previously sat alone at repo root — an inconsistency, not a deliberate split, both play the exact same role). |

### `shared/` — imported by the layout engine at build time, and shipped to production

| File | Role |
|---|---|
| `cabinet-v3-data.js` | Hand-edited config: `v3Config`, `EXTRA_WEIGHT`, viewBox/cartouche settings. |
| `cabinet-v3-islandshape.js` | Coastline tracing from a heightmap (`buildIslandHeightmap`, Catmull-Rom/Bézier path generation). |
| `cabinet-v3-flowfield.js` | Flow-field generation + sampler, drives particle/dragon motion. |
| `cabinet-v3-particles.js` | Particle pool + per-tick stepping for the ambient sea particles. |
| `cabinet-v3-dragon.js` | Sea-dragon spawn/step logic. |
| `cabinet-v3-production-animate.js` | The slim runtime module actually shipped to browsers — boats/dragons animation running on top of the frozen SVG, reusing the modules above. |
| `cabinet-v3-style.css` | v3 map's stylesheet — dev original; promoted copy lives at `docs/assets/css/cabinet-v3-style.css`. |

### `dev-tool/` — dev-only, never ships

| File | Role |
|---|---|
| `islands-tool.html` | Live tuning tool — loads the layout engine directly, recomputes on every change. |
| `cabinet-v3-controls.js` | The tuning panel UI (sliders, theme picker, reroll button) for `islands-tool.html`. Only file that's purely dev tooling with zero production role. |

## `archived-landing-pages/` — frozen historical snapshots, not rewritten

Content/structure frozen as documented below. One narrow exception,
2026-08-29: all 28 HTML files across this tree got the Cloudflare Web
Analytics beacon appended before `</body>` (or at EOF for
`algorithm-bench/index.html`, which has no closing `</body>`/`</html>`
tags at all) — these pages are genuinely deployed
(`public/archived-landing-pages/`) and publicly linked from the live
Colophon page, so they're viewer-facing by the same standard as the
current site, direct request. Pure addition, no visual/behavioural
change, scripted rather than hand-edited (28 files) — see
`documentation/cloudflare-web-analytics-setup.md`.

| Path | Role |
|---|---|
| `v1/` | Full rebuilt v1 site (original MkDocs Material homepage, pre-map). |
| `v2/` | Full v2 site (illustrated-archipelago SVG map, hand-authored). Includes its own `assets/`, plus `DESIGN-SYSTEM.md`/`LANDING-PAGE-NOTES.md` (moved here 2026-08-29 — both self-declared superseded) and `source/` (the v2 map's one-time island-shape generator, `generate-cabinet-map.js` + `cabinet-map-source.json`). |
| `v2-history/01–04/` | Four earlier visual-development snapshots of v2. |
| `v3-history/01-pre-islands-tool-split/` | v3 snapshot from just before `islands-tool.html` was carved out as its own page. |
| `algorithm-bench/` | Prototype bench for an early island-generation approach explored during the v2 review. |
| `index.html` | Archive landing page — largely bypassed now (Colophon links `v1/`/`v2/` directly). |
| `cabinet-index.md.bak` | The pre-map Cabinet homepage, kept outside `docs/` so MkDocs never builds it. |
| `README.md` | Archive's own index/explanation. |

## `review/`

Gitignored working screenshots for in-progress review (`review/*` in `.gitignore`, except `review/README.md` which stays tracked so the folder explains itself). Ephemeral — not part of history.
