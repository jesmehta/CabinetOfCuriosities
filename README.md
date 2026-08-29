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
[fffx](https://github.com/jesmehta/form-follows-fx). [`NOW-PAGE.md`](documentation/NOW-PAGE.md)
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
  `documentation/Landing-page-notes.2.0.md` for that system's own full
  documentation, and `documentation/landing-v3-notes/three-world-launch-phases-ToDo.md`
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
- `documentation/` — non-root-required project documentation:
  `NOW-PAGE.md`, `Landing-page-notes.2.0.md`, `conversation-landing-page-v3.md`,
  `FILE-MANIFEST.md` (the exhaustive per-file role listing), `now-page-helpers/`
  (superseded pre-code `/now` spec), and `landing-v3-notes/` (that system's
  own to-do tracker, supporting rationale, multi-repo-assembly concept
  note, and open colour-scheme proposals). Everything here *could* live
  at root but doesn't need to, unlike `README.md`/`WORLD-SYSTEMS.md` — see
  the "Root-level file verdicts" reasoning in git history (2026-08-29) if
  the distinction ever needs re-litigating.
- `mkdocs.yml`, `requirements.txt` — MkDocs config and its Python
  dependencies. `theme.custom_dir: overrides` (2026-08-29) points at
  `overrides/main.html`, which extends MkDocs Material's `base.html` to
  inject the Cloudflare Web Analytics beacon into every generated page —
  see `documentation/cloudflare-web-analytics-setup.md`.
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

### Cloudflare Web Analytics — MkDocs + landing page beacon (2026-08-29)

Added tracking for Cabinet, per `documentation/cloudflare-web-analytics-setup.md`.
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
own rollout — tracked as `landing-v3-notes/three-world-launch-phases-ToDo.md`
items #135/#136.

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
`documentation/Landing-page-notes.2.0.md`'s changelog and
`documentation/conversation-landing-page-v3.md`'s narrative account — not
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
