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
| `mkdocs.yml` | MkDocs site config: nav tree, theme, plugins, extra CSS/JS. |
| `requirements.txt` | Python deps for `mkdocs build`/`mkdocs serve`. |
| `.github/workflows/deploy.yml` | CI: builds the mkdocs site + assembles external repos into `public/teaching/<name>/`, deploys to GitHub Pages on every push to `main`. |
| `.gitignore` / `.gitattributes` | Standard git config (line-ending normalization; ignores `site/`, `node_modules/`, `review/*`, generated build dirs). |
| `run Mkdocs serve.bat` | Double-click launcher for `mkdocs serve`. |
| `run-now-editor.bat` | Double-click launcher for `tools/now-editor.js` (the Now-page local admin server). |

## `documentation/` — project documentation, not root-required

| File | Role |
|---|---|
| `NOW-PAGE.md` | Design decisions and as-built record for the `/now` page. Has its own per-file "Files" section scoped to that subsystem. |
| `Landing-page-notes.2.0.md` | Exhaustive versioned dev log (v3.0–v3.7.67) for the `landing-v3/` map rebuild — design decisions, verification, changelog. Large (374KB). Technical reference: what the system is and how it works. |
| `conversation-landing-page-v3.md` | Chronological process log of the same v3 development period — actual back-and-forth, corrected mistakes, direct quotes, meta-decisions about how to work. **Not a duplicate** of `Landing-page-notes.2.0.md` despite covering the same period: that file is reference/changelog (what shipped), this one is narrative (how it happened and why). The file's own "documentation survey" section states the policy directly — findings get folded into the reference doc's to-do list, not left duplicated here. Large (2,800 lines); size is a real cost, but not redundancy. |
| `FILE-MANIFEST.md` | This file. |
| `now-page-helpers/NOW-PAGE-DOCUMENTATION.md`, `NOW-PAGE-FILE-LIST.md`, `NOW-PAGE-VSCODE-PROMPT.md` | Original pre-code planning spec for the `/now` page, written before any code existed. Superseded by `NOW-PAGE.md`'s as-built record (which documents every deviation) — kept for the record, not actively maintained. Revisit in a future documentation-consolidation round, by direct request, not this pass. |
| `landing-v3-notes/three-world-launch-phases-ToDo.md` | Master to-do tracker across Cabinet/Bookshelf/fffx launch phases — numbered items, checkboxes, resolution notes. Moved from `landing-v3/` 2026-08-29. |
| `landing-v3-notes/three-world-launch-phases-Notes.md` | Supporting rationale (deployment mechanism, branch-transition reasoning, TSV-editor spec), deliberately split out of the ToDo file so rationale doesn't clutter the punch-list format — not redundant with it, a different view of the same initiative. |
| `landing-v3-notes/cabinet-multi-repo-assembly-concept-note-short.md` | Focused how-to for one specific mechanism: mounting independent repos (Working with AI, Prompt Generator, etc.) into `public/teaching/<name>/` at deploy time. Actively referenced from `deploy.yml`'s own comments. |
| `landing-v3-notes/v3-scheme-candidates.md` | Five competing colour/font token-set proposals for one still-open decision, referenced from `Landing-page-notes.2.0.md`'s own to-do item #10 — a scratch/proposal doc, not a competing reference. |

## `content/` — canonical data sources (hand-edited)

| File | Role |
|---|---|
| `content/cabinet-sections.tsv` | Cabinet's top-level islands/sections (Bookshelf, fffx, Teaching, etc.) — id, title, href, status, weight, layout columns. |
| `content/cabinet-entries.tsv` | Individual plaques/port-cards within each section, including the compass rose's four direction entries. |
| `content/now.tsv` | `/now` page entries (reading/watching/travel/etc.), one row per item. |

## `tools/` — build and authoring scripts (never shipped to `docs/`)

