# The Cabinet of Curiosities

Repo-level practical guide and changelog. Two companion docs:
[`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) (the map's visual design rules —
palette, typography, island/card anatomy) and
[`LANDING-PAGE-NOTES.md`](LANDING-PAGE-NOTES.md) (implementation notes:
archive process, data pipeline, map-regeneration workflow, known gotchas).
[`WORLD-SYSTEMS.md`](WORLD-SYSTEMS.md) documents the conventions this repo
shares with its sibling Level 1 worlds, [The Bookshelf of
Curiosities](https://github.com/jesmehta/TheBookshelfOfCuriosities) and
[fffx](https://github.com/jesmehta/form-follows-fx).

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
- `docs/assets/css/cabinet-tokens.css` — single source of truth for the
  parchment/ink palette and type (`--cab-*`), shared between
  `cabinet-landing.css` (the map page) and `docs/stylesheets/cabinet-material.css`
  (maps the same tokens into Material's `--md-*` variables for every other
  page).
- `docs/assets/js/` — `cabinet-data.js` (hand-edited, landing-page-level
  config only: cartouche/legend text, viewBox size), `cabinet-generated-content.js`
  (auto-generated, do not hand-edit — see Data pipeline below),
  `cabinet-render.js` (renders island link state + entry card layer +
  mobile stacked fallback from data), `cabinet-interactions.js` (hover/focus
  island↔card highlight linking).
- `content/cabinet-sections.tsv`, `content/cabinet-entries.tsv` — the
  actual editable content source (islands and their entries, including
  visual placement columns). Edit these, not the generated JS.
- `tools/build-cabinet-content.js` — parses the two TSVs into
  `docs/assets/js/cabinet-generated-content.js`. Run with
  `node tools/build-cabinet-content.js` after editing either TSV.
- `assets/map/source/` — the one-time island-shape generator
  (`generate-cabinet-map.js`) and its seed config
  (`cabinet-map-source.json`), kept for reproducibility. Authoring-only,
  outside `docs/`, never loaded at runtime — see "Map regeneration" in
  `LANDING-PAGE-NOTES.md`.
- `archived-landing-pages/` — the pre-map Cabinet homepage
  (`cabinet-index.md.bak`), kept outside `docs/` so MkDocs never builds it
  as a live page. The pre-rebuild state of `main` is also tagged
  `cabinet-v1-before-map` in git.
- `mkdocs.yml`, `requirements.txt` — MkDocs config and its Python
  dependencies.
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

See `LANDING-PAGE-NOTES.md` for the full escalation path (when a section
outgrows its island, when a new top-level island is actually needed, and
the full regeneration workflow) and `WORLD-SYSTEMS.md` for the shared data
field conventions (`status`, `weight`, `tags`, etc.) that these TSVs follow.

## Deploy pipeline

`deploy.yml` runs on every push to `main`:

1. **`build`** — checks out the repo, installs Python deps, guards against
   `docs/index.md` ever being reintroduced (see `WORLD-SYSTEMS.md`'s
   homepage rule), runs `mkdocs build --site-dir public`, uploads `public/`
   as the Pages artifact.
2. **`deploy`** — publishes that artifact via `actions/deploy-pages`.

Migrated from `peaceiris/actions-gh-pages@v3` to GitHub's first-party
Pages actions (`configure-pages` → `upload-pages-artifact` →
`deploy-pages`) to match Bookshelf/fffx's current workflow — see their
READMEs for why (`GITHUB_TOKEN` defaults to read-only now, and the old
action's runtime was being retired). This requires **Settings → Pages →
Build and deployment → Source → "GitHub Actions"** to be set on the repo
(one-time, not in the YAML).

Cabinet has no `CNAME` file — it deploys to the GitHub Pages project
subpath (`jesmehta.github.io/CabinetOfCuriosities/`), not a custom domain.
This is why every internal link in the TSVs is path-relative with no
leading slash (`about/`, not `/about/`) — see `WORLD-SYSTEMS.md`'s note on
`href` safety.

## Changelog

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