| File | Role |
|---|---|
| `build-cabinet-content.js` | Parses the two `cabinet-*.tsv` files into `docs/assets/js/cabinet-generated-content.js`. |
| `build-now-content.js` | Parses `content/now.tsv` into `docs/assets/js/now-generated-content.js`. |
| `generate_sitemap.py` | Fetches sections/entries TSVs live from all three worlds' repos (Cabinet, fffx, Bookshelf) over GitHub raw, writes `docs/sitemap.md`. |
| `now-tsv.js` | Shared TSV parse/serialize logic, used by both `build-now-content.js` and the admin editor — kept in one place so the two can't quietly diverge. |
| `now-data-editor.js` | Programmatic reader/writer for `now-data.js`'s `sectionConfig`/`sectionOrder` (balanced-bracket-span replace, not full-file rewrite). Editor-only. |
| `now-editor.js` | Local-only zero-dependency Node HTTP admin server (`/admin/`, port 5757) for editing `now.tsv` entries and `now-data.js` sections through a browser UI. |
| `now-editor-ui/index.html`, `editor.css`, `editor.js` | The admin server's browser UI. |

## `docs/` — the live MkDocs site + standalone static pages

| Path | Role |
|---|---|
| `docs/index.html` | Standalone Level-1 landing page (the archipelago map). Auto-generated — promoted from `landing-v3/index.html`, do not hand-edit. |
| `docs/now.html` | Standalone `/now` page shell. Hand-edited HTML; content comes from `now-generated-content.js`. |
| `docs/now.md` | MkDocs "coming soon" stub, still what `mkdocs.yml`'s nav points at — deliberately not wired to `now.html` (see `NOW-PAGE.md`). |
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
| `css/now.css` | `/now` page layout, fade hierarchy, colour accents. |
| `js/cabinet-generated-content.js` | Auto-generated from `content/cabinet-*.tsv` — do not hand-edit. |
| `js/cabinet-v3-data.js`, `cabinet-v3-dragon.js`, `cabinet-v3-flowfield.js`, `cabinet-v3-islandshape.js`, `cabinet-v3-particles.js`, `cabinet-v3-production-animate.js` | Promoted runtime copies of `landing-v3/shared/`'s same-named files — the boats/dragons animation actually shipped to browsers. |
| `js/now-generated-content.js` | Auto-generated from `content/now.tsv` — do not hand-edit. |
| `js/now-data.js` | Hand-edited: `/now` section titles, mode, visibility, groupSize, imageLayout. |
| `js/now-render.js` | `/now` page's grouping/sorting/fade/pinning rendering logic. |
| `js/now-markdown.js` | Shared tiny Markdown renderer, used by both `now-render.js` and the admin editor's live preview. |
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
| `build-static.mjs` | Renders `layout-engine/build-render.html` in headless Chromium, captures the resulting SVG, bakes it into `index.html` from `index.template.html`. Run after any content/config change. |
| `index.template.html` | Hand-edited source template for the static build — edit this, not `index.html`. |
| `index.html` | Auto-generated by `build-static.mjs` — the dev-served copy; promoted (with an asset-path rewrite) to `docs/index.html` for production. |
| `package.json` / `package-lock.json` / `node_modules/` | npm project for Playwright (used by `build-static.mjs`'s headless render). |
| `dev-screenshots/` | Committed per-version screenshots documenting the v3 visual history — established workflow, not clutter. |
| `archive/v3.6/` | Frozen snapshot of the v3.6 build for visual comparison, linked from the static page's own footnote. |

### `layout-engine/` — build-time only, never shipped as a file to browsers

| File | Role |
|---|---|
| `cabinet-v3-layout.js` | The full layout engine: `render()`, orchestrates treemap → circle-pack → coastline tracing. |
| `cabinet-v3-treemap.js` | Weighted-treemap section-region layout (`squarify()`). Pure logic, DOM-free, runs under plain Node too. |
| `cabinet-v3-circlepack.js` | Growth-based circle-packing for islands within each region. Pure logic, DOM-free. |
| `build-render.html` | Headless-Chromium entry point `build-static.mjs` loads to capture the SVG. Not for humans. |
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
